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
      .select('role, id, currentproject, firstname, lastname, fullname, primaryskill')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const { message, conversation_id, context_data } = await req.json();
    const userRole = userProfile.role;
    const userId = userProfile.id;

    // Rate limiting check
    const { data: rateLimitCheck } = await supabaseClient.rpc('check_ai_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'ai-personalized-chat',
      p_max_requests: 100,
      p_window_minutes: 60
    });

    if (!rateLimitCheck) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

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

    // Get personalized AI context
    const { data: personalizedContext } = await supabaseClient.rpc('get_user_ai_context', {
      p_user_id: userId
    });

    // Generate personalized system prompt
    const { data: personalizedPrompt } = await supabaseClient.rpc('generate_personalized_prompt', {
      p_user_id: userId,
      p_base_role: userRole
    });

    // Get user's conversation memory
    const { data: conversationMemory } = await supabaseClient
      .from('ai_conversation_memory')
      .select('memory_key, memory_value, importance_score')
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .order('importance_score', { ascending: false })
      .limit(10);

    // Get recent patterns for proactive context
    const { data: userPatterns } = await supabaseClient
      .from('user_patterns')
      .select('pattern_type, pattern_data, confidence_level, next_predicted')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('frequency_score', { ascending: false })
      .limit(5);

    // Vector search with enhanced role-based filtering
    let vectorQuery = supabaseClient
      .from('document_embeddings')
      .select('content, metadata, drawing_id');

    // Apply enhanced role-based vector filtering
    switch (userRole) {
      case 'Operative':
        vectorQuery = vectorQuery.or(`metadata->user_id.eq.${userId},metadata->assigned_operatives.cs.[${userId}]`);
        break;
      case 'Supervisor':
      case 'Project Manager':
        if (userProfile.currentproject) {
          vectorQuery = vectorQuery.eq('metadata->project_id', userProfile.currentproject);
        }
        break;
      case 'Admin':
      case 'Document Controller':
      case 'Director':
        // Broader access but still apply some filtering for performance
        break;
      default:
        vectorQuery = vectorQuery.or(`metadata->user_id.eq.${userId}`);
    }

    const { data: vectorResults } = await vectorQuery.limit(15);
    const contextData = vectorResults?.map(r => r.content).join('\n') || '';

    // Build enhanced context with personalization
    const userName = personalizedContext?.user?.name || userProfile.fullname || 'there';
    const memoryContext = conversationMemory?.map(m => `${m.memory_key}: ${JSON.stringify(m.memory_value)}`).join('\n') || '';
    const patternsContext = userPatterns?.map(p => `User often: ${p.pattern_type} - ${JSON.stringify(p.pattern_data)}`).join('\n') || '';
    
    // Build proactive insights
    let proactiveInsights = '';
    if (userPatterns && userPatterns.length > 0) {
      const morningPattern = userPatterns.find(p => p.pattern_type === 'morning_routine');
      const compliancePattern = userPatterns.find(p => p.pattern_type === 'compliance_check');
      
      if (morningPattern && new Date().getHours() < 10) {
        proactiveInsights += `\nProactive insight: Based on your morning routine patterns, you might want to check today's RAMS or compliance status.`;
      }
      
      if (compliancePattern && compliancePattern.next_predicted) {
        const nextCheck = new Date(compliancePattern.next_predicted);
        if (nextCheck.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
          proactiveInsights += `\nProactive insight: You're due for a compliance check soon.`;
        }
      }
    }

    // Enhanced context prompt with personalization
    const enhancedPrompt = `
${personalizedPrompt}

User Context:
- Name: ${userName}
- Current conversation memory: ${memoryContext}
- Recent patterns: ${patternsContext}
${proactiveInsights}

Relevant company information:
${contextData}

User query: ${message}

Instructions:
- Always greet by name if this is the first message
- Reference relevant patterns or previous context when helpful
- Use appropriate trade terminology for ${userProfile.primaryskill || 'general construction'}
- Be proactive - offer related suggestions or reminders
- Maintain AJ Ryan's helpful, honest, and time-saving approach
- Keep responses practical and actionable
`;

    // Log user message with enhanced metadata
    await supabaseClient
      .from('ai_messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: message,
          metadata: { 
            user_role: userRole, 
            user_id: userId,
            patterns_referenced: userPatterns?.length || 0,
            memory_items: conversationMemory?.length || 0,
            personalization_level: 'enhanced'
          }
        }
      ]);

    // Track user patterns
    const currentHour = new Date().getHours();
    await supabaseClient
      .from('user_patterns')
      .upsert({
        user_id: userId,
        pattern_type: currentHour < 12 ? 'morning_routine' : 'afternoon_inquiry',
        pattern_data: {
          query_type: 'ai_chat',
          time_of_day: currentHour,
          message_length: message.length,
          device_type: context_data?.device_type || 'unknown'
        },
        frequency_score: 1,
        last_occurrence: new Date().toISOString(),
        confidence_level: 0.8
      }, {
        onConflict: 'user_id,pattern_type'
      });

    // Call OpenAI with enhanced prompt
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: enhancedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        stream: true
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    // Stream response with enhanced logging
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openAIResponse.body?.getReader();
        if (!reader) return;

        let fullResponse = '';
        const startTime = Date.now();
        
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
                      conversation_id: conversationId,
                      personalized: true
                    })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          const responseTime = Date.now() - startTime;

          // Log AI response with enhanced metadata
          if (fullResponse) {
            await supabaseClient
              .from('ai_messages')
              .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullResponse,
                metadata: { 
                  user_role: userRole, 
                  response_length: fullResponse.length,
                  response_time_ms: responseTime,
                  personalization_features: ['name_greeting', 'pattern_awareness', 'trade_terminology'],
                  patterns_used: userPatterns?.length || 0
                }
              });

            // Store conversation memory for future context
            if (fullResponse.length > 100) {
              await supabaseClient
                .from('ai_conversation_memory')
                .insert({
                  user_id: userId,
                  conversation_id: conversationId,
                  memory_type: 'context',
                  memory_key: 'recent_discussion',
                  memory_value: {
                    user_query: message.substring(0, 200),
                    ai_response: fullResponse.substring(0, 300),
                    timestamp: new Date().toISOString(),
                    topic: 'general_inquiry'
                  },
                  importance_score: Math.min(fullResponse.length / 100, 5)
                });
            }

            // Enhanced audit logging
            await supabaseClient
              .from('audit_log')
              .insert({
                user_id: userId,
                action: 'ai_personalized_query',
                table_name: 'ai_conversations',
                record_id: conversationId,
                new_values: {
                  query: message,
                  response_preview: fullResponse.substring(0, 100),
                  role: userRole,
                  personalization_level: 'enhanced',
                  patterns_referenced: userPatterns?.length || 0,
                  response_time_ms: responseTime
                }
              });

            // Cache successful context for performance
            await supabaseClient.rpc('cache_user_context', {
              p_user_id: userId,
              p_context_type: 'recent_ai_interaction',
              p_context_data: {
                last_query: message,
                successful_response: true,
                timestamp: new Date().toISOString(),
                satisfaction_inferred: fullResponse.length > 50 ? 'positive' : 'neutral'
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
    console.error('Error in ai-personalized-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});