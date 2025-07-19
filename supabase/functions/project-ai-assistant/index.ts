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
    const { action, data } = await req.json();

    console.log('AI Assistant request:', { action, data });

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'suggest_template':
        systemPrompt = `You are a construction project expert. Based on the project name and description, suggest the most appropriate building template and provide helpful setup suggestions. Be witty but professional, with occasional plumbing humor. Always be encouraging and practical.`;
        userPrompt = `Project: "${data.projectName}"
Description: "${data.description || 'No description provided'}"

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
- Project: "${data.projectName}"
- Blocks: ${data.blocks?.length || 0} blocks
- Total Levels: ${data.totalLevels || 0}
- Total Units: ${data.totalUnits || 0}
- Template: ${data.template || 'Custom'}

Block Details:
${data.blocks?.map(block => `  ${block.code}: ${block.levels} levels, ${block.unitsPerLevel} units/level`).join('\n') || 'No blocks defined'}

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
- Task: "${data.taskName}"
- Hours Logged: ${data.hours}
- Normal Range: ${data.expectedHours || 'Unknown'}
- Unit: ${data.unitCode}
- Worker: ${data.workerName || 'Unknown'}
- Previous Similar Tasks: ${data.historicalData || 'No data'}

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
- Project: "${data.projectName}"
- Completion: ${data.completionPercentage || 0}%
- Units Complete: ${data.unitsComplete || 0}/${data.totalUnits || 0}
- Behind Schedule: ${data.behindSchedule || 0} units
- Key Issues: ${data.issues?.join(', ') || 'None reported'}

Create a brief, encouraging progress summary with:
1. Overall status assessment
2. Key achievements
3. Areas needing attention
4. A motivational message with construction humor

Keep it positive but realistic!`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
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

    const aiResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
    }

    const assistantMessage = aiResponse.choices[0].message.content;

    console.log('AI Assistant response:', assistantMessage);

    return new Response(JSON.stringify({ 
      success: true,
      message: assistantMessage,
      action 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in project-ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});