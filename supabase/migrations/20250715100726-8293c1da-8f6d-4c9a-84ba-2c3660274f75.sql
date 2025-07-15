-- Phase 1: Critical Role Security Fixes

-- 1. Create enhanced role change audit function
CREATE OR REPLACE FUNCTION public.log_role_change_attempt()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_role TEXT;
    attempt_details JSONB;
BEGIN
    -- Get current user details
    SELECT whalesync_postgres_id, role INTO current_user_id, current_user_role
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Build attempt details
    attempt_details := jsonb_build_object(
        'attempted_by', current_user_id,
        'attemper_role', current_user_role,
        'target_user', COALESCE(NEW.whalesync_postgres_id, OLD.whalesync_postgres_id),
        'old_role', OLD.role,
        'new_role', NEW.role,
        'timestamp', now(),
        'ip_address', inet_client_addr(),
        'user_agent', current_setting('request.headers')::json->>'user-agent'
    );
    
    -- Log all role change attempts
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
        'ROLE_CHANGE_ATTEMPT',
        'Users',
        COALESCE(NEW.whalesync_postgres_id, OLD.whalesync_postgres_id),
        jsonb_build_object('role', OLD.role, 'details', attempt_details),
        jsonb_build_object('role', NEW.role, 'details', attempt_details),
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create strict role validation function
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_role TEXT;
    target_user_id UUID;
    is_self_update BOOLEAN;
    is_authorized BOOLEAN := FALSE;
