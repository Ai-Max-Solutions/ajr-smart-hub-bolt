-- Legendary Smart Notifications System Database Migration (Simplified)
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

-- Enhanced indexes for performance (simplified without problematic predicates)
CREATE INDEX idx_smart_notifications_user_unread ON public.smart_notifications(user_id, is_read);
CREATE INDEX idx_smart_notifications_priority_created ON public.smart_notifications(priority, created_at);
CREATE INDEX idx_smart_notifications_compliance_deadline ON public.smart_notifications(compliance_deadline);
CREATE INDEX idx_smart_notifications_project_type ON public.smart_notifications(project_id, notification_type);
CREATE INDEX idx_smart_notifications_ai_risk ON public.smart_notifications(predicted_compliance_risk);
CREATE INDEX idx_smart_notifications_created_at ON public.smart_notifications(created_at);

CREATE INDEX idx_notification_analytics_performance ON public.notification_analytics(delivery_time_ms, time_to_read_seconds);
CREATE INDEX idx_ai_predictions_active ON public.ai_compliance_predictions(prediction_type, confidence_score);
CREATE INDEX idx_voice_logs_recent ON public.voice_interaction_logs(user_id, created_at);

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