-- Update enhanced_audit_trigger function to use 'id' instead of 'whalesync_postgres_id'
CREATE OR REPLACE FUNCTION public.enhanced_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    change_summary TEXT;
BEGIN
    -- Get current user's ID using the updated column name
    SELECT id INTO current_user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Create change summary
    change_summary := TG_OP || ' on ' || TG_TABLE_NAME;
    
    -- Insert enhanced audit log
    INSERT INTO public.audit_trail (
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        changed_by,
        changed_at,
        change_reason
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::TEXT,
        TG_OP,
        CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        current_user_id::TEXT,
        NOW(),
        change_summary
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;