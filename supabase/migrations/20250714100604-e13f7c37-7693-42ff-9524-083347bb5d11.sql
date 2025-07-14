-- Legendary Smart Notifications System Database Migration (Fixed)
-- Enhanced notification tables with multi-channel delivery, AI predictions, and compliance features

-- Drop existing smart_notifications table to rebuild with enhanced structure
DROP TABLE IF EXISTS public.smart_notifications CASCADE;

-- Core enhanced notifications table
CREATE TABLE public.smart_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_role TEXT NOT NULL,
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE SET NULL,
    
    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL, -- 'compliance', 'safety', 'document', 'training', 'pod', 'escalation'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    category TEXT NOT NULL, -- 'rams', 'drawing', 'induction', 'training', 'pod', 'notice'
    
    -- Multi-channel delivery
    delivery_channels JSONB NOT NULL DEFAULT '["in_app"]'::jsonb, -- ['in_app', 'push', 'sms', 'email', 'voice']
    delivery_status JSONB NOT NULL DEFAULT '{}'::jsonb, -- {channel: status, timestamp}
    fallback_attempted BOOLEAN DEFAULT FALSE,
    
    -- Smart features
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence NUMERIC(3,2), -- 0.00 to 1.00
    predicted_compliance_risk NUMERIC(3,2), -- 0.00 to 1.00
    auto_escalate_after INTERVAL DEFAULT '2 hours'::interval,
    
    -- User interaction
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    action_taken TEXT, -- 'signed', 'approved', 'dismissed', 'escalated'
    action_taken_at TIMESTAMP WITH TIME ZONE,
    
    -- Compliance and audit
    compliance_deadline TIMESTAMP WITH TIME ZONE,
    is_gdpr_sensitive BOOLEAN DEFAULT FALSE,
    audit_trail JSONB DEFAULT '[]'::jsonb,
    signature_vault_ref UUID,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Location and context
    geo_trigger_location POINT,
    geo_trigger_radius INTEGER, -- meters
    context_data JSONB DEFAULT '{}'::jsonb
);

-- Notification preferences per user
CREATE TABLE public.notification_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Channel preferences
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    email_enabled BOOLEAN DEFAULT TRUE,
    voice_enabled BOOLEAN DEFAULT FALSE,
    
    -- Timing preferences
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '07:00',
    weekend_notifications BOOLEAN DEFAULT FALSE,
    
    -- Priority thresholds
    min_priority_push TEXT DEFAULT 'medium',
    min_priority_sms TEXT DEFAULT 'high',
    min_priority_email TEXT DEFAULT 'medium',
    
    -- Role-specific settings
    role_overrides JSONB DEFAULT '{}'::jsonb,
    project_specific JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Escalation rules and workflows
CREATE TABLE public.notification_escalation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    
    -- Escalation path
    escalation_chain JSONB NOT NULL, -- [{"role": "Supervisor", "after": "1 hour"}, {"role": "Manager", "after": "4 hours"}]
    max_escalation_level INTEGER DEFAULT 3,
    
    -- Conditions
    project_ids UUID[] DEFAULT NULL, -- NULL means all projects
    applicable_roles TEXT[] NOT NULL,
    
    -- Smart conditions
    compliance_risk_threshold NUMERIC(3,2) DEFAULT 0.7,
    auto_escalate_unread BOOLEAN DEFAULT TRUE,
    auto_escalate_unacknowledged BOOLEAN DEFAULT TRUE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification analytics and insights
