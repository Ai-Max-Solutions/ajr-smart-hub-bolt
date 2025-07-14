-- Induction QR Scan Demo Pack Database Schema

-- 1. Induction Progress Tracking
CREATE TABLE public.induction_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    project_id UUID,
    induction_type TEXT NOT NULL DEFAULT 'qr_scan_demo',
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    current_step TEXT DEFAULT 'intro',
    total_steps INTEGER DEFAULT 6,
    completed_steps INTEGER DEFAULT 0,
    language_preference TEXT DEFAULT 'en',
    accessibility_needs TEXT[],
    offline_mode BOOLEAN DEFAULT false,
    device_info JSONB,
    completion_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Demo Completions and Interactions
CREATE TABLE public.demo_completions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    induction_id UUID NOT NULL REFERENCES public.induction_progress(id),
    user_id UUID NOT NULL,
    demo_type TEXT NOT NULL CHECK (demo_type IN ('qr_scan', 'superseded_demo', 'ai_test', 'signature_vault')),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    interaction_data JSONB NOT NULL DEFAULT '{}',
    time_taken_seconds INTEGER,
    success_score INTEGER CHECK (success_score >= 0 AND success_score <= 100),
    retries_count INTEGER DEFAULT 0,
    device_type TEXT,
    location_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Learning Analytics
CREATE TABLE public.learning_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    induction_id UUID REFERENCES public.induction_progress(id),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('understanding_gap', 'completion_time', 'retry_pattern', 'language_switch', 'accessibility_used')),
    metric_value NUMERIC,
    metric_data JSONB NOT NULL DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ai_insights TEXT,
    improvement_suggestions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Induction Materials
CREATE TABLE public.induction_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    material_type TEXT NOT NULL CHECK (material_type IN ('slide_deck', 'demo_qr', 'rule_card', 'ai_prompt', 'video', 'audio')),
    content_url TEXT,
    content_data JSONB,
    language TEXT DEFAULT 'en',
    accessibility_features TEXT[] DEFAULT '{}',
    version TEXT NOT NULL DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    download_size_kb INTEGER,
    offline_available BOOLEAN DEFAULT true,
    brand_theme TEXT DEFAULT 'aj_ryan',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Post Demo Quiz
CREATE TABLE public.post_demo_quiz (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    induction_id UUID NOT NULL REFERENCES public.induction_progress(id),
    user_id UUID NOT NULL,
    question_data JSONB NOT NULL,
    user_answers JSONB NOT NULL DEFAULT '{}',
    ai_feedback JSONB,
    score_percentage INTEGER CHECK (score_percentage >= 0 AND score_percentage <= 100),
    understanding_level TEXT CHECK (understanding_level IN ('excellent', 'good', 'needs_improvement', 'requires_retry')),
    time_taken_seconds INTEGER,
    adaptive_questions JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.induction_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.induction_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_demo_quiz ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Induction Progress Policies
CREATE POLICY "Users can view own induction progress" 
ON public.induction_progress FOR SELECT 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Supervisor')
    )
);

CREATE POLICY "Users can update own induction progress" 
ON public.induction_progress FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can insert induction progress" 
ON public.induction_progress FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Demo Completions Policies
CREATE POLICY "Users can view own demo completions" 
ON public.demo_completions FOR SELECT 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Supervisor')
    )
);

CREATE POLICY "Users can insert own demo completions" 
ON public.demo_completions FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Learning Analytics Policies
CREATE POLICY "Users can view own learning analytics" 
ON public.learning_analytics FOR SELECT 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    )
);

CREATE POLICY "System can insert learning analytics" 
ON public.learning_analytics FOR INSERT 
WITH CHECK (true);

-- Induction Materials Policies (Public read, admin write)
CREATE POLICY "Everyone can view active induction materials" 
ON public.induction_materials FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage induction materials" 
ON public.induction_materials FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Document Controller')
    )
);

-- Post Demo Quiz Policies
CREATE POLICY "Users can view own quiz results" 
ON public.post_demo_quiz FOR SELECT 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Supervisor')
    )
);

CREATE POLICY "Users can insert own quiz results" 
ON public.post_demo_quiz FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_induction_progress_user_id ON public.induction_progress(user_id);
CREATE INDEX idx_induction_progress_status ON public.induction_progress(status);
CREATE INDEX idx_induction_progress_project_id ON public.induction_progress(project_id);
CREATE INDEX idx_demo_completions_user_id ON public.demo_completions(user_id);
CREATE INDEX idx_demo_completions_induction_id ON public.demo_completions(induction_id);
CREATE INDEX idx_learning_analytics_user_id ON public.learning_analytics(user_id);
CREATE INDEX idx_learning_analytics_metric_type ON public.learning_analytics(metric_type);
CREATE INDEX idx_induction_materials_type_language ON public.induction_materials(material_type, language);
CREATE INDEX idx_post_demo_quiz_user_id ON public.post_demo_quiz(user_id);

-- Helper Functions

