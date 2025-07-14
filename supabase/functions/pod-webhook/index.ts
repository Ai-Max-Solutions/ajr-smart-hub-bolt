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
  pod_category: 'DELIVERY' | 'HIRE_RETURN';
  supplier_name: string;
  description: string;
  status: string;
  plot_location?: string;
  order_reference?: string;
  hire_item_id?: string;
  quantity_expected?: number;
  quantity_received?: number;
  condition_on_arrival?: string;
  discrepancy_value?: number;
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

      // Fetch additional POD details from Supabase
      const { data: podDetails, error: podError } = await supabase
        .from('pod_register')
        .select(`
          *,
          Users!pod_register_uploaded_by_fkey(fullname, email),
          Projects(projectname, siteaddress)
        `)
        .eq('id', payload.pod_id)
        .single()

      if (podError) {
        console.error('Error fetching POD details:', podError)
        throw podError
      }

      // Prepare data for n8n webhook with enhanced structure
      const n8nPayload = {
        // Core POD info
        pod_id: podDetails.id,
        pod_type: podDetails.pod_type,
        pod_category: podDetails.pod_category,
        supplier_name: podDetails.supplier_name,
        description: podDetails.description,
        status: podDetails.status,
        created_at: podDetails.created_at,
        
        // Enhanced delivery/collection details
        plot_location: podDetails.plot_location || null,
        order_reference: podDetails.order_reference || null,
        hire_item_id: podDetails.hire_item_id || null,
        quantity_expected: podDetails.quantity_expected || null,
        quantity_received: podDetails.quantity_received || null,
        condition_on_arrival: podDetails.condition_on_arrival || 'good',
        discrepancy_value: podDetails.discrepancy_value || 0,
        supplier_contact: podDetails.supplier_contact || null,
        delivery_method: podDetails.delivery_method || null,
        
        // Project context
        project_id: podDetails.project_id,
        project_name: podDetails.Projects?.projectname || 'Unknown Project',
        site_address: podDetails.Projects?.siteaddress || 'Unknown Address',
        
        // User context
        uploaded_by: podDetails.Users?.fullname || 'Unknown User',
        uploaded_by_email: podDetails.Users?.email || '',
        
        // Media
        pod_photo_url: podDetails.pod_photo_url || null,
        signed_by_name: podDetails.signed_by_name || null,
        damage_notes: podDetails.damage_notes || null,
        
        // Calculated fields for business logic
        has_discrepancy: (podDetails.condition_on_arrival !== 'good' || podDetails.discrepancy_value > 0),
        quantity_variance: podDetails.quantity_expected && podDetails.quantity_received 
          ? podDetails.quantity_received - podDetails.quantity_expected 
          : 0,
        
        // Workflow routing metadata
        webhook_type: 'pod_created',
        workflow_category: podDetails.pod_category?.toLowerCase() || 'delivery',
        priority: podDetails.condition_on_arrival !== 'good' ? 'high' : 'normal',
        timestamp: new Date().toISOString()
      }

      // Send to n8n webhook (differentiate by category for separate workflows)
      const n8nWebhookUrl = Deno.env.get('N8N_POD_WEBHOOK_URL')
      
      if (n8nWebhookUrl) {
        try {
          const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(n8nPayload)
          })

          if (!response.ok) {
            console.error('n8n webhook failed:', await response.text())
          } else {
            console.log(`Successfully sent ${payload.pod_category} POD data to n8n`)
          }
        } catch (error) {
          console.error('Error sending to n8n:', error)
        }
      } else {
        console.log('N8N_POD_WEBHOOK_URL not configured, skipping n8n integration')
      }

      // Log the activity with enhanced metadata
      await supabase
        .from('activity_metrics')
        .insert({
          user_id: payload.uploaded_by,
          action_type: 'pod_created',
          table_name: 'pod_register',
          record_id: payload.pod_id,
          metadata: {
            pod_category: payload.pod_category,
            pod_type: payload.pod_type,
            has_discrepancy: n8nPayload.has_discrepancy,
            discrepancy_value: payload.discrepancy_value || 0,
            quantity_variance: n8nPayload.quantity_variance,
            workflow_priority: n8nPayload.priority
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${payload.pod_category} POD webhook processed successfully`,
          pod_id: payload.pod_id,
          category: payload.pod_category,
          has_discrepancy: n8nPayload.has_discrepancy
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
          message: 'Enhanced POD Webhook endpoint is active',
          supports: ['DELIVERY', 'HIRE_RETURN'],
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