
-- Phase 1 & 3: Fix RLS policies and add trial system fields

-- Add new columns for trial system
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'trial' CHECK (account_status IN ('trial', 'active', 'suspended', 'expired'));

-- Update existing users to have proper account status
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

-- Fix the data inconsistency for mc@ajryan.co.uk
UPDATE public.users 
SET name = 'Mark Croud', fullname = 'Mark Croud'
WHERE email = 'mc@ajryan.co.uk';

-- Drop existing restrictive RLS policies that prevent admin updates
DROP POLICY IF EXISTS "Users can update profile data only" ON public.users;

-- Create comprehensive RLS policies for user management
CREATE POLICY "Users can read own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = supabase_auth_id);

CREATE POLICY "Users can update own profile data" 
ON public.users FOR UPDATE 
USING (auth.uid() = supabase_auth_id)
WITH CHECK (auth.uid() = supabase_auth_id);

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

-- Create function to set trial period for new users
CREATE OR REPLACE FUNCTION public.set_trial_period()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set trial expiry to 24 hours from creation for new users
  IF NEW.trial_expires_at IS NULL AND NEW.account_status = 'trial' THEN
    NEW.trial_expires_at := NOW() + INTERVAL '24 hours';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user trial setup
DROP TRIGGER IF EXISTS set_trial_period_trigger ON public.users;
CREATE TRIGGER set_trial_period_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_period();

-- Create function to expire trial accounts
CREATE OR REPLACE FUNCTION public.expire_trial_accounts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update trial accounts that have expired
  UPDATE public.users 
  SET account_status = 'expired'
  WHERE account_status = 'trial' 
    AND trial_expires_at < NOW()
    AND trial_expires_at IS NOT NULL;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log the expiry action
  INSERT INTO public.notifications (creator_id, type, body)
  SELECT 
    NULL,
    'trial_expired_batch',
    'Expired ' || expired_count || ' trial accounts'
  WHERE expired_count > 0;
  
  RETURN expired_count;
END;
$$;

-- Create function to extend trial period
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

-- Create function to permanently activate user
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
