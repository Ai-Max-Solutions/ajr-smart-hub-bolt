import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('CSCS Card Analyzer function called');

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
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

    console.log('Analyzing CSCS card with OpenAI Vision API');

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing CSCS (Construction Skills Certification Scheme) cards. Analyze the provided CSCS card image and extract the following information in JSON format:

{
  "card_number": "16-digit card number (if visible)",
  "expiry_date": "expiry date in YYYY-MM-DD format (if visible)",
  "card_color": "main color of the card (Green, Blue, Yellow, White, Black, Gold, etc.)",
  "card_type": "specific card type (e.g., Labourer, Skilled Worker, Supervisor, Trainee, Manager, etc.)",
  "qualifications": {
    "primary_qualification": "main qualification shown",
    "additional_qualifications": ["list of any additional qualifications shown"],
    "work_categories": ["what types of work this card allows"]
  },
  "confidence_score": 0.95,
  "extracted_text": "any other relevant text visible on the card"
}

Focus on:
- Card color (this determines the skill level)
- Any text indicating qualifications or job roles
- Expiry date
- Card number if clearly visible
- Work categories the holder is qualified for

Common CSCS card types by color:
- Green: Labourer
- Blue: Skilled Worker (various trades)
- Yellow: Supervisor
- White: Trainee
- Black: Manager/Professionally Qualified
- Gold: Academically Qualified

Return only valid JSON. If information is not clearly visible, use null for that field.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this CSCS card and extract all relevant information.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
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
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('OpenAI response:', aiResponse);

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
      .from('cscs_card_analysis')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        card_number: analysisResult.card_number,
        expiry_date: analysisResult.expiry_date,
        card_color: analysisResult.card_color,
        card_type: analysisResult.card_type,
        qualifications: analysisResult.qualifications,
        confidence_score: analysisResult.confidence_score,
        raw_ai_response: aiResponse
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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