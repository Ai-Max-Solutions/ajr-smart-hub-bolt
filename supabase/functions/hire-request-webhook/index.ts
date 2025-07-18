import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HireRequestData {
  user_id: string;
  pickup_address: string;
  delivery_address: string;
  hire_date: string;
  hire_time?: string;
  equipment_type: string;
  notes?: string;
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

    const { user_id, pickup_address, delivery_address, hire_date, hire_time, equipment_type, notes }: HireRequestData = await req.json();

    console.log('Processing hire request:', { user_id, equipment_type, hire_date });

    // Insert hire request into database
    const { data: hireRequest, error: insertError } = await supabaseClient
      .from('hire_requests')
      .insert({
        user_id,
        pickup_address,
        delivery_address,
        hire_date,
        hire_time,
        equipment_type,
        notes,
        status: 'pending',
        hire_company_contacted: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Hire request created:', hireRequest.id);

    // Prepare data for n8n workflow
    const n8nPayload = {
      request_id: hireRequest.id,
      pickup_address,
      delivery_address,
      hire_date,
      hire_time,
      equipment_type,
      notes,
      urgency: determineUrgency(hire_date),
      contact_script: generateContactScript({
        equipment_type,
        pickup_address,
        delivery_address,
        hire_date,
        hire_time
      })
    };

    // Trigger n8n workflow for AI voice call
    // Replace YOUR_N8N_WEBHOOK_URL with your actual n8n webhook URL
    const N8N_HIRE_WEBHOOK_URL = Deno.env.get('N8N_HIRE_WEBHOOK_URL');
    
    if (N8N_HIRE_WEBHOOK_URL) {
      console.log('Triggering n8n workflow...');
      
      // Use background task to avoid blocking response
      const n8nCall = fetch(N8N_HIRE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(n8nPayload)
      }).then(async (response) => {
        console.log('n8n webhook response status:', response.status);
        
        if (response.ok) {
          // Update hire request status
          await supabaseClient
            .from('hire_requests')
            .update({ 
              hire_company_contacted: true,
              status: 'in_progress'
            })
            .eq('id', hireRequest.id);
          
          console.log('Updated hire request status to in_progress');
        } else {
          console.error('n8n webhook failed:', await response.text());
          
          // Update status to indicate failure
          await supabaseClient
            .from('hire_requests')
            .update({ status: 'cancelled' })
            .eq('id', hireRequest.id);
        }
      }).catch(async (error) => {
        console.error('n8n webhook error:', error);
        
        // Update status to indicate failure
        await supabaseClient
          .from('hire_requests')
          .update({ status: 'cancelled' })
          .eq('id', hireRequest.id);
      });

      // Don't wait for n8n call to complete
      if (EdgeRuntime?.waitUntil) {
        EdgeRuntime.waitUntil(n8nCall);
      }
    } else {
      console.warn('N8N_HIRE_WEBHOOK_URL not configured - skipping n8n workflow');
    }

    return new Response(JSON.stringify({
      success: true,
      request_id: hireRequest.id,
      message: 'Hire request submitted successfully! AI is calling the hire company now.',
      status: 'pending'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in hire-request-webhook:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to process hire request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to determine urgency based on hire date
function determineUrgency(hireDateStr: string): 'urgent' | 'normal' | 'planned' {
  const hireDate = new Date(hireDateStr);
  const now = new Date();
  const daysDiff = Math.ceil((hireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 1) return 'urgent';
  if (daysDiff <= 3) return 'normal';
  return 'planned';
}

// Helper function to generate AI contact script
function generateContactScript(data: {
  equipment_type: string;
  pickup_address: string;
  delivery_address: string;
  hire_date: string;
  hire_time?: string;
}): string {
  const timeStr = data.hire_time ? ` at ${data.hire_time}` : '';
  
  return `Hello, this is an automated call from AJ Ryan Construction. We need to arrange equipment hire. 

Details:
- Equipment: ${data.equipment_type}
- Pickup from: ${data.pickup_address}
- Deliver to: ${data.delivery_address}
- Date needed: ${data.hire_date}${timeStr}

Please confirm availability and provide a quote. This is an urgent request for our active construction project. Thank you.`;
}