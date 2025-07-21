-- CRITICAL SECURITY FIXES

-- 1. Create security definer function to safely check user roles without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_auth_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT role::text 
  FROM public.users 
  WHERE supabase_auth_id = user_auth_id;
$$;

-- 2. Create function to prevent role self-escalation
CREATE OR REPLACE FUNCTION public.can_update_user_role(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_role text;
  target_user_role text;
BEGIN
  -- Get current user's role
  SELECT public.get_user_role(auth.uid()) INTO current_user_role;
  
  -- Get target user's current role
  SELECT public.get_user_role(target_user_id) INTO target_user_role;
  
  -- Only Admin/Director can change roles
  IF current_user_role NOT IN ('Admin', 'Director') THEN
    RETURN false;
  END IF;
  
  -- Prevent self-role changes (users cannot change their own role)
  IF auth.uid() = target_user_id THEN
    RETURN false;
  END IF;
  
  -- Directors cannot promote to Admin (only Admins can create Admins)
  IF current_user_role = 'Director' AND new_role = 'Admin' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 3. Create audit log for role changes
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by_user_id uuid REFERENCES auth.users(id),
  target_user_id uuid NOT NULL,
  old_role text NOT NULL,
  new_role text NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view role change audit" ON public.role_change_audit
FOR SELECT 
USING (public.get_user_role(auth.uid()) IN ('Admin', 'Director'));

-- 4. Fix database functions with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Strict check: If user exists (by auth ID), do NOTHING – no update!
    IF EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = NEW.id) THEN
        RETURN NEW;  -- Exit, no changes – keep existing role!
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

-- 5. Fix other security definer functions with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_last_sign_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Update last_sign_in when a user accesses their profile
    UPDATE public.users 
    SET last_sign_in = now()
    WHERE supabase_auth_id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- 6. Create secure user profile update policy that prevents role changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;

-- Separate policy for profile updates (no role changes)
CREATE POLICY "Users can update their own profile data" ON public.users
FOR UPDATE 
USING (auth.uid() = supabase_auth_id)
WITH CHECK (
  auth.uid() = supabase_auth_id 
  AND (
    -- Allow all non-role updates
    (OLD.role = NEW.role) 
    OR 
    -- Allow role updates only if user has permission
    public.can_update_user_role(supabase_auth_id, NEW.role::text)
  )
);

-- 7. Create role change audit trigger
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Only log if role actually changed
    IF OLD.role != NEW.role THEN
        INSERT INTO public.role_change_audit (
            changed_by_user_id,
            target_user_id, 
            old_role,
            new_role,
            reason
        ) VALUES (
            auth.uid(),
            NEW.supabase_auth_id,
            OLD.role::text,
            NEW.role::text,
            'Role changed via direct update'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_user_role_changes ON public.users;
CREATE TRIGGER audit_user_role_changes
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION public.audit_role_changes();

-- 8. Fix contractor_rams_signatures RLS conflicts
DROP POLICY IF EXISTS "Users can insert own RAMS signatures" ON public.contractor_rams_signatures;
DROP POLICY IF EXISTS "Users can read own RAMS signatures" ON public.contractor_rams_signatures;  
DROP POLICY IF EXISTS "Users can update own RAMS signatures" ON public.contractor_rams_signatures;

-- Create single coherent policy set
CREATE POLICY "Contractors can manage their own signatures" ON public.contractor_rams_signatures
FOR ALL
USING (contractor_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()))
WITH CHECK (contractor_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

-- 9. Add missing RLS policies for work_log_audit if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_log_audit') THEN
        -- Enable RLS if not already enabled
        EXECUTE 'ALTER TABLE public.work_log_audit ENABLE ROW LEVEL SECURITY';
        
        -- Create policies
        EXECUTE 'CREATE POLICY "Users can view their own audit logs" ON public.work_log_audit
                 FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()))';
                 
        EXECUTE 'CREATE POLICY "Admins can view all audit logs" ON public.work_log_audit  
                 FOR SELECT USING (public.get_user_role(auth.uid()) IN (''Admin'', ''Director'', ''PM'', ''Supervisor''))';
    END IF;
END $$;