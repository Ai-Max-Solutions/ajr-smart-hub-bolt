
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { action, data } = requestBody;

    console.log('AI Assistant request:', { action, data, fullBody: requestBody });

    // Handle missing action by providing a default
    const actualAction = action || 'suggest_template';
    const actualData = data || requestBody;

    let systemPrompt = '';
    let userPrompt = '';

    switch (actualAction) {
      case 'suggest_template':
        systemPrompt = `You are a construction project expert. Based on the project name and description, suggest the most appropriate building template and provide helpful setup suggestions. Be witty but professional, with occasional plumbing humor. Always be encouraging and practical.`;
        userPrompt = `Project: "${actualData.projectName || 'Unnamed Project'}"
Description: "${actualData.description || 'No description provided'}"

Analyze this project and suggest:
1. Most appropriate building type (Residential High-Rise, Mixed-Use Development, Commercial Office Block, Student Accommodation)
2. Estimated number of blocks
3. Estimated levels per block
4. Estimated units per level
5. Any special considerations (basement, mezzanine, penthouse)
6. Brief reasoning with a witty construction joke

Keep response concise and actionable.`;
        break;

      case 'validate_setup':
        systemPrompt = `You are a construction project expert validating project setup. Check for common issues, inconsistencies, or missed opportunities. Be encouraging but point out potential problems with construction humor.`;
        userPrompt = `Project Setup Validation:
- Project: "${actualData.projectName || 'Unnamed Project'}"
- Blocks: ${actualData.blocks?.length || 0} blocks
- Total Levels: ${actualData.totalLevels || 0}
- Total Units: ${actualData.totalUnits || 0}
- Template: ${actualData.template || 'Custom'}

Block Details:
${actualData.blocks?.map(block => `  ${block.code}: ${block.levels} levels, ${block.unitsPerLevel} units/level`).join('\n') || 'No blocks defined'}

Validate this setup and provide:
1. Any warnings or red flags
2. Suggestions for improvement
3. Confirmation if setup looks solid
4. A witty construction-related comment

Be encouraging but honest about potential issues.`;
        break;

      case 'anomaly_check':
        systemPrompt = `You are a construction project monitoring expert. Analyze timesheet and task data for anomalies, delays, or concerning patterns. Use plumbing humor but be professional about serious issues.`;
        userPrompt = `Anomaly Check:
- Task: "${actualData.taskName || 'Unknown Task'}"
- Hours Logged: ${actualData.hours || 0}
- Normal Range: ${actualData.expectedHours || 'Unknown'}
- Unit: ${actualData.unitCode || 'Unknown'}
- Worker: ${actualData.workerName || 'Unknown'}
- Previous Similar Tasks: ${actualData.historicalData || 'No data'}

Analyze and provide:
1. Whether this is normal, concerning, or exceptional
2. Possible explanations
3. Recommended actions if any
4. A relevant construction joke if appropriate

Be supportive of workers while flagging genuine concerns.`;
        break;

      case 'progress_summary':
        systemPrompt = `You are a construction project reporting expert. Create encouraging but realistic progress summaries with construction humor.`;
        userPrompt = `Progress Summary Request:
- Project: "${actualData.projectName || 'Unnamed Project'}"
- Completion: ${actualData.completionPercentage || 0}%
- Units Complete: ${actualData.unitsComplete || 0}/${actualData.totalUnits || 0}
- Behind Schedule: ${actualData.behindSchedule || 0} units
- Key Issues: ${actualData.issues?.join(', ') || 'None reported'}

Create a brief, encouraging progress summary with:
1. Overall status assessment
2. Key achievements
3. Areas needing attention
4. A motivational message with construction humor

Keep it positive but realistic!`;
        break;

      default:
        systemPrompt = `You are a helpful construction project assistant. Provide practical advice with occasional plumbing humor.`;
        userPrompt = `The user is asking about: ${JSON.stringify(actualData)}
        
        Please provide helpful construction-related advice or suggestions.`;
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices[0].message.content;

    console.log('AI Assistant response:', assistantMessage);

    return new Response(JSON.stringify({ 
      success: true,
      message: assistantMessage,
      action: actualAction
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in project-ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: '🤖 AI Assistant hit a snag! Please try again or check your connection.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