BEGIN
    -- Get current user details
    SELECT whalesync_postgres_id, role INTO current_user_id, current_user_role
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Check if this is a self-update
    target_user_id := NEW.whalesync_postgres_id;
    is_self_update := (current_user_id = target_user_id);
    
    -- Prevent users from changing their own role
    IF is_self_update AND OLD.role != NEW.role THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Users cannot modify their own role. Contact an administrator for role changes.';
    END IF;
    
    -- Check authorization for role changes
    IF OLD.role != NEW.role THEN
        -- Only specific roles can change user roles
        IF current_user_role IN ('Admin', 'Document Controller') THEN
            is_authorized := TRUE;
        ELSE
            RAISE EXCEPTION 'SECURITY_VIOLATION: Insufficient privileges to modify user roles. Required: Admin or Document Controller.';
        END IF;
        
        -- Additional validation: prevent elevation to admin without proper approval
        IF NEW.role = 'Admin' AND current_user_role != 'Admin' THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: Only existing Admins can create new Admin users.';
        END IF;
        
        -- Log successful role change
        INSERT INTO public.audit_log (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values
        ) VALUES (
            current_user_id,
            'ROLE_CHANGE_SUCCESS',
            'Users',
            target_user_id,
            jsonb_build_object('role', OLD.role),
            jsonb_build_object('role', NEW.role, 'authorized_by', current_user_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create enhanced input sanitization functions
CREATE OR REPLACE FUNCTION public.sanitize_user_input(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove dangerous SQL patterns
    input_text := regexp_replace(input_text, '(--|/\*|\*/|;|\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bALTER\b|\bCREATE\b|\bEXEC\b|\bEXECUTE\b)', '', 'gi');
    
    -- Remove script tags and XSS patterns
    input_text := regexp_replace(input_text, '<script[^>]*>.*?</script>', '', 'gi');
    input_text := regexp_replace(input_text, 'javascript:', '', 'gi');
    input_text := regexp_replace(input_text, 'on\w+\s*=', '', 'gi');
    input_text := regexp_replace(input_text, 'data:text/html', '', 'gi');
    
    -- Remove potential injection patterns
    input_text := regexp_replace(input_text, '(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b)', '', 'gi');
    
    -- Limit length to prevent DoS
    IF length(input_text) > 10000 THEN
        input_text := substring(input_text from 1 for 10000);
    END IF;
    
    -- Trim whitespace
    input_text := trim(input_text);
    
    RETURN input_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Create security monitoring function
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(p_user_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    user_id UUID;
    suspicious_patterns JSONB;
    recent_attempts INTEGER;
    role_change_attempts INTEGER;
    rapid_actions INTEGER;
BEGIN
    user_id := COALESCE(p_user_id, (
        SELECT whalesync_postgres_id 
        FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    ));
    
    -- Count recent suspicious activities
    SELECT 
        COUNT(*) FILTER (WHERE action LIKE '%ROLE_CHANGE%' AND created_at > now() - interval '1 hour'),
        COUNT(*) FILTER (WHERE action = 'FAILED_LOGIN' AND created_at > now() - interval '15 minutes'),
        COUNT(*) FILTER (WHERE created_at > now() - interval '5 minutes')
    INTO role_change_attempts, recent_attempts, rapid_actions
    FROM public.audit_log
    WHERE user_id = user_id OR record_id::text = user_id::text;
    
    -- Build suspicious patterns report
    suspicious_patterns := jsonb_build_object(
        'user_id', user_id,
        'timestamp', now(),
        'patterns', jsonb_build_object(
            'excessive_role_changes', role_change_attempts > 3,
            'failed_login_attempts', recent_attempts > 5,
            'rapid_fire_actions', rapid_actions > 50
        ),
        'counts', jsonb_build_object(
            'role_change_attempts', role_change_attempts,
            'recent_failed_attempts', recent_attempts,
            'rapid_actions', rapid_actions
        ),
        'risk_level', CASE 
            WHEN role_change_attempts > 3 OR recent_attempts > 10 THEN 'HIGH'
            WHEN role_change_attempts > 1 OR recent_attempts > 5 OR rapid_actions > 50 THEN 'MEDIUM'
            ELSE 'LOW'
        END
    );
    
    -- Auto-lock account if high risk detected
    IF suspicious_patterns->>'risk_level' = 'HIGH' THEN
        UPDATE public."Users"
        SET employmentstatus = 'Suspended',
            internalnotes = COALESCE(internalnotes, '') || E'\n' || 'AUTO-SUSPENDED: Suspicious activity detected at ' || now()
        WHERE whalesync_postgres_id = user_id;
        
        -- Log the auto-suspension
        INSERT INTO public.audit_log (
            user_id,
            action,
            table_name,
            record_id,
            new_values
        ) VALUES (
            user_id,
            'AUTO_SUSPENSION',
            'Users',
            user_id,
            suspicious_patterns
        );
    END IF;
    
    RETURN suspicious_patterns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create input validation trigger for Users table
CREATE OR REPLACE FUNCTION public.sanitize_user_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sanitize text fields
    NEW.firstname := public.sanitize_user_input(NEW.firstname);
    NEW.lastname := public.sanitize_user_input(NEW.lastname);
    NEW.fullname := public.sanitize_user_input(NEW.fullname);
    NEW.phone := public.sanitize_user_input(NEW.phone);
    NEW.internalnotes := public.sanitize_user_input(NEW.internalnotes);
    NEW.skills := array(SELECT public.sanitize_user_input(unnest(NEW.skills)));
    
    -- Update fullname if firstname/lastname changed
    IF NEW.firstname IS NOT NULL OR NEW.lastname IS NOT NULL THEN
        NEW.fullname := trim(COALESCE(NEW.firstname, '') || ' ' || COALESCE(NEW.lastname, ''));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Apply triggers to Users table
DROP TRIGGER IF EXISTS validate_role_change_trigger ON public."Users";
CREATE TRIGGER validate_role_change_trigger
    BEFORE UPDATE ON public."Users"
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_role_change();

DROP TRIGGER IF EXISTS log_role_change_attempt_trigger ON public."Users";
CREATE TRIGGER log_role_change_attempt_trigger
    AFTER UPDATE ON public."Users"
    FOR EACH ROW
    EXECUTE FUNCTION public.log_role_change_attempt();

DROP TRIGGER IF EXISTS sanitize_user_fields_trigger ON public."Users";
CREATE TRIGGER sanitize_user_fields_trigger
    BEFORE INSERT OR UPDATE ON public."Users"
    FOR EACH ROW
    EXECUTE FUNCTION public.sanitize_user_fields();

-- 7. Create rate limiting table for API calls
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate limits table
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits policies
CREATE POLICY "Users can view own rate limits" ON public.api_rate_limits
    FOR SELECT USING (
        user_id = (SELECT whalesync_postgres_id FROM public."Users" WHERE supabase_auth_id = auth.uid())
    );

CREATE POLICY "Service role can manage rate limits" ON public.api_rate_limits
    FOR ALL USING (auth.role() = 'service_role');

-- 8. Create enhanced rate limiting function
CREATE OR REPLACE FUNCTION public.check_enhanced_rate_limit(
    p_user_id UUID,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
    is_admin BOOLEAN;
BEGIN
    window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Check if user is admin (admins get higher limits)
    SELECT role IN ('Admin', 'Document Controller') INTO is_admin
    FROM public."Users"
    WHERE whalesync_postgres_id = p_user_id;
    
    -- Adjust limits for admin users
    IF is_admin THEN
        p_max_requests := p_max_requests * 3;
    END IF;
    
    -- Clean up old entries
    DELETE FROM public.api_rate_limits 
    WHERE window_start < (NOW() - '24 hours'::INTERVAL);
    
    -- Count requests in current window
    SELECT COALESCE(SUM(request_count), 0) INTO current_count
    FROM public.api_rate_limits
    WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start > (NOW() - (p_window_minutes || ' minutes')::INTERVAL);
    
    -- Check if limit exceeded
    IF current_count >= p_max_requests THEN
        -- Log rate limit violation
        INSERT INTO public.audit_log (
            user_id,
            action,
            table_name,
            record_id,
            new_values
        ) VALUES (
            p_user_id,
            'RATE_LIMIT_EXCEEDED',
            'api_rate_limits',
            p_user_id,
            jsonb_build_object(
                'endpoint', p_endpoint,
                'current_count', current_count,
                'max_requests', p_max_requests,
                'window_minutes', p_window_minutes
            )
        );
        
        RETURN FALSE;
    END IF;
    
    -- Record this request
    INSERT INTO public.api_rate_limits (user_id, endpoint, window_start)
    VALUES (p_user_id, p_endpoint, NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;