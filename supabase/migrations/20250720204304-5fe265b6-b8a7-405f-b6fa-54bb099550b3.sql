
-- Add "Delayed" status to the project_status_enum
ALTER TYPE project_status_enum ADD VALUE 'Delayed';

-- Create function to scan for project delays using AI logic
CREATE OR REPLACE FUNCTION public.scan_project_delays()
RETURNS TABLE(project_id uuid, project_name text, delay_reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH project_progress AS (
    SELECT 
      p.id,
      p.name,
      p.end_date,
      p.status,
      COALESCE(
        (SELECT COUNT(*) FROM unit_work_assignments uwa 
         JOIN plots pl ON pl.id = uwa.plot_id 
         WHERE pl.project_id = p.id AND uwa.status = 'completed')::NUMERIC / 
        NULLIF((SELECT COUNT(*) FROM unit_work_assignments uwa 
                JOIN plots pl ON pl.id = uwa.plot_id 
                WHERE pl.project_id = p.id), 0) * 100, 
        0
      ) as completion_percentage
    FROM projects p
    WHERE p.is_archived = false
  )
  SELECT 
    pp.id,
    pp.name,
    CASE 
      WHEN pp.end_date IS NOT NULL AND pp.end_date <= (CURRENT_DATE + INTERVAL '7 days') 
           AND pp.completion_percentage < 80 
      THEN 'Project deadline within 7 days but only ' || ROUND(pp.completion_percentage, 0) || '% complete'
      ELSE 'No delays detected'
    END as delay_reason
  FROM project_progress pp
  WHERE pp.end_date IS NOT NULL 
    AND pp.end_date <= (CURRENT_DATE + INTERVAL '7 days')
    AND pp.completion_percentage < 80
    AND pp.status != 'Delayed';
END;
$$;

-- Create function to auto-update delayed project statuses
CREATE OR REPLACE FUNCTION public.auto_flag_delayed_projects()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  -- Update projects that should be marked as delayed
  UPDATE projects 
  SET status = 'Delayed', updated_at = now()
  WHERE id IN (
    SELECT project_id FROM scan_project_delays()
  );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Create function to archive project safely
CREATE OR REPLACE FUNCTION public.archive_project(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if project exists and user has permission
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  -- Archive the project
  UPDATE projects 
  SET is_archived = true, updated_at = now()
  WHERE id = p_project_id;
  
  RETURN true;
END;
$$;

-- Create function to delete project with cascading
CREATE OR REPLACE FUNCTION public.delete_project_cascade(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if project exists and user has permission
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  -- Delete all related records (cascading will handle most, but let's be explicit)
  DELETE FROM unit_work_logs WHERE plot_id IN (
    SELECT id FROM plots WHERE project_id = p_project_id
  );
  
  DELETE FROM unit_work_assignments WHERE plot_id IN (
    SELECT id FROM plots WHERE project_id = p_project_id
  );
  
  DELETE FROM plot_tasks WHERE project_id = p_project_id;
  
  DELETE FROM project_team_members WHERE project_id = p_project_id;
  
  DELETE FROM plots WHERE project_id = p_project_id;
  
  DELETE FROM project_levels WHERE project_id = p_project_id;
  
  DELETE FROM project_blocks WHERE project_id = p_project_id;
  
  -- Finally delete the project
  DELETE FROM projects WHERE id = p_project_id;
  
  RETURN true;
END;
$$;

-- Add RLS policies for the new functions
CREATE POLICY "Admins can use project management functions" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_auth_id = auth.uid() AND role IN ('Admin', 'PM', 'Director'))
);
