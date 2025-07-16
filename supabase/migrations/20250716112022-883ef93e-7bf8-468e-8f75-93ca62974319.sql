-- Update validate_role_change function to use 'id' instead of 'whalesync_postgres_id'
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    SELECT role INTO current_user_role
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Prevent privilege escalation
    IF OLD.role != NEW.role AND current_user_role NOT IN ('Admin', 'Document Controller') THEN
        IF NEW.role IN ('Admin', 'Document Controller', 'Director') THEN
            RAISE EXCEPTION 'Insufficient privileges to assign administrative roles';
        END IF;
    END IF;
    
    -- Prevent self-role modification
    IF OLD.id = (
        SELECT id FROM public."Users" WHERE supabase_auth_id = auth.uid()
    ) AND OLD.role != NEW.role THEN
        RAISE EXCEPTION 'Users cannot modify their own role';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;