-- Start new induction process
CREATE OR REPLACE FUNCTION public.start_induction(
    p_user_id UUID,
    p_project_id UUID DEFAULT NULL,
    p_language TEXT DEFAULT 'en',
    p_accessibility_needs TEXT[] DEFAULT '{}',
    p_device_info JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_induction_id UUID;
BEGIN
    -- Check if user has pending induction
    SELECT id INTO v_induction_id
    FROM public.induction_progress
    WHERE user_id = p_user_id 
    AND status IN ('not_started', 'in_progress')
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no pending induction, create new one
    IF v_induction_id IS NULL THEN
        INSERT INTO public.induction_progress (
            user_id,
            project_id,
            language_preference,
            accessibility_needs,
            device_info
        ) VALUES (
            p_user_id,
            p_project_id,
            p_language,
            p_accessibility_needs,
            p_device_info
        ) RETURNING id INTO v_induction_id;
        
        -- Log analytics
        INSERT INTO public.learning_analytics (
            user_id,
            induction_id,
            metric_type,
            metric_data
        ) VALUES (
            p_user_id,
            v_induction_id,
            'induction_started',
            jsonb_build_object(
                'language', p_language,
                'accessibility_needs', p_accessibility_needs,
                'device_info', p_device_info
            )
        );
    END IF;
    
    RETURN v_induction_id;
END;
$$;

-- Complete induction step
CREATE OR REPLACE FUNCTION public.complete_induction_step(
    p_induction_id UUID,
    p_step_name TEXT,
    p_interaction_data JSONB DEFAULT '{}',
    p_time_taken_seconds INTEGER DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_steps INTEGER;
    v_total_steps INTEGER;
    v_new_status TEXT;
BEGIN
    -- Get current progress
    SELECT user_id, completed_steps, total_steps
    INTO v_user_id, v_current_steps, v_total_steps
    FROM public.induction_progress
    WHERE id = p_induction_id;
    
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update progress
    UPDATE public.induction_progress
    SET completed_steps = completed_steps + 1,
        current_step = p_step_name,
        updated_at = now(),
        status = CASE 
            WHEN completed_steps + 1 >= total_steps THEN 'completed'
            ELSE 'in_progress'
        END,
        completed_at = CASE 
            WHEN completed_steps + 1 >= total_steps THEN now()
            ELSE completed_at
        END
    WHERE id = p_induction_id;
    
    -- Log completion
    INSERT INTO public.demo_completions (
        induction_id,
        user_id,
        demo_type,
        interaction_data,
        time_taken_seconds
    ) VALUES (
        p_induction_id,
        v_user_id,
        p_step_name,
        p_interaction_data,
        p_time_taken_seconds
    );
    
    RETURN TRUE;
END;
$$;

-- Get induction analytics summary
CREATE OR REPLACE FUNCTION public.get_induction_analytics_summary()
RETURNS TABLE(
    total_inductions BIGINT,
    completed_inductions BIGINT,
    avg_completion_time_minutes NUMERIC,
    completion_rate_percentage NUMERIC,
    top_languages TEXT[],
    common_accessibility_needs TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*) as total_inductions,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_inductions,
        ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60), 2) as avg_completion_time_minutes,
        ROUND(
            COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / 
            NULLIF(COUNT(*), 0), 2
        ) as completion_rate_percentage,
        ARRAY_AGG(DISTINCT language_preference) FILTER (WHERE language_preference IS NOT NULL) as top_languages,
        ARRAY_AGG(DISTINCT unnest(accessibility_needs)) FILTER (WHERE accessibility_needs IS NOT NULL) as common_accessibility_needs
    FROM public.induction_progress;
END;
$$;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_induction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_induction_progress_updated_at
    BEFORE UPDATE ON public.induction_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_induction_updated_at();

CREATE TRIGGER update_induction_materials_updated_at
    BEFORE UPDATE ON public.induction_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_induction_updated_at();

-- Insert default induction materials
INSERT INTO public.induction_materials (title, material_type, content_data, language, version) VALUES
('QR Scan Demo Introduction', 'slide_deck', '{"slides": [{"title": "Why QR Codes Save Lives", "content": "Version control prevents accidents from outdated drawings"}, {"title": "How to Scan", "content": "Point camera at QR code - see instant status"}]}', 'en', '1.0'),
('Test QR Code - Current', 'demo_qr', '{"qr_data": "demo_current_rev_c", "status": "current", "revision": "C", "document_type": "drawing"}', 'en', '1.0'),
('Test QR Code - Superseded', 'demo_qr', '{"qr_data": "demo_superseded_rev_b", "status": "superseded", "revision": "B", "document_type": "drawing", "superseded_by": "C"}', 'en', '1.0'),
('Site Safety Rule Card', 'rule_card', '{"title": "ALWAYS SCAN BEFORE USE", "rules": ["Scan QR code on every document", "Check status: Current vs Superseded", "Sign new versions when required", "Never use documents without QR codes"]}', 'en', '1.0'),
('AI Assistant Test Prompt', 'ai_prompt', '{"prompt": "Have I signed the latest RAMS for this project?", "expected_response": "Signature Vault integration demo"}', 'en', '1.0');