-- Phase 1: Add missing foreign key constraint for Users.supabase_auth_id
ALTER TABLE public."Users" 
ADD CONSTRAINT users_supabase_auth_id_fkey 
FOREIGN KEY (supabase_auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Phase 2: Handle dependent constraints before restructuring profiles table
-- Drop constraints that depend on profiles primary key
ALTER TABLE public.ai_conversations DROP CONSTRAINT IF EXISTS ai_conversations_user_id_fkey;

-- Drop existing profiles constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_whalesync_user_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

-- Add new primary key that references auth.users
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Recreate the ai_conversations foreign key to point to profiles.id (which now references auth.users.id)
ALTER TABLE public.ai_conversations 
ADD CONSTRAINT ai_conversations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop the whalesync_user_id column as it's no longer needed
ALTER TABLE public.profiles DROP COLUMN IF EXISTS whalesync_user_id;

-- Phase 3: Add unique constraints for data integrity
-- Clean up any duplicate emails first
DELETE FROM public."Users" u1 
WHERE u1.whalesync_postgres_id NOT IN (
    SELECT MIN(u2.whalesync_postgres_id) 
    FROM public."Users" u2 
    WHERE u2.email = u1.email AND u2.email IS NOT NULL
);

-- Add unique constraint on email
ALTER TABLE public."Users" ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Phase 4: Create auto-signup trigger for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert into profiles table when new user signs up
    INSERT INTO public.profiles (id, system_role, created_at, updated_at)
    VALUES (NEW.id, 'Worker', now(), now())
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();