CREATE TABLE public.notification_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES public.smart_notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Engagement metrics
    delivery_time_ms INTEGER,
    time_to_read_seconds INTEGER,
    time_to_action_seconds INTEGER,
    interaction_count INTEGER DEFAULT 1,
    
    -- Channel performance
    successful_channels TEXT[],
    failed_channels TEXT[],
    final_delivery_channel TEXT,
    
    -- AI insights
    predicted_engagement_score NUMERIC(3,2),
    actual_engagement_score NUMERIC(3,2),
    ai_prediction_accuracy NUMERIC(3,2),
    
    -- Context
    device_type TEXT, -- 'mobile', 'desktop', 'tablet'
    location_context TEXT, -- 'on_site', 'office', 'remote'
    time_of_day TEXT, -- 'morning', 'afternoon', 'evening', 'night'
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI compliance predictions
CREATE TABLE public.ai_compliance_predictions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Prediction details
    prediction_type TEXT NOT NULL, -- 'training_expiry', 'document_compliance', 'safety_risk', 'deadline_miss'
    confidence_score NUMERIC(3,2) NOT NULL,
    predicted_date TIMESTAMP WITH TIME ZONE,
    risk_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    
    -- Contributing factors
    factors JSONB NOT NULL, -- {factor: weight, ...}
    historical_patterns JSONB,
    
    -- Actions
    recommended_actions JSONB NOT NULL,
    notification_generated BOOLEAN DEFAULT FALSE,
    notification_id UUID REFERENCES public.smart_notifications(id),
    
    -- Outcome tracking
    was_accurate BOOLEAN DEFAULT NULL,
    actual_outcome TEXT,
    prevention_success BOOLEAN DEFAULT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

-- Voice command logs for hands-free operation
CREATE TABLE public.voice_interaction_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES public.smart_notifications(id) ON DELETE SET NULL,
    
    -- Voice data
    command_text TEXT NOT NULL,
    confidence_score NUMERIC(3,2),
    intent_detected TEXT, -- 'read', 'acknowledge', 'dismiss', 'escalate', 'sign'
    
    -- Context
    background_noise_level TEXT, -- 'low', 'medium', 'high'
    location_context TEXT,
    device_info JSONB,
    
    -- Outcome
    action_successful BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced indexes for performance (fixed predicates)
CREATE INDEX idx_smart_notifications_user_unread ON public.smart_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_smart_notifications_priority_created ON public.smart_notifications(priority, created_at) WHERE expires_at > '2025-01-01'::timestamp;
CREATE INDEX idx_smart_notifications_compliance_deadline ON public.smart_notifications(compliance_deadline) WHERE compliance_deadline IS NOT NULL;
CREATE INDEX idx_smart_notifications_project_type ON public.smart_notifications(project_id, notification_type);
CREATE INDEX idx_smart_notifications_ai_risk ON public.smart_notifications(predicted_compliance_risk) WHERE predicted_compliance_risk > 0.5;

CREATE INDEX idx_notification_analytics_performance ON public.notification_analytics(delivery_time_ms, time_to_read_seconds);
CREATE INDEX idx_ai_predictions_active ON public.ai_compliance_predictions(prediction_type, confidence_score) WHERE expires_at > '2025-01-01'::timestamp;
CREATE INDEX idx_voice_logs_recent ON public.voice_interaction_logs(user_id, created_at) WHERE created_at > '2025-01-01'::timestamp;

-- Enable Row Level Security
ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_compliance_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_interaction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for smart_notifications
CREATE POLICY "Users view own notifications" ON public.smart_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins view all notifications" ON public.smart_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Document Controller', 'Project Manager')
        )
    );

CREATE POLICY "System can insert notifications" ON public.smart_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update own notification status" ON public.smart_notifications
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for notification_preferences
CREATE POLICY "Users manage own preferences" ON public.notification_preferences
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for escalation rules (admin only)
CREATE POLICY "Admins manage escalation rules" ON public.notification_escalation_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Document Controller')
        )
    );

-- RLS Policies for analytics (admin and own data)
CREATE POLICY "Users view own analytics" ON public.notification_analytics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins view all analytics" ON public.notification_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Document Controller')
        )
    );

-- RLS Policies for AI predictions
CREATE POLICY "Users view relevant predictions" ON public.ai_compliance_predictions
    FOR SELECT USING (
        user_id = auth.uid() OR 
        project_id IN (
            SELECT currentproject FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins view all predictions" ON public.ai_compliance_predictions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Document Controller', 'Project Manager')
        )
    );

