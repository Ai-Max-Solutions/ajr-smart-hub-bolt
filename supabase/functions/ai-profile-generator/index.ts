import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { userName, userRole, customStyle, userId } = await req.json();
    console.log('Received request:', { userName, userRole, customStyle, userId });
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!userId) {
      console.error('User ID is required');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
        model: 'dall-e-3',
        prompt: finalPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd'
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
    
    // Check if we have the expected response structure
    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error('Unexpected OpenAI response structure:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid response from image generation service' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const openAIImageUrl = data.data[0].url;
    console.log('OpenAI generated image URL:', openAIImageUrl);

    // Fetch the image from OpenAI (server-side, no CORS issues)
    console.log('Fetching image from OpenAI...');
    const imageResponse = await fetch(openAIImageUrl);
    
    if (!imageResponse.ok) {
      console.error('Failed to fetch image from OpenAI:', imageResponse.status, imageResponse.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch generated image from OpenAI' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const imageBlob = await imageResponse.blob();
    console.log('Image blob size:', imageBlob.size, 'type:', imageBlob.type);

    if (imageBlob.size === 0) {
      console.error('Generated image is empty');
      return new Response(
        JSON.stringify({ error: 'Generated image is empty' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Upload to Supabase storage
    const fileName = `${userId}/ai-avatar-${Date.now()}.png`;
    console.log('Uploading to storage as:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, imageBlob, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: `Storage upload failed: ${uploadError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    console.log('Public URL generated:', publicUrl);

    // Update user's avatar URL in database
    const { error: updateError } = await supabase
      .from('Users')
      .update({ avatar_url: publicUrl })
      .eq('supabase_auth_id', userId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: `Database update failed: ${updateError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Avatar updated successfully');
    
    return new Response(
      JSON.stringify({ 
        avatarUrl: publicUrl,
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