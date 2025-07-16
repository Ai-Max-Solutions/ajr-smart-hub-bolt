-- Update function that references old column name
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
    current_user_id UUID;
BEGIN
    -- Get current user's ID and role (updated to use 'id' instead of 'whalesync_postgres_id')
    SELECT id, role INTO current_user_id, current_user_role
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Prevent users from updating their own role
    IF OLD.id = current_user_id AND OLD.role != NEW.role THEN
        RAISE EXCEPTION 'Users cannot update their own role. Role changes must be approved by administrators.';
    END IF;
    
    -- Only admins can change roles
    IF OLD.role != NEW.role AND current_user_role NOT IN ('Admin', 'Document Controller') THEN
        RAISE EXCEPTION 'Only administrators can change user roles.';
    END IF;
    
    -- Log role changes
    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        current_user_id,
        'role_change',
        'Users',
        NEW.id,
        jsonb_build_object('role', OLD.role),
        jsonb_build_object('role', NEW.role)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;