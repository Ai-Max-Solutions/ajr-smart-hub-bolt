-- Fix critical user management issues (corrected)

-- Phase 1: Add missing columns for trial system
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'trial';

-- Add constraint for account_status (drop first if exists)
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS account_status_check;

ALTER TABLE public.users 
ADD CONSTRAINT account_status_check 
CHECK (account_status IN ('trial', 'active', 'suspended', 'expired'));

-- Phase 2: Fix data inconsistency for mc@ajryan.co.uk (only update name, not fullname)
UPDATE public.users 
SET name = 'Mark Croud'
WHERE email = 'mc@ajryan.co.uk';

-- Phase 3: Set proper account status for existing users
UPDATE public.users 
SET account_status = CASE 
  WHEN is_verified = true THEN 'active'
  ELSE 'trial'
END
WHERE account_status IS NULL;

-- Set trial expiry for existing trial users (24 hours from now)
UPDATE public.users 
SET trial_expires_at = NOW() + INTERVAL '24 hours'
WHERE account_status = 'trial' AND trial_expires_at IS NULL;

-- Phase 4: Fix RLS policies - drop restrictive policies
DROP POLICY IF EXISTS "Users can update profile data only" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;

-- Create new comprehensive RLS policies
CREATE POLICY "Users can read own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = supabase_auth_id);

CREATE POLICY "Users can update own profile data" 
ON public.users FOR UPDATE 
USING (auth.uid() = supabase_auth_id)
WITH CHECK (auth.uid() = supabase_auth_id);

-- CRITICAL: Allow admins to manage all users
CREATE POLICY "Admins can manage all users" 
ON public.users FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user
    WHERE admin_user.supabase_auth_id = auth.uid() 
    AND admin_user.role IN ('Admin', 'Director')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users admin_user
    WHERE admin_user.supabase_auth_id = auth.uid() 
    AND admin_user.role IN ('Admin', 'Director')
  )
);

-- Phase 5: Helper functions for user management
CREATE OR REPLACE FUNCTION public.activate_user_permanently(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users 
  SET 
    account_status = 'active',
    is_verified = true,
    trial_expires_at = NULL
  WHERE id = user_id_param;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.extend_trial_period(user_id_param UUID, hours_to_add INTEGER DEFAULT 24)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users 
  SET 
    trial_expires_at = COALESCE(trial_expires_at, NOW()) + (hours_to_add || ' hours')::INTERVAL,
    account_status = 'trial'
  WHERE id = user_id_param;
  
  RETURN FOUND;
END;
$$;