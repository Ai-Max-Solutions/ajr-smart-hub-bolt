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

interface EvidenceChainEvent {
  projectId: string;
  operativeId: string;
  plotId?: string;
  documentId: string;
  documentType: 'RAMS' | 'Drawing' | 'Task_Plan' | 'Site_Notice' | 'POD';
  documentVersion: string;
  documentRevision?: string;
  actionType: 'view' | 'sign' | 'download' | 'print' | 'qr_scan' | 'upload' | 'supersede';
  signatureId?: string;
  deviceInfo?: any;
  metadata?: any;
}

interface QRValidationRequest {
  documentId: string;
  scannedBy: string;
  deviceInfo?: any;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface EvidenceExportRequest {
  exportType: 'project' | 'operative' | 'plot' | 'company' | 'custom';
  scopeData: {
    projectIds?: string[];
    operativeIds?: string[];
    plotIds?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
  exportFormat: 'pdf' | 'csv' | 'zip' | 'json';
  filters?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'log-event':
        return await handleLogEvent(req);
      case 'validate-qr':
        return await handleQRValidation(req);
      case 'export-evidence':
        return await handleEvidenceExport(req);
      case 'generate-poster':
        return await handlePosterGeneration(req);
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in evidence-chain-processor:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleLogEvent(req: Request) {
  const eventData: EvidenceChainEvent = await req.json();
  
  console.log('Logging evidence chain event:', eventData);

  const { data, error } = await supabase.rpc('log_evidence_chain_event', {
    p_project_id: eventData.projectId,
    p_operative_id: eventData.operativeId,
    p_plot_id: eventData.plotId || null,
    p_document_id: eventData.documentId,
    p_document_type: eventData.documentType,
    p_document_version: eventData.documentVersion,
    p_document_revision: eventData.documentRevision || null,
    p_action_type: eventData.actionType,
    p_signature_id: eventData.signatureId || null,
    p_device_info: eventData.deviceInfo || {},
    p_metadata: eventData.metadata || {}
  });

  if (error) {
    throw error;
  }

  // Generate proactive AI suggestions for compliance
  if (eventData.actionType === 'sign' || eventData.actionType === 'upload') {
    await generateComplianceSuggestions(eventData);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    recordId: data,
    message: 'Evidence chain event logged successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleQRValidation(req: Request) {
  const { documentId, scannedBy, deviceInfo, location }: QRValidationRequest = await req.json();
  
  console.log('Validating QR code for document:', documentId);

  const { data, error } = await supabase.rpc('validate_qr_document', {
    p_document_id: documentId,
    p_scanned_by: scannedBy,
    p_device_info: deviceInfo || {}
  });

  if (error) {
    throw error;
  }

  // Update poster scan count if applicable
  if (data.status === 'current') {
    await supabase
      .from('qr_posters')
      .update({ 
        last_scan_at: new Date().toISOString(),
        scan_count: supabase.sql`scan_count + 1`
      })
      .eq('document_versions', `{${documentId}}`);
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleEvidenceExport(req: Request) {
  const exportRequest: EvidenceExportRequest = await req.json();
  
  console.log('Processing evidence export:', exportRequest);

  // Create export record
  const { data: exportRecord, error: exportError } = await supabase
    .from('evidence_exports')
    .insert({
      export_type: exportRequest.exportType,
      scope_data: exportRequest.scopeData,
      export_format: exportRequest.exportFormat,
      filters_applied: exportRequest.filters || {},
      export_status: 'processing'
    })
    .select()
    .single();

  if (exportError) {
    throw exportError;
  }

  // Generate the actual export based on format
  const exportData = await generateEvidenceExport(exportRequest);
  
  // Update export record with results
  await supabase
    .from('evidence_exports')
    .update({
      file_url: exportData.fileUrl,
      file_size: exportData.fileSize,
      record_count: exportData.recordCount,
      export_status: 'completed'
    })
    .eq('id', exportRecord.id);

  return new Response(JSON.stringify({
    success: true,
    exportId: exportRecord.id,
    downloadUrl: exportData.fileUrl,
    recordCount: exportData.recordCount
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handlePosterGeneration(req: Request) {
  const { projectId, posterType, locationName, documentVersions, scope } = await req.json();
  
  console.log('Generating QR poster for project:', projectId);

  // Generate QR data for all document versions
  const qrData = {
    baseUrl: `https://smartwork.ajryan.co.uk/qr-check`,
    documents: documentVersions,
    projectId,
    generatedAt: new Date().toISOString()
  };

  // Create poster record
  const { data: poster, error } = await supabase
    .from('qr_posters')
    .insert({
      project_id: projectId,
      poster_type: posterType,
      location_name: locationName,
      scope_description: scope,
      document_versions: documentVersions,
      qr_data: qrData,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Generate actual poster PDF (simplified for demo)
  const posterUrl = await generatePosterPDF(poster);
  
  // Update poster with generated URL
  await supabase
    .from('qr_posters')
    .update({ poster_url: posterUrl })
    .eq('id', poster.id);

  return new Response(JSON.stringify({
    success: true,
    posterId: poster.id,
    posterUrl,
    qrData
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateComplianceSuggestions(eventData: EvidenceChainEvent) {
  // AI-powered compliance suggestions based on evidence patterns
  console.log('Generating AI compliance suggestions for:', eventData);
  
  // This would integrate with the AI system to provide proactive suggestions
  // For now, just log the trigger
}

async function generateEvidenceExport(request: EvidenceExportRequest) {
  // Simplified export generation - in production would create actual files
  console.log('Generating evidence export:', request);
  
  const recordCount = 150; // Mock count
  const fileSize = 2048576; // Mock size
  const fileUrl = `https://exports.ajryan.co.uk/evidence/${Date.now()}.${request.exportFormat}`;
  
  return {
    fileUrl,
    fileSize,
    recordCount
  };
}

async function generatePosterPDF(poster: any) {
  // Simplified poster generation - in production would create actual PDF
  console.log('Generating poster PDF:', poster);
  
  return `https://posters.ajryan.co.uk/${poster.id}.pdf`;
}