-- Phase 10: Advanced Workflow Automation Tables

-- Smart Prompt Templates for AI-powered workflows
CREATE TABLE public.smart_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    role_scopes TEXT[] DEFAULT '{}',
    priority INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    avg_rating NUMERIC DEFAULT 0,
    requires_context BOOLEAN DEFAULT false,
    context_fields JSONB DEFAULT '{}',
    output_format TEXT DEFAULT 'text',
    estimated_tokens INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Smart Prompt Usage Tracking
CREATE TABLE public.smart_prompt_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.smart_prompt_templates(id),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    input_text TEXT NOT NULL,
    output_text TEXT,
    context_used JSONB DEFAULT '{}',
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    mobile_device BOOLEAN DEFAULT false,
    voice_input BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Offline Prompt Cache for mobile
CREATE TABLE public.offline_prompt_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    template_id UUID REFERENCES public.smart_prompt_templates(id),
    cached_input TEXT NOT NULL,
    cached_output TEXT NOT NULL,
    device_fingerprint TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Work Package Templates
CREATE TABLE public.work_package_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    estimated_duration_hours NUMERIC,
    required_skills TEXT[],
    prerequisites TEXT[],
    deliverables JSONB DEFAULT '[]',
    quality_checkpoints JSONB DEFAULT '[]',
    safety_requirements JSONB DEFAULT '[]',
    tools_required TEXT[],
    materials_required JSONB DEFAULT '[]',
    complexity_level TEXT DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Smart Assignments
CREATE TABLE public.smart_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    work_type TEXT NOT NULL,
    assigned_to UUID REFERENCES public."Users"(whalesync_postgres_id),
    assigned_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    priority TEXT DEFAULT 'medium',
    estimated_completion TIMESTAMP WITH TIME ZONE,
    actual_completion TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'assigned',
    confidence_score NUMERIC DEFAULT 0,
    reasoning TEXT,
    required_skills TEXT[],
    plot_location TEXT,
    ai_suggested BOOLEAN DEFAULT false,
    assignment_metadata JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Automated Compliance Rules
CREATE TABLE public.compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL, -- 'qualification_check', 'document_approval', 'safety_check'
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    severity TEXT DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    applies_to_roles TEXT[],
    applies_to_projects UUID[],
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workflow Automation Logs
CREATE TABLE public.workflow_automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_type TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    input_data JSONB,
    output_data JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Smart Notifications
CREATE TABLE public.smart_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'general',
    metadata JSONB DEFAULT '{}',
    action_required BOOLEAN DEFAULT false,
    action_url TEXT,
    action_label TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    sent_via TEXT[] DEFAULT '{"app"}',
    delivery_status JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.smart_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_prompt_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_prompt_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_package_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Smart Prompt Templates
CREATE POLICY "Everyone can view active templates" ON public.smart_prompt_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.smart_prompt_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Document Controller', 'Project Manager')
        )
    );

-- RLS Policies for Smart Prompt Usage
CREATE POLICY "Users can view own prompt usage" ON public.smart_prompt_usage
    FOR SELECT USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own prompt usage" ON public.smart_prompt_usage
    FOR INSERT WITH CHECK (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all prompt usage" ON public.smart_prompt_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Document Controller')
        )
    );

-- RLS Policies for Work Package Templates
CREATE POLICY "Everyone can view active work templates" ON public.work_package_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Managers can manage work templates" ON public.work_package_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Project Manager', 'Document Controller')
        )
    );

-- RLS Policies for Smart Assignments
CREATE POLICY "Users can view relevant assignments" ON public.smart_assignments
    FOR SELECT USING (
        assigned_to = (
            SELECT whalesync_postgres_id FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
        ) OR
        project_id IN (
            SELECT currentproject FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Project Manager', 'Document Controller')
        )
    );

CREATE POLICY "Managers can manage assignments" ON public.smart_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Project Manager', 'Document Controller')
        )
    );

