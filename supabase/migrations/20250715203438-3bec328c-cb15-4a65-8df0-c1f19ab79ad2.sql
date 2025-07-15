-- Fix RLS policies on Users table
-- Drop the problematic policy that prevents profile updates
DROP POLICY IF EXISTS "Users can update their own profiles" ON public."Users";

-- The correct policy "Users can update own profile" using supabase_auth_id = auth.uid() will remain active