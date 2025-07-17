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

    // Initialize Supabase with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authorization header for user identification
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && authUser) {
          user = authUser;
          console.log('User authenticated successfully:', user.id);
        } else {
          console.log('Authentication failed, but proceeding with anonymous analysis:', authError);
        }
      } catch (error) {
        console.log('Token validation failed, proceeding anonymously:', error);
      }
    } else {
      console.log('No authorization header provided, proceeding anonymously');
    }

    // For now, if no user, we'll still process but won't store in database
    if (!user) {
      console.log('Processing CSCS card analysis without user context');
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
                text: `You are a CSCS card OCR assistant. Read the uploaded card and extract:
- Card Number (8–16 digits)
- Card Type (e.g., Green, Blue, Gold)
- Expiry Date (in YYYY-MM-DD)

If any info is missing or unclear, return it as null.

Output JSON:
{
  "cardNumber": "...",
  "cardType": "...",
  "expiryDate": "..."
}`
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

    // Store the analysis result in the database if user is authenticated
    let storedAnalysis = null;
    
    if (user) {
      console.log('Storing analysis result for user:', user.id);
      const { data: analysis, error: dbError } = await supabase
        .from('cscs_cards')
        .insert({
          user_id: user.id,
          front_image_url: imageUrl,
          card_type: analysisResult.cardType || 'Operative',
          expiry_date: analysisResult.expiryDate,
          card_number: analysisResult.cardNumber,
          confidence_score: 0.8, // Default confidence for simplified analysis
          raw_ai_response: aiResponse
        })
        .select()
        .maybeSingle();

      if (dbError) {
        console.error('Database error:', dbError);
        console.error('Database error details:', JSON.stringify(dbError, null, 2));
        // Don't fail the analysis, just log the error and continue
        console.log('Continuing with analysis despite database error');
      } else {
        storedAnalysis = analysis;
        console.log('Analysis stored successfully:', storedAnalysis);

        // IMPORTANT: Set cscs_required = true after successful CSCS card upload
        const { error: updateError } = await supabase
          .from('Users')
          .update({ cscs_required: true })
          .eq('supabase_auth_id', user.id);

        if (updateError) {
          console.error('Error updating cscs_required flag:', updateError);
        } else {
          console.log('Successfully set cscs_required = true for user:', user.id);
        }
      }
    } else {
      console.log('No user authenticated, skipping database storage');
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        stored_id: storedAnalysis?.id || null,
        user_authenticated: !!user
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