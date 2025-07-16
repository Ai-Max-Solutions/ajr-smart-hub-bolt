-- Update all remaining functions that reference whalesync_postgres_id
CREATE OR REPLACE FUNCTION public.log_role_change_attempt()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_role TEXT;
BEGIN
    -- Get current user's ID and role using updated column name
    SELECT id, role INTO current_user_id, current_user_role
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Log the role change attempt
    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        current_user_id,
        'role_change_attempt',
        'Users',
        NEW.id,
        jsonb_build_object('old_role', OLD.role),
        jsonb_build_object('new_role', NEW.role)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update cleanup_orphaned_records function
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_records()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    DELETE FROM public.activity_metrics 
    WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM public."Users");
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    DELETE FROM public."Plot_Assignments" 
    WHERE user_id NOT IN (SELECT id FROM public."Users")
    OR plot_id NOT IN (SELECT id FROM public."Plots");
    
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM public."Work_Tracking_History" 
    WHERE user_id NOT IN (SELECT id FROM public."Users")
    OR plot_id NOT IN (SELECT id FROM public."Plots");
    
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;