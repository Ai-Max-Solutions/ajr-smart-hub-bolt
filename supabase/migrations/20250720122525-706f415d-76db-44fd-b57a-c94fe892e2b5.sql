
-- Add is_verified column to users table (rename is_blocked for clarity)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- Update existing users to be verified if they're not blocked
UPDATE public.users 
SET is_verified = NOT is_blocked 
WHERE is_blocked IS NOT NULL;

-- Drop the old is_blocked column after migration
ALTER TABLE public.users 
DROP COLUMN IF EXISTS is_blocked;

-- Update RLS policies to check verification status
-- First, let's update the most critical tables with verification checks

-- Update users table policies to include verification check
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
CREATE POLICY "Verified users can view all users" 
  ON public.users 
  FOR SELECT 
  USING (
    (auth.uid() = supabase_auth_id AND is_verified = true) OR
    EXISTS (
      SELECT 1 FROM public.users admin_user 
      WHERE admin_user.supabase_auth_id = auth.uid() 
      AND admin_user.role = ANY(ARRAY['Admin'::user_role_enum, 'Director'::user_role_enum])
    )
  );

-- Update projects table policies
DROP POLICY IF EXISTS "Projects are viewable by authenticated users" ON public.projects;
CREATE POLICY "Projects viewable by verified users" 
  ON public.projects 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.supabase_auth_id = auth.uid() 
      AND u.is_verified = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.users admin_user 
      WHERE admin_user.supabase_auth_id = auth.uid() 
      AND admin_user.role = ANY(ARRAY['Admin'::user_role_enum, 'Director'::user_role_enum])
    )
  );

-- Update plots table policies
DROP POLICY IF EXISTS "Plots are viewable by authenticated users" ON public.plots;
CREATE POLICY "Plots viewable by verified users" 
  ON public.plots 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.supabase_auth_id = auth.uid() 
      AND u.is_verified = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.users admin_user 
      WHERE admin_user.supabase_auth_id = auth.uid() 
      AND admin_user.role = ANY(ARRAY['Admin'::user_role_enum, 'Director'::user_role_enum])
    )
  );

-- Update timesheets policies  
DROP POLICY IF EXISTS "Users can view their own timesheets" ON public.timesheets;
CREATE POLICY "Verified users can view their own timesheets" 
  ON public.timesheets 
  FOR SELECT 
  USING (
    (user_id IN (
      SELECT users.id FROM users 
      WHERE users.supabase_auth_id = auth.uid() 
      AND users.is_verified = true
    )) OR
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.supabase_auth_id = auth.uid() 
      AND admin_user.role = ANY(ARRAY['Admin'::user_role_enum, 'PM'::user_role_enum, 'Director'::user_role_enum])
    )
  );

-- Create function to check if user is verified (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_user_verified(user_auth_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  verified BOOLEAN := false;
BEGIN
  SELECT is_verified INTO verified
  FROM public.users 
  WHERE supabase_auth_id = user_auth_id;
  
  RETURN COALESCE(verified, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to get user verification status with role
CREATE OR REPLACE FUNCTION public.get_user_verification_status(user_auth_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'is_verified', COALESCE(is_verified, false),
    'role', role,
    'name', name,
    'email', email
  ) INTO result
  FROM public.users 
  WHERE supabase_auth_id = user_auth_id;
  
  RETURN COALESCE(result, json_build_object('is_verified', false, 'role', null, 'name', null, 'email', null));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
