import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cheeky AI moods and personalities
const AI_MOODS = [
  {
    name: "Professional Overachiever",
    style: "ultra-professional headshot in business attire, confident smile, perfect lighting, corporate background",
    personality: "I'm feeling very serious today. Let's make you look like CEO material! 💼"
  },
  {
    name: "Creative Genius", 
    style: "artistic portrait with creative lighting, thoughtful expression, modern artistic background",
    personality: "Feeling artsy! Time to unleash your inner creative mastermind! 🎨"
  },
  {
    name: "Friendly Neighborhood Person",
    style: "warm and approachable portrait, genuine smile, casual professional attire, friendly atmosphere",
    personality: "I'm in a good mood - let's make you look like the friend everyone wants to have! 😊"
  },
  {
    name: "Mysterious Genius",
    style: "sophisticated portrait with dramatic lighting, intelligent gaze, modern minimalist background",
    personality: "Ooh, mysterious vibes today! Let's give you that 'I know secrets' look... 🕵️"
  },
  {
    name: "Quirky Character",
    style: "fun and unique portrait with personality, expressive features, colorful modern background",
    personality: "I'm feeling playful! Warning: May result in excessive charm and likeability! 🎭"
  },
  {
    name: "Tech Wizard",
    style: "modern tech-savvy portrait, confident and innovative look, sleek futuristic background",
    personality: "Beep boop! Let's make you look like you invented the future! 🤖"
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userRole, customStyle } = await req.json();

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Pick a random AI mood
    const selectedMood = AI_MOODS[Math.floor(Math.random() * AI_MOODS.length)];
    
    // Create base prompt
    let basePrompt = `Professional headshot portrait of a person working as a ${userRole || 'construction worker'}`;
    
    // Add user's name context if provided
    if (userName) {
      basePrompt += `, confident and professional appearance`;
    }

    // Use custom style or AI mood
    const finalPrompt = customStyle || `${basePrompt}, ${selectedMood.style}, high quality, realistic, well-lit, professional photography`;

    console.log(`AI Mood: ${selectedMood.name} - ${selectedMood.personality}`);
    console.log(`Generating image with prompt: ${finalPrompt}`);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: finalPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'png'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate image', details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        imageUrl: data.data[0].url,
        aiMood: selectedMood.name,
        aiPersonality: selectedMood.personality,
        prompt: finalPrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-profile-generator function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});