-- RLS Policies for Smart Notifications
CREATE POLICY "Users can view own notifications" ON public.smart_notifications
    FOR SELECT USING (
        recipient_id = (
            SELECT whalesync_postgres_id FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own notifications" ON public.smart_notifications
    FOR UPDATE USING (
        recipient_id = (
            SELECT whalesync_postgres_id FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX idx_smart_prompt_templates_category ON public.smart_prompt_templates(category);
CREATE INDEX idx_smart_prompt_templates_role_scopes ON public.smart_prompt_templates USING GIN(role_scopes);
CREATE INDEX idx_smart_prompt_usage_template_user ON public.smart_prompt_usage(template_id, user_id);
CREATE INDEX idx_smart_assignments_assigned_to ON public.smart_assignments(assigned_to);
CREATE INDEX idx_smart_assignments_project_id ON public.smart_assignments(project_id);
CREATE INDEX idx_smart_assignments_status ON public.smart_assignments(status);
CREATE INDEX idx_smart_notifications_recipient_read ON public.smart_notifications(recipient_id, is_read);
CREATE INDEX idx_smart_notifications_expires_at ON public.smart_notifications(expires_at);
CREATE INDEX idx_workflow_automation_logs_created_at ON public.workflow_automation_logs(created_at);

-- Add triggers for updated_at columns
CREATE TRIGGER update_smart_prompt_templates_updated_at
    BEFORE UPDATE ON public.smart_prompt_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_package_templates_updated_at
    BEFORE UPDATE ON public.work_package_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smart_assignments_updated_at
    BEFORE UPDATE ON public.smart_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_rules_updated_at
    BEFORE UPDATE ON public.compliance_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default smart prompt templates
INSERT INTO public.smart_prompt_templates (title, description, system_prompt, category, role_scopes, priority, requires_context, context_fields) VALUES
('Daily Progress Report', 'Generate a comprehensive daily progress report', 
 'You are a construction project assistant. Generate a professional daily progress report based on the provided work data. Include completed tasks, current status, challenges, and next steps.',
 'reporting', '{"Project Manager", "Supervisor", "Foreman"}', 9, true, 
 '{"work_completed": "array", "hours_worked": "number", "issues": "array", "weather": "string"}'),

('Safety Risk Assessment', 'Assess safety risks for specific work activities',
 'You are a health and safety expert. Analyze the provided work activity and identify potential safety risks, required PPE, and safety procedures.',
 'safety', '{"Supervisor", "Foreman", "Operative"}', 10, true,
 '{"work_type": "string", "location": "string", "equipment": "array", "weather_conditions": "string"}'),

('Material Requirements Calculator', 'Calculate material requirements for tasks',
 'You are a construction materials specialist. Calculate the materials needed for the specified work, including quantities, specifications, and delivery requirements.',
 'materials', '{"Project Manager", "Supervisor"}', 8, true,
 '{"task_description": "string", "area_dimensions": "object", "specifications": "string"}'),

('Quality Checklist Generator', 'Generate quality control checklists',
 'You are a quality control expert. Create a detailed quality checklist for the specified construction activity.',
 'quality', '{"Supervisor", "Foreman"}', 7, true,
 '{"work_type": "string", "standards": "string", "acceptance_criteria": "string"}'),

('Work Sequence Optimizer', 'Optimize work sequences and dependencies',
 'You are a construction planning expert. Analyze the provided tasks and suggest an optimal work sequence considering dependencies, resources, and efficiency.',
 'planning', '{"Project Manager", "Supervisor"}', 9, true,
 '{"tasks": "array", "resources": "object", "constraints": "array", "timeline": "string"}');

-- Insert default work package templates
INSERT INTO public.work_package_templates (name, description, category, estimated_duration_hours, required_skills, prerequisites, deliverables, quality_checkpoints) VALUES
('Electrical First Fix', 'Complete electrical first fix installation', 'electrical', 16,
 '{"electrical", "health_safety"}', '{"structural_complete"}',
 '[{"item": "Cable installation", "specification": "BS 7671 compliant"}, {"item": "Socket outlet positioning", "specification": "Height and spacing per drawings"}]',
 '[{"checkpoint": "Cable route inspection", "criteria": "Routes clear and protected"}, {"checkpoint": "Earthing verification", "criteria": "Continuity tested and recorded"}]'),

('Plumbing Second Fix', 'Complete plumbing second fix installation', 'plumbing', 12,
 '{"plumbing", "health_safety"}', '{"first_fix_complete", "walls_finished"}',
 '[{"item": "Sanitaryware installation", "specification": "Manufacturer guidelines"}, {"item": "Final connections", "specification": "Pressure tested"}]',
 '[{"checkpoint": "Leak test", "criteria": "No leaks under pressure"}, {"checkpoint": "Flow rate test", "criteria": "Adequate flow rates achieved"}]'),

('Flooring Installation', 'Install final floor coverings', 'finishing', 8,
 '{"flooring", "measurement"}', '{"plastering_complete", "electrical_second_fix"}',
 '[{"item": "Floor preparation", "specification": "Level and clean"}, {"item": "Flooring installation", "specification": "Manufacturer guidelines"}]',
 '[{"checkpoint": "Subfloor inspection", "criteria": "Level within tolerance"}, {"checkpoint": "Installation quality", "criteria": "No gaps or defects"}]');

-- Insert default compliance rules
INSERT INTO public.compliance_rules (name, description, rule_type, conditions, actions, severity, applies_to_roles) VALUES
('CSCS Card Expiry Check', 'Check for expiring CSCS cards', 'qualification_check',
 '{"qualification_type": "CSCS", "expiry_within_days": 30}',
 '{"notify_user": true, "notify_manager": true, "restrict_site_access": false}',
 'medium', '{"Operative", "Supervisor"}'),

('Gas Safe Certificate Validation', 'Validate Gas Safe certificates for gas work', 'qualification_check',
 '{"work_type": "gas", "qualification_required": "Gas Safe"}',
 '{"verify_qualification": true, "block_assignment": true, "notify_manager": true}',
 'high', '{"Operative"}'),

('High Risk Work Approval', 'Require approval for high-risk work assignments', 'document_approval',
 '{"risk_level": "high", "work_types": ["electrical_live", "confined_space", "work_at_height"]}',
 '{"require_supervisor_approval": true, "generate_permit": true, "notify_safety_officer": true}',
 'high', '{"Operative", "Supervisor"}');