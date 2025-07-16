-- Enhancement Migration: Align users table with comprehensive schema
-- Phase 1: Add missing columns to users table

-- Add firstname and lastname columns
ALTER TABLE public.users 
ADD COLUMN firstname text,
ADD COLUMN lastname text;

-- Migrate existing name data to firstname/lastname
UPDATE public.users 
SET firstname = TRIM(SPLIT_PART(name, ' ', 1)),
    lastname = TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
WHERE name IS NOT NULL AND name != '';

-- Add fullname as generated column
ALTER TABLE public.users 
ADD COLUMN fullname text GENERATED ALWAYS AS (
  TRIM(COALESCE(firstname, '') || ' ' || COALESCE(lastname, ''))
) STORED;

-- Add employment status with default
ALTER TABLE public.users 
ADD COLUMN employmentstatus text DEFAULT 'Active'
CHECK (employmentstatus IN ('Active', 'Inactive', 'Suspended', 'Terminated', 'Apprentice'));

-- Add current project reference
ALTER TABLE public.users 
ADD COLUMN currentproject uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add onboarding completion flag
ALTER TABLE public.users 
ADD COLUMN onboarding_completed boolean DEFAULT false;

-- Add internal notes
ALTER TABLE public.users 
ADD COLUMN internalnotes text;

-- Add last sign in tracking
ALTER TABLE public.users 
ADD COLUMN last_sign_in timestamptz;

-- Add airtable created time for data migration compatibility
ALTER TABLE public.users 
ADD COLUMN airtable_created_time date DEFAULT CURRENT_DATE;

-- Phase 2: Update existing data with sensible defaults
UPDATE public.users 
SET employmentstatus = 'Active'
WHERE employmentstatus IS NULL;

UPDATE public.users 
SET onboarding_completed = false
WHERE onboarding_completed IS NULL;

UPDATE public.users 
SET airtable_created_time = created_at::date
WHERE airtable_created_time IS NULL;

-- Phase 3: Create trigger to update last_sign_in on profile access
CREATE OR REPLACE FUNCTION update_last_sign_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update last_sign_in when a user accesses their profile
    UPDATE public.users 
    SET last_sign_in = now()
    WHERE supabase_auth_id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users to update last_sign_in
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE PROCEDURE update_last_sign_in();