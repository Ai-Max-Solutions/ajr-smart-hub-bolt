import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, userId, deviceInfo, location } = await req.json();
    
    console.log('QR Scan validation request:', { documentId, userId });

    // Validate QR code and get document status
    const { data: validationResult, error } = await supabase.rpc('validate_qr_document', {
      p_document_id: documentId,
      p_scanned_by: userId,
      p_device_info: deviceInfo || {}
    });

    if (error) {
      console.error('QR validation error:', error);
      throw error;
    }

    // Log evidence chain event for QR scan
    await supabase.rpc('log_evidence_chain_event', {
      p_project_id: validationResult.project_id,
      p_operative_id: userId,
      p_document_id: documentId,
      p_document_type: validationResult.document_type || 'Drawing',
      p_document_version: validationResult.version || '1.0',
      p_action_type: 'qr_scan',
      p_device_info: deviceInfo || {},
      p_metadata: {
        scan_result: validationResult.status,
        location: location
      }
    });

    // Check if document is superseded and create alert
    if (validationResult.status === 'superseded') {
      await createSupersededAlert(documentId, userId, validationResult);
    }

    // Generate response with AJ Ryan branding
    const response = {
      success: true,
      validation: validationResult,
      timestamp: new Date().toISOString(),
      branding: {
        company: 'AJ Ryan Construction',
        logo: 'https://ajryan.co.uk/logo.png',
        colors: {
          primary: '#1d1e3d',
          accent: '#ffcf21'
        }
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in qr-scan-validator:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createSupersededAlert(documentId: string, userId: string, validationResult: any) {
  try {
    const { error } = await supabase
      .from('smart_revision_alerts')
      .insert({
        document_version_id: validationResult.document_id,
        alert_type: 'superseded',
        target_users: [userId],
        alert_message: `Document scanned is superseded. Latest version is ${validationResult.latest_version}`,
        urgency_level: 'high',
        ai_generated: true
      });

    if (error) {
      console.error('Error creating superseded alert:', error);
    }
  } catch (error) {
    console.error('Error in createSupersededAlert:', error);
  }
}