import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  let openAISocket: WebSocket | null = null;
  let userProfile: any = null;
  let conversationId: string | null = null;

  socket.onopen = async () => {
    console.log("Client WebSocket connected");
    
    try {
      // Authenticate user
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        socket.close(1000, "Unauthorized");
        return;
      }

      // Get user profile
      const { data: profile } = await supabaseClient
        .from('Users')
        .select('role, id, fullname')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!profile) {
        socket.close(1000, "User profile not found");
        return;
      }

      userProfile = profile;
      console.log(`User ${profile.fullname} (${profile.role}) connected`);

      // Create conversation record
      const { data: newConversation } = await supabaseClient
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          status: 'active'
        })
        .select()
        .single();
      
      conversationId = newConversation?.id;

      // Connect to OpenAI Realtime API
      openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17", [], {
        headers: {
          "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          "OpenAI-Beta": "realtime=v1",
        },
      });

      openAISocket.onopen = () => {
        console.log("OpenAI WebSocket connected");
        
        // Configure session based on user role
        const roleInstructions = getRoleInstructions(profile.role);
        
        const sessionConfig = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: roleInstructions,
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            tools: getRoleTools(profile.role),
            tool_choice: "auto",
            temperature: 0.7,
            max_response_output_tokens: 1000
          }
        };

        openAISocket?.send(JSON.stringify(sessionConfig));
        socket.send(JSON.stringify({ type: 'connected', user: profile.fullname }));
      };

      openAISocket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("OpenAI message:", data.type);

        // Log important events
        if (data.type === 'response.audio_transcript.delta') {
          await logConversationEvent('ai_transcript', data.delta, conversationId!);
        }

        // Forward to client
        socket.send(event.data);
      };

      openAISocket.onclose = () => {
        console.log("OpenAI WebSocket disconnected");
        socket.close();
      };

      openAISocket.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
        socket.close(1000, "OpenAI connection error");
      };

    } catch (error) {
      console.error("Connection setup error:", error);
      socket.close(1000, "Setup error");
    }
  };

  socket.onmessage = async (event) => {
    if (openAISocket?.readyState === WebSocket.OPEN) {
      const data = JSON.parse(event.data);
      
      // Log user audio/text input
      if (data.type === 'conversation.item.create' || data.type === 'input_audio_buffer.append') {
        await logConversationEvent('user_input', 
          data.type === 'conversation.item.create' ? data.item?.content?.[0]?.text : 'audio_data',
          conversationId!
        );
      }

      // Forward to OpenAI
      openAISocket.send(event.data);
    }
  };

  socket.onclose = async () => {
    console.log("Client WebSocket disconnected");
    openAISocket?.close();
    
    // Update conversation status
    if (conversationId) {
      await supabaseClient
        .from('ai_conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);
    }
  };

  async function logConversationEvent(eventType: string, content: string, convId: string) {
    try {
      await supabaseClient
        .from('ai_messages')
        .insert({
          conversation_id: convId,
          role: eventType.includes('user') ? 'user' : 'assistant',
          content: content,
          metadata: { 
            event_type: eventType, 
            user_role: userProfile?.role,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error("Failed to log conversation event:", error);
    }
  }

  return response;
});

function getRoleInstructions(role: string): string {
  const baseInstruction = `You are the AJ Ryan AI Assistant providing voice support. Keep responses concise and clear for voice interaction. You work for AJ Ryan, a leading UK construction company focused on compliance and safety.`;
  
  const roleSpecifics = {
    'Operative': `${baseInstruction} You help operatives with their personal timesheets, training compliance, assigned work, and safety procedures. You cannot access other workers' data or management information.`,
    'Supervisor': `${baseInstruction} You assist supervisors with team management, project compliance, safety oversight, and operational coordination for their assigned projects.`,
    'Project Manager': `${baseInstruction} You support project managers with comprehensive project data, team oversight, compliance tracking, and stakeholder coordination.`,
    'Admin': `${baseInstruction} You provide administrative support including user management, system configuration, compliance monitoring, and data governance.`,
    'Document Controller': `${baseInstruction} You help with document management, version control, technical drawings, RAMS coordination, and regulatory compliance documentation.`,
    'Director': `${baseInstruction} You provide strategic insights through company-wide analytics, performance trends, and high-level organizational metrics.`
  };

  return roleSpecifics[role as keyof typeof roleSpecifics] || roleSpecifics['Operative'];
}

function getRoleTools(role: string) {
  const commonTools = [
    {
      type: "function",
      name: "search_company_data",
      description: "Search company documentation and data relevant to user's role",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          data_type: { type: "string", enum: ["timesheets", "training", "projects", "compliance", "safety", "documents"] }
        },
        required: ["query"]
      }
    }
  ];

  const roleSpecificTools = {
    'Project Manager': [
      ...commonTools,
      {
        type: "function",
        name: "generate_project_report",
        description: "Generate project status report",
        parameters: {
          type: "object",
          properties: {
            project_id: { type: "string" },
            report_type: { type: "string", enum: ["progress", "compliance", "safety", "financial"] }
          },
          required: ["project_id", "report_type"]
        }
      }
    ],
    'Director': [
      ...commonTools,
      {
        type: "function",
        name: "generate_dashboard",
        description: "Generate executive dashboard with key metrics",
        parameters: {
          type: "object",
          properties: {
            metric_type: { type: "string", enum: ["compliance", "performance", "safety", "financial"] },
            time_period: { type: "string", enum: ["week", "month", "quarter"] }
          },
          required: ["metric_type"]
        }
      }
    ]
  };

  return roleSpecificTools[role as keyof typeof roleSpecificTools] || commonTools;
}