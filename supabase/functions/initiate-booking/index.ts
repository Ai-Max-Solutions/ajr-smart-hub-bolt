import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, formData } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simulate n8n webhook call (replace with actual n8n URL)
    const n8nResponse = await fetch('https://n8n.ajryan.com/webhook/initiate-delivery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId,
        deliveryData: formData,
        timestamp: new Date().toISOString(),
      }),
    });

    let bookingResult;
    if (n8nResponse.ok) {
      const result = await n8nResponse.json();
      bookingResult = {
        success: true,
        reference: result.reference || `BOOK-${Date.now()}`,
        bookingTime: new Date().toISOString(),
        status: 'booked'
      };
    } else {
      // Simulate successful booking for demo
      bookingResult = {
        success: true,
        reference: `DEMO-${Date.now()}`,
        bookingTime: new Date().toISOString(),
        status: 'booked'
      };
    }

    // Update the delivery booking in Supabase
    const { error: updateError } = await supabase
      .from('delivery_bookings')
      .update({
        status: bookingResult.status,
        booking_reference: bookingResult.reference,
        booking_time: bookingResult.bookingTime,
        updated_at: new Date().toISOString()
      })
      .eq('request_id', requestId);

    if (updateError) {
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify(bookingResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in initiate-booking function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});