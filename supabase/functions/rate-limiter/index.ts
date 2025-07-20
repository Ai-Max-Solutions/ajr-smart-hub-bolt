import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimitRequest {
  userId: string
  action: string
  maxRequests?: number
  windowMinutes?: number
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, action, maxRequests = 100, windowMinutes = 60 }: RateLimitRequest = await req.json()

    // Check rate limit using existing function
    const { data: isAllowed, error } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: userId,
      p_endpoint: action,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes
    })

    if (error) {
      console.error('Rate limit check error:', error)
      return new Response(
        JSON.stringify({ allowed: false, error: 'Rate limit check failed' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the rate limit check for security monitoring
    await supabase.from('work_log_audit').insert({
      action: 'RATE_LIMIT_CHECK',
      new_values: { userId, action, allowed: isAllowed, timestamp: new Date().toISOString() },
      user_id: userId
    })

    return new Response(
      JSON.stringify({ 
        allowed: isAllowed, 
        action,
        windowMinutes,
        maxRequests 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Rate limiter error:', error)
    return new Response(
      JSON.stringify({ allowed: false, error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})