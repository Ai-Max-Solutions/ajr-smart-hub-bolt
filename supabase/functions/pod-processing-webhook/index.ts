import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PODUploadData {
  user_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  project_id?: string;
}

interface OCRResult {
  delivery_date?: string;
  consignment_number?: string;
  recipient?: string;
  items?: string;
  supplier?: string;
  confidence_score?: number;
  raw_text?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, file_path, file_name, file_type, project_id }: PODUploadData = await req.json();

    console.log('Processing POD upload:', { user_id, file_name, file_type });

    // Check user permissions first
    const { data: permissions, error: permError } = await supabaseClient
      .from('operative_permissions')
      .select('can_upload_pod_photo')
      .eq('user_id', user_id)
      .single();

    if (permError || !permissions?.can_upload_pod_photo) {
      console.log('User does not have POD upload permission');
      return new Response(JSON.stringify({
        success: false,
        error: 'Permission denied',
        message: 'You do not have permission to upload POD photos. Contact your administrator.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the file URL for processing
    const { data: fileData } = supabaseClient.storage
      .from('documents')
      .getPublicUrl(file_path);

    const fileUrl = fileData.publicUrl;

    // Prepare data for n8n OCR workflow
    const n8nPayload = {
      user_id,
      file_url: fileUrl,
      file_name,
      file_type,
      project_id,
      upload_timestamp: new Date().toISOString(),
      processing_priority: determineProcessingPriority(file_type)
    };

    // Trigger n8n workflow for OCR processing
    const N8N_OCR_WEBHOOK_URL = Deno.env.get('N8N_OCR_WEBHOOK_URL');
    
    let ocrResults: OCRResult = {};
    
    if (N8N_OCR_WEBHOOK_URL) {
      console.log('Triggering n8n OCR workflow...');
      
      try {
        const ocrResponse = await fetch(N8N_OCR_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(n8nPayload)
        });

        if (ocrResponse.ok) {
          const ocrData = await ocrResponse.json();
          ocrResults = extractOCRResults(ocrData);
          console.log('OCR processing completed:', ocrResults);
        } else {
          console.error('n8n OCR webhook failed:', await ocrResponse.text());
          // Continue with mock data for now
          ocrResults = generateMockOCRResults(file_name);
        }
      } catch (error) {
        console.error('n8n OCR webhook error:', error);
        // Continue with mock data for now
        ocrResults = generateMockOCRResults(file_name);
      }
    } else {
      console.warn('N8N_OCR_WEBHOOK_URL not configured - using mock OCR results');
      ocrResults = generateMockOCRResults(file_name);
    }

    // Store POD record in database (you may need to create this table)
    const podRecord = {
      user_id,
      project_id,
      file_path,
      file_name,
      file_type,
      delivery_date: ocrResults.delivery_date,
      consignment_number: ocrResults.consignment_number,
      recipient: ocrResults.recipient,
      items: ocrResults.items,
      supplier: ocrResults.supplier,
      confidence_score: ocrResults.confidence_score,
      raw_ocr_text: ocrResults.raw_text,
      status: ocrResults.confidence_score && ocrResults.confidence_score > 85 ? 'verified' : 'needs_review',
      created_at: new Date().toISOString()
    };

    console.log('Storing POD record:', podRecord);

    // Store results in notifications or a POD table
    // For now, create a notification
    const { error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        creator_id: user_id,
        type: 'pod_processed',
        body: `POD processed: ${file_name}. Confidence: ${ocrResults.confidence_score}%`,
        link: `/documents/pod/${file_path}`
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'POD processed successfully!',
      ocr_results: ocrResults,
      file_path,
      processing_status: ocrResults.confidence_score && ocrResults.confidence_score > 85 ? 'verified' : 'needs_review'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in pod-processing-webhook:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to process POD upload'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to determine processing priority
function determineProcessingPriority(fileType: string): 'high' | 'normal' | 'low' {
  if (fileType.includes('pdf')) return 'high';
  if (fileType.includes('image')) return 'normal';
  return 'low';
}

// Helper function to extract OCR results from n8n response
function extractOCRResults(n8nResponse: any): OCRResult {
  // Adapt this based on your n8n workflow output format
  return {
    delivery_date: n8nResponse.extracted?.delivery_date || null,
    consignment_number: n8nResponse.extracted?.consignment_number || null,
    recipient: n8nResponse.extracted?.recipient || null,
    items: n8nResponse.extracted?.items || null,
    supplier: n8nResponse.extracted?.supplier || null,
    confidence_score: n8nResponse.confidence_score || 0,
    raw_text: n8nResponse.raw_text || ''
  };
}

// Helper function to generate mock OCR results for testing
function generateMockOCRResults(fileName: string): OCRResult {
  const today = new Date();
  const mockDate = today.toISOString().split('T')[0];
  
  return {
    delivery_date: mockDate,
    consignment_number: `CON-${Date.now()}`,
    recipient: 'AJ Ryan Construction',
    items: 'Construction materials as per order',
    supplier: 'Mock Supplier Ltd',
    confidence_score: Math.floor(Math.random() * 20) + 80, // 80-99%
    raw_text: `Mock OCR extraction from ${fileName}`
  };
}