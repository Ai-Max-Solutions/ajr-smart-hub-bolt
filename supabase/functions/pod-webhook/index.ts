import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PODWebhookPayload {
  pod_id: string;
  project_id: string;
  pod_type: string;
  supplier_name: string;
  description: string;
  photo_url?: string;
  created_at: string;
  uploaded_by: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (req.method === 'POST') {
      // Parse the webhook payload
      const payload: PODWebhookPayload = await req.json()
      
      console.log('Received POD webhook:', payload)

      // Get additional POD details from database
      const { data: podData, error: podError } = await supabase
        .from('pod_register')
        .select(`
          *,
          Users!pod_register_uploaded_by_fkey(fullname, email),
          Projects(projectname, clientname),
          suppliers(name, contact_email)
        `)
        .eq('id', payload.pod_id)
        .single()

      if (podError) {
        console.error('Error fetching POD details:', podError)
        throw podError
      }

      // Prepare webhook data for n8n
      const webhookData = {
        pod_id: payload.pod_id,
        project_name: podData.Projects?.projectname,
        client_name: podData.Projects?.clientname,
        pod_type: payload.pod_type,
        supplier_name: payload.supplier_name,
        description: payload.description,
        photo_url: payload.photo_url,
        uploaded_by: podData.Users?.fullname,
        uploaded_by_email: podData.Users?.email,
        created_at: payload.created_at,
        timestamp: new Date().toISOString(),
        // Additional metadata for n8n workflow
        metadata: {
          project_id: payload.project_id,
          upload_source: 'ajryan_smartwork_hub',
          pod_status: 'pending',
          requires_approval: true
        }
      }

      // Send to n8n webhook (you'll need to configure this URL)
      const n8nWebhookUrl = Deno.env.get('N8N_POD_WEBHOOK_URL')
      
      if (n8nWebhookUrl) {
        try {
          const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData)
          })

          if (!n8nResponse.ok) {
            console.error('n8n webhook failed:', await n8nResponse.text())
          } else {
            console.log('Successfully sent POD data to n8n')
          }
        } catch (error) {
          console.error('Error sending to n8n:', error)
        }
      } else {
        console.log('N8N_POD_WEBHOOK_URL not configured, skipping n8n integration')
      }

      // Log the activity
      await supabase
        .from('activity_metrics')
        .insert({
          user_id: payload.uploaded_by,
          action_type: 'pod_created',
          table_name: 'pod_register',
          record_id: payload.pod_id,
          metadata: webhookData
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'POD webhook processed successfully',
          pod_id: payload.pod_id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Handle GET requests to test the webhook
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          message: 'POD Webhook endpoint is active',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )

  } catch (error) {
    console.error('POD webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})