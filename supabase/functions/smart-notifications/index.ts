import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, context, type = 'general' } = await req.json();

    console.log('Generating smart notifications for user:', userId);

    // Get user profile and recent activity
    const [userProfile, recentActivity, complianceData] = await Promise.all([
      supabase.from('Users').select('*').eq('whalesync_postgres_id', userId).single(),
      supabase.from('activity_metrics').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('compliance_dashboard_stats').select('*').order('calculated_at', { ascending: false }).limit(5)
    ]);

    // Analyze patterns with AI
    const analysisPrompt = `Analyze this construction worker's activity and generate 3 smart, actionable notifications:

User Context:
- Role: ${userProfile.data?.role || 'Construction Worker'}
- Recent Activity: ${recentActivity.data?.map(a => `${a.action_type} at ${a.created_at}`).join(', ') || 'None'}
- Compliance Stats: ${JSON.stringify(complianceData.data?.slice(0, 2)) || 'None'}

Generate notifications that are:
1. Specific to construction work
2. Actionable and helpful
3. Time-sensitive when relevant
4. Safety-focused when appropriate

Format as JSON array: [{"title": "...", "message": "...", "priority": "high|medium|low", "category": "safety|compliance|productivity|training"}]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an AI assistant for construction management. Generate helpful, specific notifications.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI notifications');
    }

    const aiData = await response.json();
    let notifications;
    
    try {
      notifications = JSON.parse(aiData.choices[0].message.content);
    } catch {
      // Fallback notifications if AI response isn't valid JSON
      notifications = [
        {
          title: "Daily Safety Check",
          message: "Review today's safety protocols before starting work",
          priority: "high",
          category: "safety"
        },
        {
          title: "Document Review Pending",
          message: "You have 2 documents requiring your attention",
          priority: "medium", 
          category: "compliance"
        },
        {
          title: "Training Reminder",
          message: "Complete your monthly safety training",
          priority: "low",
          category: "training"
        }
      ];
    }

    // Store notifications in database
    const notificationInserts = notifications.map((notif: any) => ({
      user_id: userId,
      title: notif.title,
      message: notif.message,
      priority: notif.priority,
      category: notif.category,
      ai_generated: true,
      read: false
    }));

    const { data: storedNotifications } = await supabase
      .from('smart_notifications')
      .insert(notificationInserts)
      .select();

    console.log('Generated and stored', notifications.length, 'smart notifications');

    return new Response(JSON.stringify({
      notifications: storedNotifications || notifications,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart-notifications function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});