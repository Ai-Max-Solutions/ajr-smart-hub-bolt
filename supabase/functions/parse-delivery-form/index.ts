import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryFormData {
  deliveryDate: string;
  deliveryTime: string;
  items: Array<{
    item: string;
    quantity: number;
  }>;
  deliveryMethod: {
    pallets?: number;
    bags?: number;
    bundles?: number;
    lengths?: number;
    unloadMethod: 'forklift' | 'by-hand' | 'pallet-truck';
  };
  vehicleDetails: {
    supplier: string;
    type: string;
    edgeProtection: boolean;
    over35T: boolean;
    weight?: string;
    forsNumber?: string;
    colour?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formText } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Parse this delivery request form and extract structured data. Return only valid JSON with no markdown formatting.

Form text: ${formText}

Extract the following structure:
{
  "deliveryDate": "YYYY-MM-DD",
  "deliveryTime": "HH:MM",
  "supplier": "supplier name",
  "items": [{"item": "item name", "quantity": number}],
  "deliveryMethod": {
    "pallets": number or null,
    "bags": number or null,
    "bundles": number or null,
    "lengths": number or null,
    "unloadMethod": "forklift|by-hand|pallet-truck"
  },
  "vehicleDetails": {
    "supplier": "string",
    "type": "vehicle type",
    "edgeProtection": boolean,
    "over35T": boolean,
    "weight": "string or null",
    "forsNumber": "string or null",
    "colour": "string or null"
  }
}

Validation rules:
- Delivery date must be at least 24 hours from now
- Return an error if date is invalid: {"error": "Invalid delivery date - must be at least 24 hours in advance"}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a form parsing assistant. Extract delivery request data and return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content;

    if (!extractedText) {
      throw new Error('No response from AI parser');
    }

    // Parse the JSON response
    let parsedData: DeliveryFormData;
    try {
      parsedData = JSON.parse(extractedText);
    } catch (e) {
      throw new Error('Invalid JSON response from AI parser');
    }

    // Validate 24-hour rule
    const deliveryDate = new Date(parsedData.deliveryDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (deliveryDate < tomorrow) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid delivery date - must be at least 24 hours in advance',
          parsedData: parsedData 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate summary
    const itemsSummary = parsedData.items.length > 0 
      ? `${parsedData.items.length} item(s) for ${parsedData.deliveryDate}`
      : 'No items specified';

    return new Response(
      JSON.stringify({
        success: true,
        parsedData,
        summary: `This request has ${itemsSummary} - valid delivery request.`,
        isValid: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in parse-delivery-form function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});