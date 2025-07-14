-- Create induction progress tracking table
CREATE TABLE public.induction_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    project_id UUID,
    induction_type TEXT NOT NULL DEFAULT 'qr_scan_demo',
    status TEXT NOT NULL DEFAULT 'started',
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 6,
    language_preference TEXT DEFAULT 'en',
    completion_percentage NUMERIC DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    supervisor_id UUID,
    location TEXT,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create demo completions table
CREATE TABLE public.demo_completions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    induction_id UUID NOT NULL REFERENCES public.induction_progress(id) ON DELETE CASCADE,
    demo_type TEXT NOT NULL, -- 'live_scan', 'stale_scan', 'ai_query'
    qr_code_scanned TEXT,
    scan_result JSONB,
    understanding_confirmed BOOLEAN DEFAULT false,
    time_taken_seconds INTEGER,
    assistance_needed BOOLEAN DEFAULT false,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create learning analytics table
CREATE TABLE public.learning_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    induction_id UUID NOT NULL REFERENCES public.induction_progress(id),
    quiz_score NUMERIC,
    difficulty_areas TEXT[],
    learning_style TEXT, -- 'visual', 'audio', 'kinesthetic'
    language_used TEXT,
    completion_time_minutes INTEGER,
    retry_count INTEGER DEFAULT 0,
    ai_feedback JSONB,
    recommendations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create induction materials table
CREATE TABLE public.induction_materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    material_type TEXT NOT NULL, -- 'slide', 'qr_example', 'rule_card', 'video'
    title TEXT NOT NULL,
    content_url TEXT,
    language TEXT DEFAULT 'en',
    project_id UUID,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create post demo quiz table
CREATE TABLE public.post_demo_quiz (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    induction_id UUID NOT NULL REFERENCES public.induction_progress(id),
    question_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    user_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN,
    ai_explanation TEXT,
    difficulty_level TEXT DEFAULT 'medium',
    time_taken_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.induction_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.induction_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_demo_quiz ENABLE ROW LEVEL SECURITY;

-- RLS Policies for induction_progress
CREATE POLICY "Users can view own induction progress" 
ON public.induction_progress FOR SELECT 
USING (
    user_id = auth.uid() OR 
    supervisor_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    )
);

CREATE POLICY "Users can update own induction progress" 
ON public.induction_progress FOR UPDATE 
USING (user_id = auth.uid() OR supervisor_id = auth.uid());

CREATE POLICY "Supervisors can create induction progress" 
ON public.induction_progress FOR INSERT 
WITH CHECK (
    auth.uid() = supervisor_id OR
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller', 'Supervisor')
    )
);

-- RLS Policies for demo_completions
CREATE POLICY "Users can view own demo completions" 
ON public.demo_completions FOR SELECT 
USING (
    induction_id IN (
        SELECT id FROM public.induction_progress 
        WHERE user_id = auth.uid() OR supervisor_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own demo completions" 
ON public.demo_completions FOR INSERT 
WITH CHECK (
    induction_id IN (
        SELECT id FROM public.induction_progress 
        WHERE user_id = auth.uid()
    )
);

-- RLS Policies for learning_analytics
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

-- RLS Policies for induction_materials
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

-- RLS Policies for post_demo_quiz
CREATE POLICY "Users can view own quiz responses" 
ON public.post_demo_quiz FOR SELECT 
USING (
    induction_id IN (
        SELECT id FROM public.induction_progress 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own quiz responses" 
ON public.post_demo_quiz FOR INSERT 
WITH CHECK (
    induction_id IN (
        SELECT id FROM public.induction_progress 
        WHERE user_id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX idx_induction_progress_user_id ON public.induction_progress(user_id);
CREATE INDEX idx_induction_progress_project_id ON public.induction_progress(project_id);
CREATE INDEX idx_induction_progress_status ON public.induction_progress(status);
CREATE INDEX idx_demo_completions_induction_id ON public.demo_completions(induction_id);
CREATE INDEX idx_learning_analytics_user_id ON public.learning_analytics(user_id);
CREATE INDEX idx_induction_materials_type ON public.induction_materials(material_type);
CREATE INDEX idx_post_demo_quiz_induction_id ON public.post_demo_quiz(induction_id);

-- Add triggers for updated_at
CREATE TRIGGER update_induction_progress_updated_at
    BEFORE UPDATE ON public.induction_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_induction_materials_updated_at
    BEFORE UPDATE ON public.induction_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to start a new induction
CREATE OR REPLACE FUNCTION public.start_induction(
    p_user_id UUID,
    p_project_id UUID DEFAULT NULL,
    p_supervisor_id UUID DEFAULT NULL,
    p_language TEXT DEFAULT 'en',
    p_device_info JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_induction_id UUID;
BEGIN
    -- Check if user already has an active induction
    SELECT id INTO v_induction_id
    FROM public.induction_progress
    WHERE user_id = p_user_id
    AND status IN ('started', 'in_progress')
    AND created_at > NOW() - INTERVAL '24 hours';
    
    IF v_induction_id IS NOT NULL THEN
        RETURN v_induction_id;
    END IF;
    
    -- Create new induction
    INSERT INTO public.induction_progress (
        user_id,
        project_id,
        supervisor_id,
        language_preference,
        device_info
    ) VALUES (
        p_user_id,
        p_project_id,
        COALESCE(p_supervisor_id, auth.uid()),
        p_language,
        p_device_info
    ) RETURNING id INTO v_induction_id;
    
    -- Log the induction start in evidence chain
    PERFORM public.log_evidence_chain_event(
        p_project_id,
        p_user_id,
        'induction',
        'start',
        jsonb_build_object(
            'induction_id', v_induction_id,
            'induction_type', 'qr_scan_demo',
            'language', p_language,
            'supervisor_id', p_supervisor_id
        )
    );
    
    RETURN v_induction_id;
END;
$function$;

-- Function to complete induction step
CREATE OR REPLACE FUNCTION public.complete_induction_step(
    p_induction_id UUID,
    p_step_number INTEGER,
    p_step_data JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_total_steps INTEGER;
    v_current_step INTEGER;
    v_user_id UUID;
    v_project_id UUID;
BEGIN
    -- Get induction details
    SELECT total_steps, current_step, user_id, project_id
    INTO v_total_steps, v_current_step, v_user_id, v_project_id
    FROM public.induction_progress
    WHERE id = p_induction_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Induction not found';
    END IF;
    
    -- Update progress
    UPDATE public.induction_progress
    SET current_step = GREATEST(current_step, p_step_number),
        completion_percentage = (GREATEST(current_step, p_step_number)::NUMERIC / total_steps::NUMERIC) * 100,
        status = CASE 
            WHEN GREATEST(current_step, p_step_number) >= total_steps THEN 'completed'
            ELSE 'in_progress'
        END,
        completed_at = CASE 
            WHEN GREATEST(current_step, p_step_number) >= total_steps THEN NOW()
            ELSE completed_at
        END,
        updated_at = NOW()
    WHERE id = p_induction_id;
    
    -- Log step completion
    PERFORM public.log_evidence_chain_event(
        v_project_id,
        v_user_id,
        'induction',
        'step_complete',
        jsonb_build_object(
            'induction_id', p_induction_id,
            'step_number', p_step_number,
            'step_data', p_step_data,
            'completion_percentage', (GREATEST(v_current_step, p_step_number)::NUMERIC / v_total_steps::NUMERIC) * 100
        )
    );
    
    RETURN true;
END;
$function$;