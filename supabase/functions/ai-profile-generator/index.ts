
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
  console.log(`[${new Date().toISOString()}] Request received: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Enhanced OpenAI API key validation with multiple fallback checks
    let openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Additional environment variable checks for different possible names
    if (!openAIApiKey) {
      openAIApiKey = Deno.env.get('OPENAI_KEY');
    }
    if (!openAIApiKey) {
      openAIApiKey = Deno.env.get('OPEN_AI_API_KEY');
    }
    
    console.log('Environment check:', {
      hasOpenAIKey: !!openAIApiKey,
      keyLength: openAIApiKey?.length || 0,
      keyPrefix: openAIApiKey?.substring(0, 10) || 'none',
      allEnvKeys: Object.keys(Deno.env.toObject()).filter(key => 
        key.toLowerCase().includes('openai') || key.toLowerCase().includes('api')
      )
    });
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found - checked multiple environment variable names');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured in environment variables. Please ensure OPENAI_API_KEY is set in Supabase secrets.',
          debug: {
            checkedKeys: ['OPENAI_API_KEY', 'OPENAI_KEY', 'OPEN_AI_API_KEY'],
            availableKeys: Object.keys(Deno.env.toObject()).filter(key => 
              key.toLowerCase().includes('api') || key.toLowerCase().includes('key')
            )
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Invalid JSON in request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request format. Please provide valid JSON.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { userName, userRole, customStyle, userId, selfieBase64, gender, ageRange, ethnicity } = requestBody;
    
    console.log('Request payload:', { 
      userName, 
      userRole, 
      customStyle: !!customStyle, 
      userId, 
      hasSelfie: !!selfieBase64,
      gender,
      ageRange,
      ethnicity
    });

    // Validate required fields
    if (!userId) {
      console.error('User ID is required');
      return new Response(
        JSON.stringify({ error: 'User ID is required for avatar generation.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Database service not configured. Please contact support.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get enhanced user data for personalization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, firstname, lastname, role, phone')
      .eq('supabase_auth_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return new Response(
        JSON.stringify({ error: 'Unable to fetch user profile. Please try again.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get CSCS card information
    const { data: cscsData, error: cscsError } = await supabase
      .from('cscs_cards')
      .select('card_type, card_color, qualifications')
      .eq('user_id', userData?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cscsError && cscsError.code !== 'PGRST116') {
      console.log('CSCS data fetch error (non-critical):', cscsError.message);
    }

    // Get user work types
    const { data: workTypes, error: workTypesError } = await supabase
      .from('user_work_types')
      .select('work_type')
      .eq('user_id', userData?.id);

    if (workTypesError) {
      console.log('Work types fetch error (non-critical):', workTypesError.message);
    }

    console.log('Enhanced user data loaded:', { 
      userData: !!userData, 
      cscsData: !!cscsData, 
      workTypesCount: workTypes?.length || 0 
    });

    // Pick a random AI mood
    const selectedMood = AI_MOODS[Math.floor(Math.random() * AI_MOODS.length)];
    
    // Determine job type visuals
    const effectiveRole = userData?.role || userRole || 'Operative';
    const workTypesList = workTypes?.map(wt => wt.work_type) || [];
    const primaryWorkType = workTypesList[0] || effectiveRole;
    const jobVisuals = JOB_TYPE_VISUALS[primaryWorkType] || JOB_TYPE_VISUALS['Default'];
    
    // Determine CSCS visuals
    const cscsColor = cscsData?.card_color || 'Default';
    const cscsVisuals = CSCS_VISUAL_MAPPING[cscsColor] || CSCS_VISUAL_MAPPING['Default'];
    
    // Build enhanced prompt with personalization and metadata
    let enhancedPrompt = `Professional headshot portrait of ${userName || 'a professional'} working as a ${effectiveRole}`;
    
    // Add demographic context if provided
    if (gender) enhancedPrompt += `, ${gender}`;
    if (ageRange) enhancedPrompt += `, ${ageRange} years old`;
    if (ethnicity) enhancedPrompt += `, ${ethnicity} ethnicity`;
    
    // Add CSCS context
    enhancedPrompt += `, ${cscsVisuals.description}`;
    
    // Add job-specific context
    enhancedPrompt += `, ${jobVisuals}`;
    
    // Add safety and compliance context
    enhancedPrompt += `, ${cscsVisuals.safety_level}`;
    
    // Add AJ Ryan branding
    enhancedPrompt += `, professional AJ Ryan Mechanical Services team member`;
    
    // Add work types context if available
    if (workTypesList.length > 0) {
      enhancedPrompt += `, specialized in ${workTypesList.join(', ')}`;
    }
    
    // Enhance with selfie if provided (vision analysis)
    if (selfieBase64) {
      try {
        console.log('Analyzing selfie for enhanced likeness...');
        const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: 'Describe this person\'s face for AI portrait generation: hair style, facial features, skin tone, distinctive characteristics. Keep it brief and professional.' },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${selfieBase64}` } }
              ]
            }],
            max_tokens: 150
          }),
        });
        
        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const faceDescription = visionData.choices[0]?.message?.content;
          if (faceDescription) {
            enhancedPrompt += `, matching facial features: ${faceDescription}`;
            console.log('Vision analysis completed successfully');
          }
        } else {
          console.log('Vision analysis failed, proceeding without enhancement');
        }
      } catch (visionError) {
        console.error('Vision analysis error (non-critical):', visionError);
      }
    }
    
    // Use custom style or enhanced AI mood
    const finalPrompt = customStyle || `${enhancedPrompt}, ${selectedMood.style}, high quality, realistic, well-lit, professional construction industry photography`;
    
    console.log('Enhanced prompt context:', {
      effectiveRole,
      primaryWorkType,
      cscsColor,
      cscsType: cscsData?.card_type,
      workTypes: workTypesList,
      mood: selectedMood.name
    });

    console.log(`Generating image with AI mood: ${selectedMood.name}`);

    // Test OpenAI API connectivity first
    console.log('Testing OpenAI API connectivity...');
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      const testError = await testResponse.text();
      console.error('OpenAI API connectivity test failed:', testError);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API key validation failed: ${testResponse.status} ${testResponse.statusText}`,
          details: testError
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('OpenAI API connectivity confirmed - proceeding with image generation');

    // Generate image with OpenAI
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
        quality: 'hd',
        response_format: 'b64_json'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown OpenAI error' }));
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'AI image generation failed. Please try again or contact support.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data = await response.json();
    
    // Validate OpenAI response structure
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      console.error('Unexpected OpenAI response structure:', data);
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI service. Please try again.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const base64Data = data.data[0].b64_json;
    console.log('OpenAI generated base64 image, length:', base64Data.length);

    // Convert base64 to buffer for upload
    let imageBuffer;
    try {
      imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    } catch (decodeError) {
      console.error('Base64 decode error:', decodeError);
      return new Response(
        JSON.stringify({ error: 'Failed to process generated image. Please try again.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (imageBuffer.length === 0) {
      console.error('Generated image buffer is empty');
      return new Response(
        JSON.stringify({ error: 'Generated image is empty. Please try again.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Upload to Supabase storage
    const fileName = `${userId}/ai-avatar-${Date.now()}.png`;
    console.log('Uploading to storage as:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, imageBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/png'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to save generated image. Please try again.' }),
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
        JSON.stringify({ error: 'Failed to update profile. Please try again.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Avatar updated successfully');
    
    // Return standardized success response
    return new Response(
      JSON.stringify({ 
        imageUrl: publicUrl,
        avatarUrl: publicUrl, // Keep for backwards compatibility
        aiMood: selectedMood.name,
        aiPersonality: selectedMood.personality,
        prompt: finalPrompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in ai-profile-generator function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred during avatar generation. Please try again or contact support.',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
