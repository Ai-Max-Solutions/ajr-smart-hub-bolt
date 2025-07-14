-- Phase 1: Critical Security Fixes

-- 1. Fix RLS Policy Gaps for AI Tables

-- Enable RLS on AI tables that don't have proper policies
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- AI Conversations: Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON public.ai_conversations
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations" ON public.ai_conversations
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations" ON public.ai_conversations
FOR UPDATE USING (user_id = auth.uid());

-- AI Messages: Users can only access messages in their conversations
CREATE POLICY "Users can view messages in own conversations" ON public.ai_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE ai_conversations.id = ai_messages.conversation_id 
    AND ai_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in own conversations" ON public.ai_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE ai_conversations.id = ai_messages.conversation_id 
    AND ai_conversations.user_id = auth.uid()
  )
);

-- Document Embeddings: Restrict access based on user permissions
CREATE POLICY "Users can view relevant document embeddings" ON public.document_embeddings
FOR SELECT USING (
  -- Allow if user has document controller role or is admin
  EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
  )
);

-- Activity Metrics: Fix missing policies
CREATE POLICY "Users can insert own activity metrics" ON public.activity_metrics
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own activity metrics" ON public.activity_metrics
FOR UPDATE USING (user_id = auth.uid());

-- Admins can view all activity metrics
CREATE POLICY "Admins can view all activity metrics" ON public.activity_metrics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller')
  )
);

-- 2. Role Escalation Prevention

-- Create function to prevent role escalation
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
    current_user_id UUID;
BEGIN
    -- Get current user's ID and role
    SELECT whalesync_postgres_id, role INTO current_user_id, current_user_role
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Prevent users from updating their own role
    IF OLD.whalesync_postgres_id = current_user_id AND OLD.role != NEW.role THEN
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
        NEW.whalesync_postgres_id,
        jsonb_build_object('role', OLD.role),
        jsonb_build_object('role', NEW.role)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role escalation prevention
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public."Users";
CREATE TRIGGER prevent_role_escalation_trigger
    BEFORE UPDATE ON public."Users"
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_escalation();

-- 3. AI Input Sanitization Function

-- Create function to sanitize AI input
CREATE OR REPLACE FUNCTION public.sanitize_ai_input(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remove potential SQL injection patterns
    input_text := regexp_replace(input_text, '(--|/\*|\*/|;|\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bINSERT\b|\bUPDATE\b)', '', 'gi');
    
    -- Remove script tags and potential XSS
    input_text := regexp_replace(input_text, '<script[^>]*>.*?</script>', '', 'gi');
    input_text := regexp_replace(input_text, 'javascript:', '', 'gi');
    input_text := regexp_replace(input_text, 'on\w+\s*=', '', 'gi');
    
    -- Limit length to prevent DoS
    IF length(input_text) > 50000 THEN
        input_text := substring(input_text from 1 for 50000);
    END IF;
    
    RETURN input_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Rate Limiting Function

-- Create table for rate limiting
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rate limits
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limits
CREATE POLICY "Users can view own rate limits" ON public.ai_rate_limits
FOR SELECT USING (user_id = auth.uid());

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
    p_user_id UUID,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Clean up old entries
    DELETE FROM public.ai_rate_limits 
    WHERE window_start < (NOW() - '24 hours'::INTERVAL);
    
    -- Count requests in current window
    SELECT COALESCE(SUM(request_count), 0) INTO current_count
    FROM public.ai_rate_limits
    WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start > (NOW() - (p_window_minutes || ' minutes')::INTERVAL);
    
    -- Check if limit exceeded
    IF current_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Record this request
    INSERT INTO public.ai_rate_limits (user_id, endpoint, window_start)
    VALUES (p_user_id, p_endpoint, NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enhanced Audit Logging

-- Update audit log trigger to capture more security events
CREATE OR REPLACE FUNCTION public.enhanced_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user ID
    SELECT whalesync_postgres_id INTO current_user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Log the operation
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
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply enhanced audit triggers to sensitive tables
DROP TRIGGER IF EXISTS enhanced_audit_trigger ON public."Users";
CREATE TRIGGER enhanced_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public."Users"
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

-- 6. Secure Vector Search Function

-- Create secure function for document search
CREATE OR REPLACE FUNCTION public.secure_document_search(
    query_text TEXT,
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 5
)
RETURNS TABLE(
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Get user role for access control
    SELECT role INTO current_user_role
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Only allow document controllers and admins to search
    IF current_user_role NOT IN ('Admin', 'Document Controller', 'Project Manager') THEN
        RAISE EXCEPTION 'Insufficient permissions for document search';
    END IF;
    
    -- Sanitize query text
    query_text := public.sanitize_ai_input(query_text);
    
    -- Return empty result for now (embedding search will be implemented later)
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;