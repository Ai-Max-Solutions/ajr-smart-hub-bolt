-- Smart Prompt Library Database Schema
-- Creating comprehensive tables for the smart prompt system

-- Smart Prompt Templates table
CREATE TABLE public.smart_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    example_input TEXT,
    role_scopes TEXT[] NOT NULL, -- Array of roles that can use this prompt
    category TEXT NOT NULL DEFAULT 'general', -- compliance, project, safety, etc.
    priority INTEGER DEFAULT 5, -- 1-10, higher = more prominent
    is_active BOOLEAN DEFAULT true,
    requires_context BOOLEAN DEFAULT false, -- Whether prompt needs additional context
    context_fields JSONB DEFAULT '[]'::jsonb, -- Fields to collect for context
    variables JSONB DEFAULT '{}'::jsonb, -- Dynamic variables that can be injected
    output_format TEXT DEFAULT 'text', -- text, json, report, chart
    estimated_tokens INTEGER DEFAULT 500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    usage_count INTEGER DEFAULT 0,
    success_rate NUMERIC DEFAULT 100.0, -- Percentage based on user feedback
    avg_rating NUMERIC DEFAULT 5.0 -- 1-5 star rating
);

-- Smart Prompt Usage Analytics
CREATE TABLE public.smart_prompt_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.smart_prompt_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    input_text TEXT,
    output_text TEXT,
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    was_refined BOOLEAN DEFAULT false, -- Whether user used the refine feature
    refinement_count INTEGER DEFAULT 0,
    context_used JSONB DEFAULT '{}'::jsonb,
    mobile_device BOOLEAN DEFAULT false,
    offline_mode BOOLEAN DEFAULT false,
    voice_input BOOLEAN DEFAULT false
);

-- Smart Prompt Refinements (for AI self-improvement)
CREATE TABLE public.smart_prompt_refinements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.smart_prompt_templates(id) ON DELETE CASCADE,
    original_prompt TEXT NOT NULL,
    refined_prompt TEXT NOT NULL,
    improvement_reason TEXT,
    performance_gain NUMERIC, -- Percentage improvement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    is_active BOOLEAN DEFAULT false
);

-- Offline Prompt Cache
CREATE TABLE public.offline_prompt_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    template_id UUID REFERENCES public.smart_prompt_templates(id),
    cached_input TEXT NOT NULL,
    cached_output TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    synced_at TIMESTAMP WITH TIME ZONE,
    is_synced BOOLEAN DEFAULT false,
    device_fingerprint TEXT
);

-- Voice Commands mapping
CREATE TABLE public.voice_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_phrase TEXT NOT NULL UNIQUE,
    template_id UUID REFERENCES public.smart_prompt_templates(id),
    role_scopes TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    confidence_threshold NUMERIC DEFAULT 0.8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.smart_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_prompt_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_prompt_refinements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_prompt_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_commands ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Smart Prompt Templates
CREATE POLICY "Users can view templates for their role"
    ON public.smart_prompt_templates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND u.role = ANY(role_scopes)
        )
        OR is_active = true
    );

CREATE POLICY "Admins can manage all templates"
    ON public.smart_prompt_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND u.role IN ('Admin', 'Document Controller')
        )
    );

-- RLS Policies for Usage Analytics
CREATE POLICY "Users can view own usage"
    ON public.smart_prompt_usage
    FOR SELECT
    USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own usage"
    ON public.smart_prompt_usage
    FOR INSERT
    WITH CHECK (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all usage"
    ON public.smart_prompt_usage
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND u.role IN ('Admin', 'Document Controller', 'Director')
        )
    );

-- RLS Policies for Offline Cache
CREATE POLICY "Users can manage own cache"
    ON public.offline_prompt_cache
    FOR ALL
    USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    );

-- RLS Policies for Voice Commands
CREATE POLICY "Users can view voice commands for their role"
    ON public.voice_commands
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND u.role = ANY(role_scopes)
        )
    );

-- Functions for Smart Prompt System

-- Function to get role-specific prompts
CREATE OR REPLACE FUNCTION public.get_role_smart_prompts(p_role TEXT)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    priority INTEGER,
    usage_count INTEGER,
    avg_rating NUMERIC,
    requires_context BOOLEAN,
    context_fields JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        spt.id,
        spt.title,
        spt.description,
        spt.category,
        spt.priority,
        spt.usage_count,
        spt.avg_rating,
        spt.requires_context,
        spt.context_fields
    FROM public.smart_prompt_templates spt
    WHERE spt.is_active = true
    AND p_role = ANY(spt.role_scopes)
    ORDER BY spt.priority DESC, spt.usage_count DESC;
