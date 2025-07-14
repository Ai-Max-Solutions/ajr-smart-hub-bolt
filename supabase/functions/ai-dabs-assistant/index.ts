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

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { message, projectName, userRole, conversationHistory } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Processing DABS assistant request:', { projectName, userRole, messageLength: message.length });

    // Build conversation context
    const contextMessages = conversationHistory ? conversationHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    })) : [];

    // Create system prompt for DABS assistant
    const systemPrompt = `You are an AI assistant specialized in creating Daily Access Briefing System (DABS) notices for construction sites. Your role is to help project managers create professional, clear, and actionable site communications.

CONTEXT:
- Project: ${projectName || 'General Site'}
- User Role: ${userRole || 'Manager'}
- Purpose: Create DABS briefings for site operatives

GUIDELINES:
1. DABS briefings should be concise, specific, and action-oriented
2. Focus on: safety updates, access restrictions, equipment changes, hazard alerts, work scheduling
3. Use clear, professional language that operatives can quickly understand
4. Include specific plot numbers, areas, or equipment when mentioned
5. Prioritize safety-critical information
6. Structure content logically (most important first)

RESPONSE FORMAT:
When the user provides information that can be turned into a complete DABS briefing, respond with:
1. A conversational response acknowledging their input
2. If appropriate, include a JSON object with the structured content:

{
  "generatedContent": {
    "title": "Professional DABS title (max 60 chars)",
    "content": "Professional formatted content with proper structure and safety focus"
  }
}

EXAMPLES OF GOOD DABS CONTENT:
- "Plot 1.02-1.15 Access Restricted - New Electrical Work"
- "Mandatory Scaffold Inspection - Level 3 South Wing"
- "Updated RAMS Required - Riser Installation Works"

Always maintain a helpful, professional tone and ask clarifying questions if the user's input is vague.`;

    // Call OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          ...contextMessages,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const aiResponse = openAIData.choices[0].message.content;

    console.log('AI Response generated successfully');

    // Try to extract structured content from response
    let generatedContent = null;
    try {
      // Look for JSON in the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*"generatedContent"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        generatedContent = parsed.generatedContent;
      }
    } catch (e) {
      // If no structured content found, that's okay
      console.log('No structured content extracted:', e);
    }

    // Return response
    return new Response(JSON.stringify({ 
      response: aiResponse,
      generatedContent: generatedContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-dabs-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: 'Failed to process DABS assistant request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});