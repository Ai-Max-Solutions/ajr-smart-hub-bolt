import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('CSCS Card Analyzer function called');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    if (!openRouterApiKey) {
      console.error('OpenRouter API key not found in environment variables');
      console.error('Available env vars:', Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user session
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing CSCS card with OpenRouter (Claude 3.5 Sonnet)');

    // First, we need to get the image as base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    
    // Convert to base64 using a more memory-efficient approach
    const uint8Array = new Uint8Array(imageArrayBuffer);
    let binaryString = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid stack overflow
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const imageBase64 = btoa(binaryString);
    const imageType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Call OpenRouter API with Claude 3.5 Sonnet
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ajryan.smartwork.lovable.app',
        'X-Title': 'AJ Ryan SmartWork CSCS Card Analyzer'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert at analyzing CSCS (Construction Skills Certification Scheme) cards from the UK construction industry.

Analyze this CSCS card image and extract information in JSON format. Map the card type to one of these specific values:
- "Labourer" (Green cards)
- "Apprentice" (Red cards)
- "Trainee" (Red cards)
- "Experienced Worker" (Red cards)
- "Experienced Technical/Supervisor/Manager" (Red cards)
- "Skilled Worker" (Blue cards)
- "Gold – Advanced Craft" (Gold cards)
- "Gold – Supervisor" (Gold cards)
- "Academically Qualified Person" (White cards)
- "Professionally Qualified Person" (White cards)
- "Manager" (Black cards)
- "Operative" (Default when unsure)

{
  "card_number": "Card/Registration number (look for REG.NO., CARD NO.)",
  "expiry_date": "Expiry date in YYYY-MM-DD format",
  "card_color": "Main card color (Green, Red, Blue, Gold, White, Black)",
  "card_type": "Mapped to one of the values above - default to 'Operative' if unsure",
  "qualifications": {
    "primary_qualification": "Main qualification shown",
    "additional_qualifications": ["Additional qualifications"],
    "work_categories": ["Work categories authorized"]
  },
  "confidence_score": 0.95,
  "extracted_text": "Key text from the card"
}

Mapping Rules:
- If you see "MATE" or similar basic text → use "Operative"
- Green cards → typically "Labourer" or "Operative"
- Red cards → "Apprentice", "Trainee", "Experienced Worker", or "Experienced Technical/Supervisor/Manager"
- Blue cards → "Skilled Worker"
- Gold cards → "Gold – Advanced Craft" or "Gold – Supervisor"
- White cards → "Academically Qualified Person" or "Professionally Qualified Person"
- Black cards → "Manager"
- When in doubt → use "Operative"

Return only valid JSON.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('OpenRouter response:', aiResponse);

    if (!aiResponse.choices || !aiResponse.choices[0]) {
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiContent = aiResponse.choices[0].message.content;
    console.log('AI analysis result:', aiContent);

    let analysisResult;
    try {
      // Parse the JSON response from AI
      analysisResult = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store the analysis result in the database
    const { data: storedAnalysis, error: dbError } = await supabase
      .from('cscs_cards')
      .insert({
        user_id: user.id,
        file_url: imageUrl,
        cscs_card_type: analysisResult.card_type || 'Operative',
        custom_card_type: analysisResult.card_type && !['Labourer', 'Apprentice', 'Trainee', 'Experienced Worker', 'Experienced Technical/Supervisor/Manager', 'Skilled Worker', 'Gold – Advanced Craft', 'Gold – Supervisor', 'Academically Qualified Person', 'Professionally Qualified Person', 'Manager', 'Operative'].includes(analysisResult.card_type) ? analysisResult.card_type : null,
        expiry_date: analysisResult.expiry_date,
        card_number: analysisResult.card_number,
        card_color: analysisResult.card_color,
        qualifications: analysisResult.qualifications,
        confidence_score: analysisResult.confidence_score,
        raw_ai_response: aiResponse
      })
      .select()
      .maybeSingle();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // IMPORTANT: Set cscs_required = true after successful CSCS card upload
    const { error: updateError } = await supabase
      .from('Users')
      .update({ cscs_required: true })
      .eq('supabase_auth_id', user.id);

    if (updateError) {
      console.error('Error updating cscs_required flag:', updateError);
      // Don't fail the whole request, just log it
    } else {
      console.log('Successfully set cscs_required = true for user:', user.id);
    }

    console.log('Analysis completed and stored:', storedAnalysis);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        stored_id: storedAnalysis.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cscs-card-analyzer function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});