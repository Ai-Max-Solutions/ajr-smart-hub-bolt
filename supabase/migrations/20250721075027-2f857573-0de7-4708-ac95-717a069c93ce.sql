
-- Enhanced safe project deletion with comprehensive FK cleanup and audit logging
CREATE OR REPLACE FUNCTION public.delete_project_safe(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_project_name TEXT;
  v_deleted_counts jsonb;
  v_timesheet_entries_count INTEGER := 0;
  v_timesheets_count INTEGER := 0;
  v_unit_work_logs_count INTEGER := 0;
  v_unit_work_assignments_count INTEGER := 0;
  v_plot_tasks_count INTEGER := 0;
  v_project_team_members_count INTEGER := 0;
  v_plots_count INTEGER := 0;
  v_project_levels_count INTEGER := 0;
  v_project_blocks_count INTEGER := 0;
  v_project_rams_requirements_count INTEGER := 0;
  v_rams_documents_count INTEGER := 0;
  v_users_updated INTEGER := 0;
  v_hire_items_updated INTEGER := 0;
BEGIN
  -- Validate: Project must exist
  SELECT name INTO v_project_name FROM projects WHERE id = p_project_id;
  
  IF v_project_name IS NULL THEN
    RAISE EXCEPTION 'Project not found with ID: %', p_project_id;
  END IF;
  
  -- Log the deletion attempt
  INSERT INTO notifications (creator_id, type, body)
  VALUES (
    auth.uid(),
    'project_delete_start',
    'Starting deletion of project: ' || v_project_name || ' (ID: ' || p_project_id || ')'
  );
  
  -- Phase 1: Nullify FK references (non-cascading)
  UPDATE users 
  SET currentproject = NULL 
  WHERE currentproject = p_project_id;
  GET DIAGNOSTICS v_users_updated = ROW_COUNT;
  
  UPDATE on_hire_items 
  SET current_project_id = NULL 
  WHERE current_project_id = p_project_id;
  GET DIAGNOSTICS v_hire_items_updated = ROW_COUNT;
  
  -- Phase 2: Delete dependent records (order matters for FK constraints)
  
  -- Delete timesheet entries first (depends on timesheets)
  DELETE FROM timesheet_entries 
  WHERE timesheet_id IN (
    SELECT id FROM timesheets WHERE project_id = p_project_id
  );
  GET DIAGNOSTICS v_timesheet_entries_count = ROW_COUNT;
  
  -- Delete unit work logs (depends on plots)
  DELETE FROM unit_work_logs 
  WHERE plot_id IN (
    SELECT id FROM plots WHERE project_id = p_project_id
  );
  GET DIAGNOSTICS v_unit_work_logs_count = ROW_COUNT;
  
  -- Delete unit work assignments (depends on plots)
  DELETE FROM unit_work_assignments 
  WHERE plot_id IN (
    SELECT id FROM plots WHERE project_id = p_project_id
  );
  GET DIAGNOSTICS v_unit_work_assignments_count = ROW_COUNT;
  
  -- Delete plot tasks
  DELETE FROM plot_tasks WHERE project_id = p_project_id;
  GET DIAGNOSTICS v_plot_tasks_count = ROW_COUNT;
  
  -- Delete plot QR codes (depends on plots)
  DELETE FROM plot_qr_codes 
  WHERE plot_id IN (
    SELECT id FROM plots WHERE project_id = p_project_id
  );
  
  -- Delete timesheets
  DELETE FROM timesheets WHERE project_id = p_project_id;
  GET DIAGNOSTICS v_timesheets_count = ROW_COUNT;
  
  -- Delete project team members
  DELETE FROM project_team_members WHERE project_id = p_project_id;
  GET DIAGNOSTICS v_project_team_members_count = ROW_COUNT;
  
  -- Delete plots
  DELETE FROM plots WHERE project_id = p_project_id;
  GET DIAGNOSTICS v_plots_count = ROW_COUNT;
  
  -- Delete project levels
  DELETE FROM project_levels WHERE project_id = p_project_id;
  GET DIAGNOSTICS v_project_levels_count = ROW_COUNT;
  
  -- Delete project blocks
  DELETE FROM project_blocks WHERE project_id = p_project_id;
  GET DIAGNOSTICS v_project_blocks_count = ROW_COUNT;
  
  -- Delete project RAMS requirements
  DELETE FROM project_rams_requirements WHERE project_id = p_project_id;
  GET DIAGNOSTICS v_project_rams_requirements_count = ROW_COUNT;
  
  -- Delete project-specific RAMS documents
  DELETE FROM rams_documents WHERE project_id = p_project_id;
  GET DIAGNOSTICS v_rams_documents_count = ROW_COUNT;
  
  -- Phase 3: Delete the project itself
  DELETE FROM projects WHERE id = p_project_id;
  
  -- Build deletion summary
  v_deleted_counts := jsonb_build_object(
    'project_name', v_project_name,
    'timesheet_entries', v_timesheet_entries_count,
    'timesheets', v_timesheets_count,
    'unit_work_logs', v_unit_work_logs_count,
    'unit_work_assignments', v_unit_work_assignments_count,
    'plot_tasks', v_plot_tasks_count,
    'project_team_members', v_project_team_members_count,
    'plots', v_plots_count,
    'project_levels', v_project_levels_count,
    'project_blocks', v_project_blocks_count,
    'project_rams_requirements', v_project_rams_requirements_count,
    'rams_documents', v_rams_documents_count,
    'users_updated', v_users_updated,
    'hire_items_updated', v_hire_items_updated
  );
  
  -- Log successful deletion with details
  INSERT INTO notifications (creator_id, type, body)
  VALUES (
    auth.uid(),
    'project_delete_success',
    'Successfully deleted project: ' || v_project_name || ' and all linked data. Details: ' || v_deleted_counts::text
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Project "' || v_project_name || '" deleted successfully',
    'deleted_counts', v_deleted_counts
  );
  
EXCEPTION
  WHEN others THEN
    -- Log the error
    INSERT INTO notifications (creator_id, type, body)
    VALUES (
      auth.uid(),
      'project_delete_error',
      'Failed to delete project: ' || v_project_name || '. Error: ' || SQLERRM
    );
    
    -- Re-raise the exception
    RAISE EXCEPTION 'Delete operation failed: %', SQLERRM;
END;
$$;

-- Update the existing delete_project_cascade function to use the new safe version
CREATE OR REPLACE FUNCTION public.delete_project_cascade(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Call the enhanced safe delete function
  v_result := delete_project_safe(p_project_id);
  
  -- Return boolean for backward compatibility
  RETURN (v_result->>'success')::boolean;
END;
$$;

-- Add RLS policy for the enhanced function
CREATE POLICY "Admins can use enhanced project deletion" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_auth_id = auth.uid() AND role IN ('Admin', 'PM', 'Director'))
);
