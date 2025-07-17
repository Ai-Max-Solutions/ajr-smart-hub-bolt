import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Job type to visual mapping for enhanced avatars
const JOB_TYPE_VISUALS = {
  'Sprinkler Fitter': 'sprinkler system pipes and fittings in background, wearing safety gear',
  'Plumber': 'plumbing tools and pipes, professional plumber appearance',
  'Electrician': 'electrical equipment and wiring, electrician in safety vest',
  'Heating Engineer': 'heating systems and boilers, HVAC professional',
  'Gas Engineer': 'gas installation equipment, certified gas professional',
  'Multi-Skilled Engineer': 'various technical equipment, versatile engineer',
  'Testing & Commissioning Engineer': 'testing equipment and instruments, commissioning specialist',
  'Project Manager': 'construction site background, management professional',
  'Site Supervisor': 'construction site with hard hat, supervisory role',
  'Apprentice': 'learning environment, young professional with tools',
  'Operative': 'construction site environment, skilled worker',
  'Default': 'construction site background, professional worker'
};

// CSCS card color mapping to visual elements
const CSCS_VISUAL_MAPPING = {
  'Green': { description: 'Green CSCS card holder, skilled laborer', safety_level: 'standard safety gear' },
  'Blue': { description: 'Blue CSCS card holder, skilled worker', safety_level: 'professional safety equipment' },
  'Gold': { description: 'Gold CSCS card holder, supervisor level', safety_level: 'high-visibility supervisor gear' },
  'White': { description: 'White CSCS card holder, manager level', safety_level: 'management attire with safety elements' },
  'Red': { description: 'Red CSCS card holder, trainee', safety_level: 'trainee safety gear' },
  'Default': { description: 'CSCS compliant worker', safety_level: 'standard safety gear' }
};

// Enhanced AI moods with AJ Ryan branding
const AI_MOODS = [
  {
    name: "AJ Ryan Professional",
    style: "professional construction industry headshot, confident and competent, modern industrial background with AJ Ryan brand colors (dark blue #1d1e3d and yellow #ffcf21)",
    personality: "Ready to showcase your AJ Ryan professionalism! Looking sharp and site-ready! 🏗️"
  },
  {
    name: "Safety First Expert", 
    style: "professional safety-focused portrait, high-visibility gear, construction site background, AJ Ryan brand styling",
    personality: "Safety first, style second! Well, actually both are first-class today! 🦺"
  },
  {
    name: "Technical Specialist",
    style: "expert professional headshot, technical competence visible, clean industrial background with subtle AJ Ryan branding",
    personality: "Looking like the technical expert you are - clients will be impressed! 🔧"
  },
  {
    name: "Team Leader",
    style: "confident leadership portrait, approachable but authoritative, construction management setting with AJ Ryan colors",
    personality: "Leadership vibes activated! Ready to inspire your team! 👷‍♂️"
  },
  {
    name: "AJ Ryan Pride",
    style: "proud AJ Ryan team member, professional company representation, branded background elements",
    personality: "Representing AJ Ryan with style! Company pride level: Maximum! 💼"
  },
  {
    name: "Site Ready",
    style: "ready-for-action portrait, practical work attire, dynamic construction environment, AJ Ryan branded elements",
    personality: "Site-ready and looking good! Let's build something amazing! 🚧"
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

    // Get enhanced user data for personalization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, firstname, lastname, role')
      .eq('supabase_auth_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
    }

    // Get CSCS card information
    const { data: cscsData, error: cscsError } = await supabase
      .from('cscs_cards')
      .select('card_type, card_color, qualifications')
      .eq('user_id', userData?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cscsError) {
      console.log('No CSCS data found or error:', cscsError.message);
    }

    console.log('Enhanced user data:', { userData, cscsData });

    // Pick a random AI mood
    const selectedMood = AI_MOODS[Math.floor(Math.random() * AI_MOODS.length)];
    
    // Determine job type visuals
    const effectiveRole = userData?.role || userRole || 'Operative';
    const jobTypeKey = effectiveRole;
    const jobVisuals = JOB_TYPE_VISUALS[jobTypeKey] || JOB_TYPE_VISUALS['Default'];
    
    // Determine CSCS visuals
    const cscsColor = cscsData?.card_color || 'Default';
    const cscsVisuals = CSCS_VISUAL_MAPPING[cscsColor] || CSCS_VISUAL_MAPPING['Default'];
    
    // Build enhanced prompt with personalization
    let enhancedPrompt = `Professional headshot portrait of ${userName || 'a professional'} working as a ${effectiveRole}`;
    
    // Add CSCS context
    enhancedPrompt += `, ${cscsVisuals.description}`;
    
    // Add job-specific context
    enhancedPrompt += `, ${jobVisuals}`;
    
    // Add safety and compliance context
    enhancedPrompt += `, ${cscsVisuals.safety_level}`;
    
    // Add AJ Ryan branding
    enhancedPrompt += `, professional AJ Ryan Mechanical Services team member`;
    
    // Add qualifications context if available
    if (cscsData?.qualifications?.primary_qualification) {
      enhancedPrompt += `, ${cscsData.qualifications.primary_qualification} qualified`;
    }
    
    // Use custom style or enhanced AI mood
    const finalPrompt = customStyle || `${enhancedPrompt}, ${selectedMood.style}, high quality, realistic, well-lit, professional construction industry photography`;
    
    console.log('Enhanced prompt context:', {
      effectiveRole,
      jobTypeKey,
      cscsColor,
      cscsType: cscsData?.card_type,
      qualifications: cscsData?.qualifications
    });

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
      .from('users')
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