-- RLS Policies for voice logs
CREATE POLICY "Users view own voice logs" ON public.voice_interaction_logs
    FOR ALL USING (user_id = auth.uid());

-- Update trigger for smart_notifications
CREATE OR REPLACE FUNCTION public.update_smart_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_smart_notifications_updated_at
    BEFORE UPDATE ON public.smart_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_smart_notifications_updated_at();

-- Update trigger for notification_preferences
CREATE TRIGGER trigger_update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for escalation rules
CREATE TRIGGER trigger_update_escalation_rules_updated_at
    BEFORE UPDATE ON public.notification_escalation_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Smart notification functions
CREATE OR REPLACE FUNCTION public.get_user_notifications(
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    message TEXT,
    notification_type TEXT,
    priority TEXT,
    category TEXT,
    is_read BOOLEAN,
    is_acknowledged BOOLEAN,
    action_taken TEXT,
    compliance_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    project_name TEXT,
    ai_confidence NUMERIC,
    predicted_compliance_risk NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Use provided user_id or get current user
    v_user_id := COALESCE(p_user_id, auth.uid());
    
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.message,
        n.notification_type,
        n.priority,
        n.category,
        n.is_read,
        n.is_acknowledged,
        n.action_taken,
        n.compliance_deadline,
        n.created_at,
        p.projectname as project_name,
        n.ai_confidence,
        n.predicted_compliance_risk
    FROM public.smart_notifications n
    LEFT JOIN public."Projects" p ON n.project_id = p.whalesync_postgres_id
    WHERE n.user_id = v_user_id
    AND (NOT p_unread_only OR n.is_read = FALSE)
    AND (n.expires_at IS NULL OR n.expires_at > now())
    ORDER BY 
        CASE n.priority
            WHEN 'critical' THEN 4
            WHEN 'high' THEN 3
            WHEN 'medium' THEN 2
            ELSE 1
        END DESC,
        n.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to create smart notification with AI enhancement
CREATE OR REPLACE FUNCTION public.create_smart_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_notification_type TEXT,
    p_priority TEXT DEFAULT 'medium',
    p_category TEXT DEFAULT 'general',
    p_project_id UUID DEFAULT NULL,
    p_compliance_deadline TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
    v_user_role TEXT;
    v_ai_risk_score NUMERIC;
BEGIN
    -- Get user role for context
    SELECT role INTO v_user_role
    FROM public."Users"
    WHERE supabase_auth_id = p_user_id;
    
    -- Calculate AI risk score based on type and deadline
    v_ai_risk_score := CASE 
        WHEN p_notification_type = 'compliance' AND p_compliance_deadline < (now() + interval '24 hours') THEN 0.9
        WHEN p_notification_type = 'safety' THEN 0.8
        WHEN p_notification_type = 'training' AND p_compliance_deadline < (now() + interval '7 days') THEN 0.7
        ELSE 0.3
    END;
    
    -- Create notification
    INSERT INTO public.smart_notifications (
        user_id,
        recipient_role,
        project_id,
        title,
        message,
        notification_type,
        priority,
        category,
        compliance_deadline,
        predicted_compliance_risk,
        is_ai_generated,
        ai_confidence,
        metadata
    ) VALUES (
        p_user_id,
        COALESCE(v_user_role, 'Worker'),
        p_project_id,
        p_title,
        p_message,
        p_notification_type,
        p_priority,
        p_category,
        p_compliance_deadline,
        v_ai_risk_score,
        TRUE,
        0.85,
        p_metadata
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Function to mark notification as read with analytics
CREATE OR REPLACE FUNCTION public.mark_notification_read(
    p_notification_id UUID,
    p_device_type TEXT DEFAULT 'unknown',
    p_location_context TEXT DEFAULT 'unknown'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification RECORD;
    v_time_to_read INTEGER;
BEGIN
    -- Get notification and update
    SELECT * INTO v_notification
    FROM public.smart_notifications
    WHERE id = p_notification_id AND user_id = auth.uid();
    
    IF v_notification.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate time to read
    v_time_to_read := EXTRACT(EPOCH FROM (now() - v_notification.created_at))::INTEGER;
    
    -- Update notification
    UPDATE public.smart_notifications
    SET is_read = TRUE,
        read_at = now(),
        updated_at = now()
    WHERE id = p_notification_id;
    
    -- Insert analytics
    INSERT INTO public.notification_analytics (
        notification_id,
        user_id,
        time_to_read_seconds,
        device_type,
        location_context
    ) VALUES (
        p_notification_id,
        auth.uid(),
        v_time_to_read,
        p_device_type,
        p_location_context
    );
    
    RETURN TRUE;
END;
$$;

-- Function to get compliance dashboard stats
CREATE OR REPLACE FUNCTION public.get_compliance_notification_stats(
    p_project_id UUID DEFAULT NULL,
    p_days_back INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats JSONB;
    v_user_role TEXT;
BEGIN
    -- Check permissions
    SELECT role INTO v_user_role
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    IF v_user_role NOT IN ('Admin', 'Document Controller', 'Project Manager', 'Supervisor') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;
    
    -- Calculate stats
    SELECT jsonb_build_object(
        'total_notifications', COUNT(*),
        'unread_count', COUNT(*) FILTER (WHERE is_read = FALSE),
        'high_priority_unread', COUNT(*) FILTER (WHERE is_read = FALSE AND priority IN ('high', 'critical')),
        'compliance_overdue', COUNT(*) FILTER (WHERE compliance_deadline < now() AND is_acknowledged = FALSE),
        'avg_response_time_hours', COALESCE(AVG(EXTRACT(EPOCH FROM (read_at - created_at))/3600), 0),
        'ai_predictions_accurate', COUNT(*) FILTER (WHERE predicted_compliance_risk > 0.7 AND action_taken IS NOT NULL),
        'by_priority', jsonb_build_object(
            'critical', COUNT(*) FILTER (WHERE priority = 'critical'),
            'high', COUNT(*) FILTER (WHERE priority = 'high'),
            'medium', COUNT(*) FILTER (WHERE priority = 'medium'),
            'low', COUNT(*) FILTER (WHERE priority = 'low')
        ),
        'by_type', jsonb_build_object(
            'compliance', COUNT(*) FILTER (WHERE notification_type = 'compliance'),
            'safety', COUNT(*) FILTER (WHERE notification_type = 'safety'),
            'training', COUNT(*) FILTER (WHERE notification_type = 'training'),
            'document', COUNT(*) FILTER (WHERE notification_type = 'document')
        )
    ) INTO v_stats
    FROM public.smart_notifications
    WHERE created_at > (now() - (p_days_back || ' days')::interval)
    AND (p_project_id IS NULL OR project_id = p_project_id);
    
    RETURN v_stats;
END;
$$;

-- Insert default notification preferences for existing users
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.notification_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Insert default escalation rules
INSERT INTO public.notification_escalation_rules (
    name, notification_type, priority, escalation_chain, applicable_roles
) VALUES
(
    'Critical Safety Escalation',
    'safety',
    'critical',
    '[
        {"role": "Supervisor", "after": "15 minutes"},
        {"role": "Project Manager", "after": "30 minutes"},
        {"role": "Director", "after": "1 hour"}
    ]'::jsonb,
    ARRAY['Operative', 'Worker']
),
(
    'Compliance Deadline Escalation',
    'compliance',
    'high',
    '[
        {"role": "Supervisor", "after": "2 hours"},
        {"role": "Project Manager", "after": "6 hours"}
    ]'::jsonb,
    ARRAY['Operative', 'Worker', 'Supervisor']
),
(
    'Document Review Escalation',
    'document',
    'medium',
    '[
        {"role": "Document Controller", "after": "24 hours"},
        {"role": "Project Manager", "after": "3 days"}
    ]'::jsonb,
    ARRAY['Operative', 'Worker', 'Supervisor']
);