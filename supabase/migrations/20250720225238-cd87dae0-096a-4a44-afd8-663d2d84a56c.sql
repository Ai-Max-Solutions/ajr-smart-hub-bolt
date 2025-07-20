-- Critical Security Fixes - Phase 1 (Fixed)
-- Fix privilege escalation vulnerability and database security

-- 1. Drop existing vulnerable RLS policies for users table
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;

-- 2. Create secure RLS policies that prevent role self-modification
-- Note: OLD/NEW references only work in triggers, not RLS policies
-- So we'll use a different approach to prevent role changes
CREATE POLICY "Users can update own basic profile" ON public.users
FOR UPDATE 
USING (auth.uid() = supabase_auth_id);

-- 3. Create admin-only policy for role updates
CREATE POLICY "Admins can update user roles" ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.supabase_auth_id = auth.uid() 
    AND admin_user.role IN ('Admin', 'Director')
  )
);

-- 4. Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id),
  target_user_id UUID REFERENCES public.users(id),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Director')
  )
);

-- 5. Create secure role change function
CREATE OR REPLACE FUNCTION public.secure_update_user_role(
  target_user_id UUID,
  new_role user_role_enum,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_record RECORD;
  target_user_record RECORD;
  old_role user_role_enum;
BEGIN
  -- Get current user info with explicit schema reference
  SELECT * INTO current_user_record 
  FROM public.users 
  WHERE supabase_auth_id = auth.uid();
  
  -- Check if current user has admin privileges
  IF current_user_record.role NOT IN ('Admin', 'Director') THEN
    -- Log unauthorized attempt
    INSERT INTO public.security_audit_log (
      event_type, user_id, target_user_id, success, error_message
    ) VALUES (
      'UNAUTHORIZED_ROLE_CHANGE_ATTEMPT', 
      current_user_record.id, 
      target_user_id, 
      false, 
      'Insufficient privileges'
    );
    RAISE EXCEPTION 'Insufficient privileges to change user roles';
  END IF;
  
  -- Get target user info
  SELECT * INTO target_user_record 
  FROM public.users 
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Prevent self-role modification
  IF current_user_record.id = target_user_id THEN
    INSERT INTO public.security_audit_log (
      event_type, user_id, target_user_id, success, error_message
    ) VALUES (
      'SELF_ROLE_CHANGE_ATTEMPT', 
      current_user_record.id, 
      target_user_id, 
      false, 
      'Users cannot modify their own role'
    );
    RAISE EXCEPTION 'Users cannot modify their own role';
  END IF;
  
  old_role := target_user_record.role;
  
  -- Update the role
  UPDATE public.users 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log successful role change
  INSERT INTO public.security_audit_log (
    event_type, user_id, target_user_id, old_values, new_values, success
  ) VALUES (
    'ROLE_CHANGED', 
    current_user_record.id, 
    target_user_id,
    jsonb_build_object('role', old_role, 'reason', reason),
    jsonb_build_object('role', new_role, 'reason', reason),
    true
  );
  
  RETURN true;
END;
$$;

-- 6. Add role change validation trigger (THIS is where we can use OLD/NEW)
CREATE OR REPLACE FUNCTION public.validate_role_change_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_record RECORD;
BEGIN
  -- Only check if role is being changed
  IF OLD.role = NEW.role THEN
    RETURN NEW;
  END IF;
  
  -- Get current user info
  SELECT * INTO current_user_record 
  FROM public.users 
  WHERE supabase_auth_id = auth.uid();
  
  -- Prevent unauthorized role changes through direct updates
  IF current_user_record.role NOT IN ('Admin', 'Director') THEN
    -- Log unauthorized attempt
    INSERT INTO public.security_audit_log (
      event_type, user_id, target_user_id, success, error_message
    ) VALUES (
      'UNAUTHORIZED_DIRECT_ROLE_CHANGE', 
      current_user_record.id, 
      OLD.id, 
      false, 
      'Direct role change attempted without proper authorization'
    );
    RAISE EXCEPTION 'Role changes must be performed through secure_update_user_role function';
  END IF;
  
  -- Prevent self-role modification
  IF current_user_record.id = OLD.id THEN
    INSERT INTO public.security_audit_log (
      event_type, user_id, target_user_id, success, error_message
    ) VALUES (
      'SELF_ROLE_CHANGE_ATTEMPT', 
      current_user_record.id, 
      OLD.id, 
      false, 
      'Users cannot modify their own role'
    );
    RAISE EXCEPTION 'Users cannot modify their own role';
  END IF;
  
  -- Log the role change
  INSERT INTO public.security_audit_log (
    event_type, user_id, target_user_id, old_values, new_values, success
  ) VALUES (
    'ROLE_CHANGED_DIRECT', 
    current_user_record.id, 
    OLD.id,
    jsonb_build_object('role', OLD.role),
    jsonb_build_object('role', NEW.role),
    true
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_role_change_security_trigger ON public.users;
CREATE TRIGGER validate_role_change_security_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_change_security();

-- 7. Fix database function search paths for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Strict check: If user exists (by auth ID), do NOTHING
  IF EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Only for new users: Insert with default 'Operative'
  INSERT INTO public.users (
    supabase_auth_id,
    email,
    name,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 
      TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
           COALESCE(NEW.raw_user_meta_data->>'last_name', '')), 
      'Unknown'),
    'Operative'
  );
  
  RETURN NEW;
END;
$$;

-- 8. Create function to check current user permissions (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role::text = required_role
  );
$$;

-- 9. Add session security monitoring
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
FOR SELECT
USING (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
FOR SELECT
USING (public.current_user_has_role('Admin') OR public.current_user_has_role('Director'));