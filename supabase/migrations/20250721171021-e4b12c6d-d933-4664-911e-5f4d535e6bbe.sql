
-- Phase 1: Database Schema Updates
-- Add project_id to delivery_bookings table and update RLS policies

-- Step 1: Add project_id column to delivery_bookings
ALTER TABLE public.delivery_bookings 
ADD COLUMN project_id UUID REFERENCES public.projects(id);

-- Step 2: Update existing delivery bookings to assign them to a default project
-- For demo purposes, assign to the first available project
UPDATE public.delivery_bookings 
SET project_id = (
  SELECT id FROM public.projects 
  WHERE is_archived = false 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE project_id IS NULL;

-- Step 3: Make project_id NOT NULL after populating existing data
ALTER TABLE public.delivery_bookings 
ALTER COLUMN project_id SET NOT NULL;

-- Step 4: Update RLS policies to filter by project access
DROP POLICY IF EXISTS "Document controllers can view delivery bookings" ON public.delivery_bookings;
DROP POLICY IF EXISTS "Admins can manage delivery bookings" ON public.delivery_bookings;

-- Create new project-based RLS policies
CREATE POLICY "Users can view deliveries for their current project" 
ON public.delivery_bookings
FOR SELECT
USING (
  project_id IN (
    SELECT u.currentproject 
    FROM public.users u 
    WHERE u.supabase_auth_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.supabase_auth_id = auth.uid() 
    AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
  )
);

CREATE POLICY "Admins can manage all delivery bookings" 
ON public.delivery_bookings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.supabase_auth_id = auth.uid() 
    AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
  )
);

CREATE POLICY "Users can create deliveries for their current project" 
ON public.delivery_bookings
FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT u.currentproject 
    FROM public.users u 
    WHERE u.supabase_auth_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.supabase_auth_id = auth.uid() 
    AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
  )
);

-- Step 5: Create function to get user's accessible projects
CREATE OR REPLACE FUNCTION public.get_user_accessible_projects(user_auth_id UUID)
RETURNS TABLE(project_id UUID, project_name TEXT, project_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
  current_project UUID;
BEGIN
  -- Get user role and current project
  SELECT u.role::TEXT, u.currentproject 
  INTO user_role, current_project
  FROM public.users u 
  WHERE u.supabase_auth_id = user_auth_id;
  
  -- If admin/supervisor, return all active projects
  IF user_role IN ('Admin', 'PM', 'Director', 'Supervisor') THEN
    RETURN QUERY
    SELECT p.id, p.name, p.code
    FROM public.projects p
    WHERE p.is_archived = false
    ORDER BY p.name;
  ELSE
    -- Regular users only see their current project
    RETURN QUERY
    SELECT p.id, p.name, p.code
    FROM public.projects p
    WHERE p.id = current_project
    AND p.is_archived = false;
  END IF;
END;
$$;

-- Step 6: Create function to get delivery stats by project
CREATE OR REPLACE FUNCTION public.get_delivery_stats_by_project(p_project_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  pending_count INTEGER;
  booked_count INTEGER;
  today_count INTEGER;
  week_count INTEGER;
  result JSON;
BEGIN
  -- Count pending deliveries
  SELECT COUNT(*) INTO pending_count
  FROM public.delivery_bookings
  WHERE project_id = p_project_id AND status = 'pending';
  
  -- Count booked deliveries
  SELECT COUNT(*) INTO booked_count
  FROM public.delivery_bookings
  WHERE project_id = p_project_id AND status = 'booked';
  
  -- Count today's deliveries
  SELECT COUNT(*) INTO today_count
  FROM public.delivery_bookings
  WHERE project_id = p_project_id 
  AND delivery_date = CURRENT_DATE;
  
  -- Count this week's deliveries
  SELECT COUNT(*) INTO week_count
  FROM public.delivery_bookings
  WHERE project_id = p_project_id 
  AND delivery_date >= date_trunc('week', CURRENT_DATE)
  AND delivery_date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days';
  
  result := json_build_object(
    'pending', pending_count,
    'booked', booked_count,
    'today', today_count,
    'week', week_count
  );
  
  RETURN result;
END;
$$;
