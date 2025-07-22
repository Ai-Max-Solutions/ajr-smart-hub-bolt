

DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;

DROP POLICY IF EXISTS "Verified users can view all users" ON public.users;

DROP POLICY IF EXISTS "Users can update own basic profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;

DROP POLICY IF EXISTS "Users can view all users" ON public.Users;
DROP POLICY IF EXISTS "Users can update their own record" ON public.Users;
DROP POLICY IF EXISTS "Users can insert their own record" ON public.Users;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable users to update own record" ON public.users;
DROP POLICY IF EXISTS "Enable users to insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update profile data only" ON public.users;


CREATE POLICY "authenticated_users_can_read" ON public.users 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_can_update_own_record" ON public.users 
FOR UPDATE USING (auth.uid() = supabase_auth_id);

CREATE POLICY "users_can_insert_own_record" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = supabase_auth_id);