END;
$$;

-- Function to execute a smart prompt
CREATE OR REPLACE FUNCTION public.execute_smart_prompt(
    p_template_id UUID,
    p_input_text TEXT,
    p_context JSONB DEFAULT '{}'::jsonb,
    p_mobile_device BOOLEAN DEFAULT false,
    p_voice_input BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_template RECORD;
    v_usage_id UUID;
    v_result JSONB;
BEGIN
    -- Get current user
    SELECT whalesync_postgres_id INTO v_user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Get template details
    SELECT * INTO v_template
    FROM public.smart_prompt_templates
    WHERE id = p_template_id AND is_active = true;
    
    IF v_template IS NULL THEN
        RAISE EXCEPTION 'Template not found or inactive';
    END IF;
    
    -- Check if user has access to this template
    IF NOT EXISTS (
        SELECT 1 FROM public."Users" u
        WHERE u.whalesync_postgres_id = v_user_id
        AND u.role = ANY(v_template.role_scopes)
    ) THEN
        RAISE EXCEPTION 'Access denied for this prompt template';
    END IF;
    
    -- Log usage (will be processed by edge function)
    INSERT INTO public.smart_prompt_usage (
        template_id,
        user_id,
        input_text,
        context_used,
        mobile_device,
        voice_input
    ) VALUES (
        p_template_id,
        v_user_id,
        p_input_text,
        p_context,
        p_mobile_device,
        p_voice_input
    ) RETURNING id INTO v_usage_id;
    
    -- Update template usage count
    UPDATE public.smart_prompt_templates
    SET usage_count = usage_count + 1
    WHERE id = p_template_id;
    
    -- Return template info for edge function processing
    SELECT jsonb_build_object(
        'template_id', v_template.id,
        'system_prompt', v_template.system_prompt,
        'input_text', p_input_text,
        'context', p_context,
        'usage_id', v_usage_id,
        'output_format', v_template.output_format,
        'estimated_tokens', v_template.estimated_tokens
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function to cache prompt for offline use
CREATE OR REPLACE FUNCTION public.cache_prompt_offline(
    p_template_id UUID,
    p_input TEXT,
    p_output TEXT,
    p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT whalesync_postgres_id INTO v_user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    INSERT INTO public.offline_prompt_cache (
        user_id,
        template_id,
        cached_input,
        cached_output,
        device_fingerprint
    ) VALUES (
        v_user_id,
        p_template_id,
        p_input,
        p_output,
        p_device_fingerprint
    );
    
    RETURN true;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_smart_prompt_templates_role_scopes ON public.smart_prompt_templates USING GIN(role_scopes);
CREATE INDEX idx_smart_prompt_templates_active_priority ON public.smart_prompt_templates(is_active, priority DESC) WHERE is_active = true;
CREATE INDEX idx_smart_prompt_usage_user_template ON public.smart_prompt_usage(user_id, template_id);
CREATE INDEX idx_smart_prompt_usage_executed_at ON public.smart_prompt_usage(executed_at DESC);
CREATE INDEX idx_offline_prompt_cache_user_synced ON public.offline_prompt_cache(user_id, is_synced);

-- Insert default smart prompt templates for each role
INSERT INTO public.smart_prompt_templates (title, description, system_prompt, example_input, role_scopes, category, priority, context_fields) VALUES
-- Operative Prompts
('My Timesheet Summary', 'Get a summary of your recent timesheet entries and hours', 'You are a helpful assistant that analyzes timesheet data. Provide a clear, concise summary of the user''s work hours, including total hours, projects worked on, and any patterns or insights. Be encouraging and professional.', 'Show me my hours for this week', ARRAY['Operative'], 'timesheet', 10, '["week_start", "week_end"]'::jsonb),
('Training Status Check', 'Check your compliance and training status', 'You are a compliance assistant. Review the user''s training records and qualifications. Highlight what''s current, what''s expiring soon, and what actions are needed. Be clear about deadlines and requirements.', 'What training do I need to complete?', ARRAY['Operative'], 'compliance', 9, '["user_qualifications", "mandatory_training"]'::jsonb),
('POD Photo Upload', 'Upload and log proof of delivery photos with AI analysis', 'You are a POD (Proof of Delivery) assistant. Help users document deliveries with photo analysis. Describe what you see in the photo and suggest any additional information needed for compliance.', 'I need to log this delivery', ARRAY['Operative'], 'delivery', 8, '["delivery_location", "supplier_name", "items_expected"]'::jsonb),
('Safety Incident Report', 'Quick safety incident documentation and next steps', 'You are a safety compliance assistant. Help users report incidents clearly and completely. Ask relevant questions to gather all necessary information and provide guidance on immediate actions required.', 'I need to report a safety issue', ARRAY['Operative'], 'safety', 9, '["incident_type", "location", "time_occurred"]'::jsonb),
('Work Progress Update', 'Log your daily work progress and challenges', 'You are a work progress assistant. Help users document their daily achievements, challenges, and next steps. Encourage detailed but efficient reporting.', 'I completed the first fix on plot 23', ARRAY['Operative'], 'progress', 7, '["plot_number", "work_type", "completion_percentage"]'::jsonb),

-- Supervisor Prompts  
('Team Training Gap Analysis', 'Analyze your team''s training gaps and create action plans', 'You are a training manager assistant. Analyze team training data to identify gaps, prioritize training needs, and suggest action plans. Focus on compliance deadlines and safety requirements.', 'What training gaps does my team have?', ARRAY['Supervisor'], 'team', 10, '["team_members", "project_requirements"]'::jsonb),
('Daily Team Briefing', 'Generate daily safety and work briefings for your team', 'You are a team briefing assistant. Create comprehensive but concise daily briefings covering safety points, work priorities, weather considerations, and key reminders for the team.', 'Create today''s team briefing', ARRAY['Supervisor'], 'safety', 9, '["weather", "work_priorities", "safety_focus"]'::jsonb),
('Plot Assignment Optimizer', 'Optimize work assignments based on skills and progress', 'You are a work allocation assistant. Help optimize plot assignments based on worker skills, current progress, project deadlines, and efficiency considerations. Provide clear rationale for suggestions.', 'How should I assign plots this week?', ARRAY['Supervisor'], 'planning', 8, '["team_skills", "plot_status", "deadlines"]'::jsonb),
('Quality Control Checklist', 'Generate quality inspection checklists for current work', 'You are a quality control assistant. Create thorough but practical quality checklists based on the type of work being performed. Include both mandatory checks and best practice items.', 'Create QC checklist for second fix work', ARRAY['Supervisor'], 'quality', 8, '["work_stage", "plot_type", "trade_type"]'::jsonb),
('Team Performance Review', 'Analyze team performance metrics and trends', 'You are a performance analysis assistant. Review team metrics including productivity, quality, safety, and attendance. Identify trends, highlight achievements, and suggest improvement areas.', 'How is my team performing this month?', ARRAY['Supervisor'], 'performance', 7, '["time_period", "metrics_focus"]'::jsonb),

-- Project Manager Prompts
('Project Budget Forecast', 'Generate project budget analysis and forecasts', 'You are a project financial assistant. Analyze current spending against budget, identify trends, and provide accurate forecasts. Flag potential overruns early and suggest corrective actions.', 'What''s my budget outlook for Q2?', ARRAY['Project Manager'], 'finance', 10, '["project_id", "time_period", "cost_categories"]'::jsonb),
('Resource Planning Matrix', 'Optimize resource allocation across projects', 'You are a resource planning assistant. Help optimize allocation of workers, equipment, and materials across multiple projects. Consider skills, availability, project priorities, and deadlines.', 'How should I allocate resources next month?', ARRAY['Project Manager'], 'planning', 9, '["projects", "available_resources", "priorities"]'::jsonb),
('Project Risk Assessment', 'Identify and assess project risks with mitigation plans', 'You are a project risk assistant. Analyze current project status to identify potential risks including delays, cost overruns, safety issues, and resource constraints. Provide practical mitigation strategies.', 'What are the main risks for Project Alpha?', ARRAY['Project Manager'], 'risk', 9, '["project_id", "project_stage", "key_concerns"]'::jsonb),
('Milestone Progress Report', 'Generate comprehensive project milestone reports', 'You are a project reporting assistant. Create detailed milestone progress reports including achievements, delays, resource usage, budget status, and upcoming critical path items.', 'Create progress report for board meeting', ARRAY['Project Manager'], 'reporting', 8, '["report_type", "audience", "time_period"]'::jsonb),
('Stakeholder Communication', 'Draft stakeholder updates and communication', 'You are a stakeholder communication assistant. Help draft clear, professional updates for clients, management, and other stakeholders. Tailor the tone and technical detail to the audience.', 'Draft update for client about delays', ARRAY['Project Manager'], 'communication', 7, '["stakeholder_type", "message_type", "key_points"]'::jsonb),

-- Admin Prompts
('User Role Audit Scan', 'Scan for user role anomalies and security issues', 'You are a security audit assistant. Review user roles, permissions, and access patterns to identify potential security issues, role conflicts, or compliance violations. Provide clear recommendations.', 'Check for role anomalies this month', ARRAY['Admin'], 'security', 10, '["audit_scope", "time_period"]'::jsonb),
('System Performance Report', 'Generate system health and performance reports', 'You are a system monitoring assistant. Analyze system performance metrics, user activity, and potential issues. Provide insights on system health and recommendations for optimization.', 'How is system performance this week?', ARRAY['Admin'], 'system', 9, '["metrics_type", "time_period"]'::jsonb),
('Compliance Dashboard', 'Create comprehensive compliance status overview', 'You are a compliance monitoring assistant. Generate overview of organizational compliance status including training, certifications, document approvals, and regulatory requirements.', 'Show current compliance status', ARRAY['Admin'], 'compliance', 9, '["compliance_areas", "risk_level"]'::jsonb),
('User Onboarding Plan', 'Create personalized onboarding plans for new users', 'You are an onboarding assistant. Create comprehensive onboarding plans based on user role, experience level, and project assignments. Include training requirements, introduction schedules, and success metrics.', 'Create onboarding plan for new operative', ARRAY['Admin'], 'onboarding', 8, '["user_role", "experience_level", "assigned_project"]'::jsonb),
('Data Retention Review', 'Review and recommend data retention actions', 'You are a data management assistant. Review data retention policies, identify data that can be archived or deleted, and ensure compliance with retention requirements. Prioritize by storage impact and compliance risk.', 'What data can we archive this quarter?', ARRAY['Admin'], 'data', 7, '["data_types", "retention_policy", "compliance_requirements"]'::jsonb),

-- Director Prompts
('Organizational Risk Heatmap', 'Generate comprehensive organizational risk visualization', 'You are an executive risk assistant. Create high-level risk assessments covering financial, operational, safety, and compliance risks across the organization. Provide strategic recommendations and priority actions.', 'Show me our current risk landscape', ARRAY['Director'], 'risk', 10, '["risk_categories", "time_horizon", "risk_tolerance"]'::jsonb),
('Strategic Performance Dashboard', 'Executive overview of organizational performance', 'You are an executive performance assistant. Provide high-level performance insights including financial KPIs, operational efficiency, safety metrics, and strategic goal progress. Focus on trends and actionable insights.', 'Give me the executive summary for this quarter', ARRAY['Director'], 'performance', 10, '["kpi_categories", "time_period", "benchmark_comparisons"]'::jsonb),
('Market Analysis Brief', 'Industry trends and competitive analysis', 'You are a strategic analysis assistant. Provide insights on industry trends, competitive landscape, market opportunities, and potential threats. Focus on actionable strategic implications.', 'What are the key market trends affecting us?', ARRAY['Director'], 'strategy', 9, '["market_sectors", "competitive_focus", "time_horizon"]'::jsonb),
('Investment Opportunity Analysis', 'Evaluate potential investments and initiatives', 'You are an investment analysis assistant. Evaluate potential investments in technology, equipment, or strategic initiatives. Consider ROI, risk factors, implementation requirements, and strategic alignment.', 'Should we invest in new project management software?', ARRAY['Director'], 'investment', 8, '["investment_type", "budget_range", "strategic_goals"]'::jsonb),
('Organizational Health Check', 'Comprehensive organizational health assessment', 'You are an organizational health assistant. Assess overall organizational health including employee satisfaction, operational efficiency, financial health, and strategic alignment. Identify areas for improvement and growth opportunities.', 'How healthy is our organization currently?', ARRAY['Director'], 'organization', 8, '["assessment_areas", "benchmark_period", "focus_metrics"]'::jsonb);

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_smart_prompt_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_smart_prompt_template_updated_at
    BEFORE UPDATE ON public.smart_prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_smart_prompt_template_updated_at();