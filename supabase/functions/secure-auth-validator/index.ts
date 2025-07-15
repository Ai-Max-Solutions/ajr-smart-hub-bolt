import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthValidationRequest {
  token: string;
  action: string;
  endpoint: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action, endpoint }: AuthValidationRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Invalid or expired token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile from Users table
    const { data: userProfile, error: profileError } = await supabase
      .from('Users')
      .select('whalesync_postgres_id, role, employmentstatus, deactivation_date')
      .eq('supabase_auth_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.log('User profile not found:', profileError);
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'User profile not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user account is active
    if (userProfile.employmentstatus !== 'Active') {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Account is not active'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if account is expired
    if (userProfile.deactivation_date && new Date(userProfile.deactivation_date) <= new Date()) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Account has expired'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limiting
    const rateLimitOk = await checkRateLimit(supabase, userProfile.whalesync_postgres_id, endpoint);
    if (!rateLimitOk) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Rate limit exceeded'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check action permissions
    const hasPermission = await checkActionPermission(userProfile.role, action);
    if (!hasPermission) {
      // Log unauthorized access attempt
      await supabase.from('audit_log').insert({
        user_id: userProfile.whalesync_postgres_id,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        table_name: 'auth_validation',
        new_values: { action, endpoint, role: userProfile.role }
      });

      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Insufficient permissions for this action'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log successful validation
    await supabase.from('audit_log').insert({
      user_id: userProfile.whalesync_postgres_id,
      action: 'AUTH_VALIDATION_SUCCESS',
      table_name: 'auth_validation',
      new_values: { action, endpoint, role: userProfile.role }
    });

    return new Response(JSON.stringify({ 
      valid: true,
      user: {
        id: userProfile.whalesync_postgres_id,
        role: userProfile.role,
        permissions: getPermissionsForRole(userProfile.role)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auth validation error:', error);
    return new Response(JSON.stringify({ 
      valid: false, 
      error: 'Internal validation error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkRateLimit(
  supabase: any, 
  userId: string, 
  endpoint: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_enhanced_rate_limit', {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_max_requests: 100,
      p_window_minutes: 60
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return false; // Fail closed for security
    }

    return data === true;
  } catch (error) {
    console.error('Rate limit function error:', error);
    return false;
  }
}

function checkActionPermission(role: string, action: string): boolean {
  const permissions: Record<string, string[]> = {
    'Admin': ['*'], // All actions
    'Document Controller': [
      'manage_users', 'view_audit_logs', 'manage_projects', 
      'manage_documents', 'manage_contractors', 'run_security_scan'
    ],
    'Project Manager': [
      'manage_projects', 'view_team', 'manage_assignments',
      'view_analytics', 'manage_pods'
    ],
    'Supervisor': [
      'view_team', 'manage_assignments', 'view_analytics'
    ],
    'Operative': [
      'view_profile', 'update_profile', 'view_timesheets',
      'create_timesheets', 'view_qualifications', 'sign_rams'
    ],
    'Contractor': [
      'view_profile', 'update_profile', 'sign_rams',
      'upload_documents', 'view_assignments'
    ]
  };

  const userPermissions = permissions[role] || [];
  
  // Admin role has all permissions
  if (userPermissions.includes('*')) {
    return true;
  }

  // Check specific permission
  return userPermissions.includes(action);
}

function getPermissionsForRole(role: string): string[] {
  const permissions: Record<string, string[]> = {
    'Admin': ['*'],
    'Document Controller': [
      'manage_users', 'view_audit_logs', 'manage_projects', 
      'manage_documents', 'manage_contractors', 'run_security_scan'
    ],
    'Project Manager': [
      'manage_projects', 'view_team', 'manage_assignments',
      'view_analytics', 'manage_pods'
    ],
    'Supervisor': [
      'view_team', 'manage_assignments', 'view_analytics'
    ],
    'Operative': [
      'view_profile', 'update_profile', 'view_timesheets',
      'create_timesheets', 'view_qualifications', 'sign_rams'
    ],
    'Contractor': [
      'view_profile', 'update_profile', 'sign_rams',
      'upload_documents', 'view_assignments'
    ]
  };

  return permissions[role] || [];
}