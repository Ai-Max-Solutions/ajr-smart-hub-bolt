-- Phase 1: Add missing foreign key constraint for Users.supabase_auth_id
ALTER TABLE public."Users" 
ADD CONSTRAINT users_supabase_auth_id_fkey 
FOREIGN KEY (supabase_auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Phase 2: Update RLS policies that depend on whalesync_user_id before dropping the column
-- Update smart_schedules policy
DROP POLICY IF EXISTS "Users view relevant schedules" ON public.smart_schedules;
CREATE POLICY "Users view relevant schedules" ON public.smart_schedules
FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Director')
    )
);

-- Update location_tracking policies
DROP POLICY IF EXISTS "Users view own location" ON public.location_tracking;
CREATE POLICY "Users view own location" ON public.location_tracking
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users track own location" ON public.location_tracking;
CREATE POLICY "Users track own location" ON public.location_tracking
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update timesheets policies  
DROP POLICY IF EXISTS "Users can view own timesheets" ON public.timesheets;
CREATE POLICY "Users can view own timesheets" ON public.timesheets
FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Director')
    )
);

DROP POLICY IF EXISTS "Users can update own draft timesheets" ON public.timesheets;
CREATE POLICY "Users can update own draft timesheets" ON public.timesheets
FOR UPDATE USING (
    user_id = auth.uid() AND status = 'draft'
);

-- Update timesheet_entries policy
DROP POLICY IF EXISTS "Users manage timesheet entries" ON public.timesheet_entries;
CREATE POLICY "Users manage timesheet entries" ON public.timesheet_entries
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.timesheets t 
        WHERE t.id = timesheet_entries.timesheet_id 
        AND t.user_id = auth.uid()
    )
);

-- Update notifications policy
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
FOR ALL USING (user_id = auth.uid());

-- Phase 3: Handle dependent constraints before restructuring profiles table
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

-- Now drop the whalesync_user_id column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS whalesync_user_id CASCADE;