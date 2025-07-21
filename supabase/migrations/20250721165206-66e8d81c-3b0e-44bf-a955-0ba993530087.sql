
-- Phase 1: Database Data Audit & Correction
-- First, let's examine and fix the user data inconsistencies

-- Step 1: Update the user record for mc@ajryan.co.uk to have correct data
UPDATE public.users 
SET 
  name = 'Mark Croud',
  firstname = 'Mark',
  lastname = 'Croud',
  fullname = 'Mark Croud'
WHERE email = 'mc@ajryan.co.uk';

-- Step 2: Ensure proper supabase_auth_id linkage for existing users
-- We need to check and update auth linkages where they might be missing

-- Step 3: Add constraints to prevent data inconsistencies
ALTER TABLE public.users 
ADD CONSTRAINT unique_supabase_auth_id UNIQUE (supabase_auth_id);

-- Step 4: Create audit table for tracking user changes
CREATE TABLE IF NOT EXISTS public.user_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.user_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view user audit logs" ON public.user_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Director')
  )
);

-- Step 5: Create function to audit user changes
CREATE OR REPLACE FUNCTION public.audit_user_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log user profile changes
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_audit_log (
      user_id,
      action,
      old_data,
      new_data,
      changed_by
    ) VALUES (
      NEW.id,
      'USER_PROFILE_UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for user audit
DROP TRIGGER IF EXISTS trigger_audit_user_changes ON public.users;
CREATE TRIGGER trigger_audit_user_changes
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_changes();

-- Step 6: Enhanced user validation function
CREATE OR REPLACE FUNCTION public.validate_user_data_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Ensure email and name consistency
  IF NEW.email IS NULL OR NEW.name IS NULL THEN
    RAISE EXCEPTION 'Email and name are required for all users';
  END IF;
  
  -- Ensure supabase_auth_id is unique when not null
  IF NEW.supabase_auth_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.users 
      WHERE supabase_auth_id = NEW.supabase_auth_id 
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Supabase auth ID already exists for another user';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create validation trigger
DROP TRIGGER IF EXISTS trigger_validate_user_data ON public.users;
CREATE TRIGGER trigger_validate_user_data
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_data_consistency();

-- Step 7: Update the handle_new_user function to prevent duplicates and ensure proper data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Check if user exists by email and update auth linkage
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email AND supabase_auth_id IS NULL) THEN
    UPDATE public.users 
    SET 
      supabase_auth_id = NEW.id,
      last_sign_in = now(),
      updated_at = now()
    WHERE email = NEW.email AND supabase_auth_id IS NULL;
    RETURN NEW;
  END IF;
  
  -- Create new user if no existing record found
  INSERT INTO public.users (
    supabase_auth_id,
    email,
    name,
    firstname,
    lastname,
    fullname,
    role,
    employmentstatus,
    onboarding_completed,
    last_sign_in,
    airtable_created_time
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', '')),
      'New User'
    ),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', '')),
      'New User'
    ),
    'Operative',
    'Active',
    false,
    now(),
    now()
  );
  
  RETURN NEW;
END;
$$;

-- Step 8: Create function to get current user safely
CREATE OR REPLACE FUNCTION public.get_current_user_safe()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  is_verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role::TEXT,
    u.is_verified
  FROM public.users u
  WHERE u.supabase_auth_id = auth.uid()
  LIMIT 1;
END;
$$;
