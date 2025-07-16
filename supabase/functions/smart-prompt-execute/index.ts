import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmartPromptRequest {
  template_id: string;
  input_text: string;
  context?: Record<string, any>;
  mobile_device?: boolean;
  voice_input?: boolean;
  offline_mode?: boolean;
}

interface ContextData {
  user_qualifications?: any[];
  team_members?: any[];
  project_data?: any;
  timesheet_data?: any[];
  [key: string]: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { template_id, input_text, context = {}, mobile_device = false, voice_input = false, offline_mode = false }: SmartPromptRequest = await req.json();

    // Get JWT token from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create authenticated supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { authorization: authHeader } } }
    );

    console.log(`Executing smart prompt: ${template_id}`);

    // Execute the smart prompt function to get template and validate access
    const { data: promptData, error: promptError } = await supabaseClient
      .rpc('execute_smart_prompt', {
        p_template_id: template_id,
        p_input_text: input_text,
        p_context: context,
        p_mobile_device: mobile_device,
        p_voice_input: voice_input
      });

    if (promptError) {
      throw new Error(`Prompt execution error: ${promptError.message}`);
    }

    if (!promptData) {
      throw new Error('No prompt data returned');
    }

    // Get additional context data based on template requirements
    const contextData = await gatherContextData(supabaseClient, promptData, context);

    // Build the enhanced prompt with context
    const enhancedPrompt = buildEnhancedPrompt(promptData, contextData, input_text);

    console.log(`Enhanced prompt built, estimated tokens: ${promptData.estimated_tokens}`);

    // Execute OpenAI request
    const startTime = Date.now();
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: enhancedPrompt.system
          },
          { 
            role: 'user', 
            content: enhancedPrompt.user
          }
        ],
        temperature: 0.7,
        max_tokens: Math.min(promptData.estimated_tokens || 500, 2000),
        stream: false
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    const executionTime = Date.now() - startTime;
    const generatedText = openAIData.choices[0].message.content;
    const tokensUsed = openAIData.usage?.total_tokens || 0;

    console.log(`Prompt executed successfully in ${executionTime}ms, tokens used: ${tokensUsed}`);

    // Update usage analytics
    await supabaseClient
      .from('smart_prompt_usage')
      .update({
        output_text: generatedText,
        execution_time_ms: executionTime,
        tokens_used: tokensUsed,
        offline_mode: offline_mode
      })
      .eq('id', promptData.usage_id);

    // Cache for offline if mobile device
    if (mobile_device || offline_mode) {
      await supabaseClient
        .rpc('cache_prompt_offline', {
          p_template_id: template_id,
          p_input: input_text,
          p_output: generatedText,
          p_device_fingerprint: req.headers.get('user-agent')?.substring(0, 100)
        });
    }

    // Format response based on output format
    const formattedResponse = formatResponse(generatedText, promptData.output_format);

    return new Response(JSON.stringify({
      success: true,
      response: formattedResponse,
      execution_time_ms: executionTime,
      tokens_used: tokensUsed,
      template_title: promptData.title,
      cached_offline: mobile_device || offline_mode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart-prompt-execute:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function gatherContextData(supabase: any, promptData: any, userContext: any): Promise<ContextData> {
  const contextData: ContextData = { ...userContext };

  try {
    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return contextData;

    // Get user profile
    const { data: userProfile } = await supabase
      .from('Users')
      .select('*')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!userProfile) return contextData;

    // Gather context based on template category and context fields
    const contextFields = promptData.context_fields || [];

    // User qualifications for compliance-related prompts
    if (contextFields.includes('user_qualifications') || promptData.category === 'compliance') {
      const { data: qualifications } = await supabase
        .from('qualifications')
        .select('*, qualification_types(*)')
        .eq('user_id', userProfile.id);
      
      contextData.user_qualifications = qualifications || [];
    }

    // Team data for supervisor/manager prompts
    if (contextFields.includes('team_members') && userProfile.role in ['Supervisor', 'Project Manager']) {
      const { data: teamMembers } = await supabase
        .from('project_team')
        .select('*, Users(*)')
        .eq('project_id', userProfile.currentproject);
      
      contextData.team_members = teamMembers || [];
    }

    // Project data for project-related prompts
    if (contextFields.includes('project_data') || contextFields.includes('project_id')) {
      const { data: projectData } = await supabase
        .from('Projects')
        .select('*')
        .eq('id', userProfile.currentproject)
        .single();
      
      contextData.project_data = projectData;
    }

    // Timesheet data for timesheet-related prompts
    if (contextFields.includes('timesheet_data') || promptData.category === 'timesheet') {
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select('*, timesheet_entries(*)')
        .eq('user_id', userProfile.id)
        .gte('week_start_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('week_start_date', { ascending: false })
        .limit(4);
      
      contextData.timesheet_data = timesheets || [];
    }

    // Plot data for plot-related prompts
    if (contextFields.includes('plot_status') || contextFields.includes('plot_number')) {
      const { data: plots } = await supabase
        .from('Plots')
        .select('*')
        .limit(50);
      
      contextData.plot_data = plots || [];
    }

    console.log(`Gathered context data with ${Object.keys(contextData).length} fields`);

  } catch (error) {
    console.error('Error gathering context data:', error);
  }

  return contextData;
}

function buildEnhancedPrompt(promptData: any, contextData: ContextData, userInput: string) {
  let systemPrompt = promptData.system_prompt;
  let userPrompt = userInput;

  // Add relevant context to the system prompt
  if (Object.keys(contextData).length > 0) {
    systemPrompt += "\n\nContext Information:\n";
    
    // Add user qualifications context
    if (contextData.user_qualifications?.length > 0) {
      systemPrompt += "User Qualifications:\n";
      contextData.user_qualifications.forEach((qual: any) => {
        const status = qual.expiry_date && new Date(qual.expiry_date) < new Date() ? 'EXPIRED' : 'CURRENT';
        systemPrompt += `- ${qual.qualification_type}: ${qual.certificate_number || 'N/A'} (${status})\n`;
      });
      systemPrompt += "\n";
    }

    // Add timesheet context
    if (contextData.timesheet_data?.length > 0) {
      systemPrompt += "Recent Timesheet Data:\n";
      contextData.timesheet_data.forEach((ts: any) => {
        systemPrompt += `- Week ${ts.week_start_date}: ${ts.total_hours || 0} hours, Status: ${ts.status}\n`;
      });
      systemPrompt += "\n";
    }

    // Add team context
    if (contextData.team_members?.length > 0) {
      systemPrompt += `Team Information (${contextData.team_members.length} members):\n`;
      contextData.team_members.slice(0, 10).forEach((member: any) => {
        systemPrompt += `- ${member.Users?.fullname || 'Unknown'}: ${member.Users?.role || 'Unknown role'}\n`;
      });
      systemPrompt += "\n";
    }

    // Add project context
    if (contextData.project_data) {
      systemPrompt += "Current Project:\n";
      systemPrompt += `- Name: ${contextData.project_data.projectname}\n`;
      systemPrompt += `- Status: ${contextData.project_data.status}\n`;
      if (contextData.project_data.plannedenddate) {
        systemPrompt += `- Planned End: ${contextData.project_data.plannedenddate}\n`;
      }
      systemPrompt += "\n";
    }
  }

  systemPrompt += "\nInstructions:\n";
  systemPrompt += "- Provide clear, actionable responses\n";
  systemPrompt += "- Use bullet points for lists\n";
  systemPrompt += "- Highlight important deadlines or requirements\n";
  systemPrompt += "- Be concise but comprehensive\n";
  systemPrompt += "- Focus on compliance and safety where relevant\n";

  return {
    system: systemPrompt,
    user: userPrompt
  };
}

function formatResponse(response: string, outputFormat: string) {
  switch (outputFormat) {
    case 'json':
      try {
        return JSON.parse(response);
      } catch {
        return { content: response, format: 'text' };
      }
    case 'report':
      return {
        type: 'report',
        content: response,
        generated_at: new Date().toISOString()
      };
    case 'chart':
      return {
        type: 'chart',
        content: response,
        visualization: 'text-based'
      };
    default:
      return response;
  }
}