import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, subscription, userId, notification } = await req.json();

    if (action === 'subscribe') {
      // Store push subscription
      const { error } = await supabaseClient
        .from('push_notification_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          device_type: 'desktop', // Could be determined from user agent
          browser_info: {
            userAgent: req.headers.get('user-agent')
          }
        });

      if (error) {
        console.error('Error storing subscription:', error);
        return new Response(JSON.stringify({ error: 'Failed to store subscription' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'unsubscribe') {
      // Remove push subscription
      const { error } = await supabaseClient
        .from('push_notification_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint);

      if (error) {
        console.error('Error removing subscription:', error);
        return new Response(JSON.stringify({ error: 'Failed to remove subscription' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'send') {
      // Send push notifications to users
      const { userIds, title, body, icon, url, tag } = notification;

      // Get subscriptions for the target users
      const { data: subscriptions, error: fetchError } = await supabaseClient
        .from('push_notification_subscriptions')
        .select('*')
        .in('user_id', userIds)
        .eq('is_active', true);

      if (fetchError) {
        console.error('Error fetching subscriptions:', fetchError);
        return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const results = [];

      // Send push notification to each subscription
      for (const sub of subscriptions || []) {
        try {
          const pushSubscription: PushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key
            }
          };

          const payload = JSON.stringify({
            title,
            body,
            icon: icon || '/favicon.ico',
            badge: '/favicon.ico',
            url: url || '/',
            tag: tag || 'default',
            timestamp: Date.now(),
            requireInteraction: notification.priority === 'urgent',
            actions: notification.actions || []
          });

          // Note: In a real implementation, you would use the Web Push Protocol
          // This is a simplified version for demonstration
          console.log('Would send push notification:', {
            subscription: pushSubscription,
            payload: payload
          });

          results.push({
            userId: sub.user_id,
            success: true,
            endpoint: sub.endpoint
          });

        } catch (error) {
          console.error('Error sending push notification:', error);
          results.push({
            userId: sub.user_id,
            success: false,
            error: error.message,
            endpoint: sub.endpoint
          });

          // Mark subscription as inactive if it failed
          await supabaseClient
            .from('push_notification_subscriptions')
            .update({ is_active: false })
            .eq('id', sub.id);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        results,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in push-notifications function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});