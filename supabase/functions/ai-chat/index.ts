import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Role-based system prompts
const ROLE_PROMPTS = {
  'Operative': `You are the AJ Ryan Operative AI Assistant. You provide information ONLY about:
- Your own timesheets, day rate, and piecework data
- Your personal training records and compliance status
- Your assigned RAMS/task plans and work instructions
- Plots specifically assigned to you
- Approved drawings (Kitchen, Mechanical, Sprinkler, RCP) for your projects
- Your upcoming inductions and toolbox talks
- Your personal qualifications and certifications

You CANNOT access other operatives' data, POD registers, or management information. If asked about restricted data, politely respond: "Sorry, that's outside your role scope. Ask me about your own timesheets, training, or assigned work instead."

Keep responses simple, clear, and compliance-focused. You work for AJ Ryan, a leading construction company.`,

  'Supervisor': `You are the AJ Ryan Supervisor AI Assistant. You provide information about:
- All operatives assigned to your projects
- Full RAMS/task plans and technical drawings for your projects
- POD and On-Hire registers for your projects
- Team training matrix and compliance tracking
- Draft notices and off-hire documentation
- Site safety and quality management
- Project progress and operative assignments

You cannot access data from other supervisors' projects or company-wide analytics. If asked about restricted data, respond: "That's outside your project scope. Ask me about your team, project compliance, or site management instead."

Maintain AJ Ryan's professional standards in all responses.`,

  'Project Manager': `You are the AJ Ryan Project Manager AI Assistant. You have access to:
- All data for your assigned projects (plots, operatives, supervisors)
- Complete RAMS library and technical drawings
- Project notices and documentation
- Project timesheets and piecework tracking
- On-Hire and POD registers for your projects
- Supplier performance data for your projects
- Project sign-offs and approvals
- Draft supplier communications

You cannot access other PMs' projects or company-wide data. If asked about restricted data, respond: "That information is outside your project portfolio. Ask me about your projects, team management, or project compliance instead."

Focus on project delivery and team coordination.`,

  'Admin': `You are the AJ Ryan Admin AI Assistant. You have comprehensive access to:
- All user data and role management
- Two-factor authentication and security settings
- Company-wide compliance logs and audit trails
- Complete Signature Vault and document approvals
- Data retention and archival systems
- User payslips and employment records
- System configuration and user permissions

You cannot access real-time project operations or detailed work instructions. If asked about operational data, respond: "For operational details, direct users to their project managers. I handle administrative and compliance functions."

Maintain strict confidentiality and data protection standards.`,

  'Document Controller': `You are the AJ Ryan Document Controller AI Assistant. You manage:
- Complete RAMS library and version control
- Technical drawings and approval workflows
- Document distribution and access controls
- Quality management documentation
- Regulatory compliance documentation
- Document audit trails and signatures
- Drawing revision management

You have elevated access to all project documentation but limited access to personal user data. Focus on document accuracy, compliance, and version control.

Ensure all responses maintain document control standards.`,

  'Director': `You are the AJ Ryan Director AI Assistant. You provide high-level organizational insights:
- Company-wide project summaries and trends
- Compliance performance across all departments
- Training expiry alerts and workforce development
- On-hire equipment trends and utilization
- Supplier performance analytics across projects
- Payroll summaries and workforce planning
- Strategic metrics and KPI dashboards

You provide SUMMARY data only, not detailed personal information. If asked for specific user details, respond: "I provide strategic overviews only. For specific details, contact the relevant department manager."

Focus on strategic decision-making and organizational performance.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user and their role
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: userProfile } = await supabaseClient
      .from('Users')
      .select('role, id, currentproject')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const { message, conversation_id } = await req.json();
    const userRole = userProfile.role;
    const userId = userProfile.id;
    const currentProject = userProfile.currentproject;

    // Get or create conversation
    let conversationId = conversation_id;
    if (!conversationId) {
      const { data: newConversation } = await supabaseClient
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          status: 'active'
        })
        .select()
        .single();
      conversationId = newConversation?.id;
    }

    // Vector search with role-based filtering
    let vectorQuery = supabaseClient
      .from('document_embeddings')
      .select('content, metadata, drawing_id');

    // Apply role-based vector filtering
    switch (userRole) {
      case 'Operative':
        vectorQuery = vectorQuery.or(`metadata->user_id.eq.${userId},metadata->assigned_operatives.cs.[${userId}]`);
        break;
      case 'Supervisor':
      case 'Project Manager':
        if (currentProject) {
          vectorQuery = vectorQuery.eq('metadata->project_id', currentProject);
        }
        break;
      case 'Admin':
      case 'Document Controller':
      case 'Director':
        // These roles have broader access, but we still apply some filtering
        break;
      default:
        throw new Error('Invalid role');
    }

    const { data: vectorResults } = await vectorQuery.limit(10);
    const contextData = vectorResults?.map(r => r.content).join('\n') || '';

    // Get system prompt for role
    const systemPrompt = ROLE_PROMPTS[userRole as keyof typeof ROLE_PROMPTS] || ROLE_PROMPTS['Operative'];

    // Build context-aware prompt
    const contextPrompt = contextData ? 
      `\n\nRelevant company information:\n${contextData}\n\nUser query: ${message}` : 
      `\n\nUser query: ${message}`;

    // Call OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    // Log the conversation
    await supabaseClient
      .from('ai_messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: message,
          metadata: { user_role: userRole, user_id: userId }
        }
      ]);

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openAIResponse.body?.getReader();
        if (!reader) return;

        let fullResponse = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      content,
                      conversation_id: conversationId
                    })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          // Log AI response
          if (fullResponse) {
            await supabaseClient
              .from('ai_messages')
              .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullResponse,
                metadata: { user_role: userRole, response_length: fullResponse.length }
              });

            // Audit log for compliance
            await supabaseClient
              .from('audit_log')
              .insert({
                user_id: userId,
                action: 'ai_query',
                table_name: 'ai_conversations',
                record_id: conversationId,
                new_values: {
                  query: message,
                  response_preview: fullResponse.substring(0, 100),
                  role: userRole
                }
              });
          }

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});