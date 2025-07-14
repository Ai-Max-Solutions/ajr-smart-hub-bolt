-- Fix the enhanced_audit_trigger function to handle tables with different primary key names
CREATE OR REPLACE FUNCTION public.enhanced_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    current_user_id UUID;
    old_record JSONB;
    new_record JSONB;
    record_id TEXT;
BEGIN
    -- Get current user ID from Users table
    SELECT whalesync_postgres_id INTO current_user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Convert records to JSONB
    IF TG_OP = 'DELETE' THEN
        old_record := to_jsonb(OLD);
        new_record := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_record := to_jsonb(OLD);
        new_record := to_jsonb(NEW);
    ELSE -- INSERT
        old_record := NULL;
        new_record := to_jsonb(NEW);
    END IF;
    
    -- Get the record ID based on the table structure
    IF TG_OP = 'DELETE' THEN
        -- Try to get the primary key value - handle both 'id' and 'whalesync_postgres_id'
        record_id := COALESCE(
            old_record->>'id',
            old_record->>'whalesync_postgres_id'
        );
    ELSE
        -- Try to get the primary key value - handle both 'id' and 'whalesync_postgres_id'
        record_id := COALESCE(
            new_record->>'id',
            new_record->>'whalesync_postgres_id'
        );
    END IF;
    
    -- Insert audit log
    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        current_user_id,
        TG_OP,
        TG_TABLE_NAME,
        record_id::UUID,
        old_record,
        new_record,
        inet_client_addr(),
        current_setting('request.headers', true)::jsonb->>'user-agent'
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;