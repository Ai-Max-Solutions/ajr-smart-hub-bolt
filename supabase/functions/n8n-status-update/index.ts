import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusUpdate {
  type: 'hire_request' | 'pod_processing';
  id: string;
  status: string;
  message?: string;
  data?: any;
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

    const { type, id, status, message, data }: StatusUpdate = await req.json();

    console.log('Received status update:', { type, id, status });

    switch (type) {
      case 'hire_request':
        await handleHireRequestUpdate(supabaseClient, id, status, message, data);
        break;
      
      case 'pod_processing':
        await handlePODProcessingUpdate(supabaseClient, id, status, message, data);
        break;
      
      default:
        throw new Error(`Unknown update type: ${type}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Status updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in n8n-status-update:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleHireRequestUpdate(
  supabase: any,
  requestId: string,
  status: string,
  message?: string,
  data?: any
) {
  console.log('Updating hire request:', requestId, status);

  // Update hire request status
  const { error: updateError } = await supabase
    .from('hire_requests')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(data?.airtable_record_id && { airtable_record_id: data.airtable_record_id }),
      ...(data?.hire_company_response && { notes: data.hire_company_response })
    })
    .eq('id', requestId);

  if (updateError) {
    throw updateError;
  }

  // Get the hire request to find the user
  const { data: hireRequest, error: fetchError } = await supabase
    .from('hire_requests')
    .select('user_id, equipment_type')
    .eq('id', requestId)
    .single();

  if (fetchError) {
    console.error('Error fetching hire request:', fetchError);
    return;
  }

  // Create notification for status update
  const notificationMessage = getHireStatusMessage(status, hireRequest.equipment_type, message);
  
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      creator_id: hireRequest.user_id,
      type: 'hire_update',
      body: notificationMessage,
      link: `/admin/hire-requests/${requestId}`
    });

  if (notifError) {
    console.error('Error creating notification:', notifError);
  }
}

async function handlePODProcessingUpdate(
  supabase: any,
  podId: string,
  status: string,
  message?: string,
  data?: any
) {
  console.log('Updating POD processing:', podId, status);

  // Create notification for POD processing update
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      creator_id: podId, // Assuming this is the user_id for now
      type: 'pod_update',
      body: message || `POD processing ${status}`,
      link: `/documents/pod/${podId}`
    });

  if (notifError) {
    console.error('Error creating POD notification:', notifError);
  }
}

function getHireStatusMessage(status: string, equipmentType: string, customMessage?: string): string {
  if (customMessage) return customMessage;

  const statusMessages = {
    'confirmed': `Great news! Your ${equipmentType} hire has been confirmed - that's watertight! 🚛`,
    'delivered': `${equipmentType} has been delivered to site - smooth as silk! ⚡`,
    'completed': `${equipmentType} hire completed successfully - no leaks in this operation! ✅`,
    'cancelled': `Sorry, ${equipmentType} hire was cancelled - but don't worry, we'll sort another option! ❌`,
    'delayed': `${equipmentType} delivery delayed - but we're on it like a plumber on a leak! ⏰`
  };

  return statusMessages[status] || `${equipmentType} hire status: ${status}`;
}