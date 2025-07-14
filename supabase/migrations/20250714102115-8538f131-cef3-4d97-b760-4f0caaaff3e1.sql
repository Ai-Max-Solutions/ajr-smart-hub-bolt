-- Legendary Personalized AI Assistant Database Schema

-- User AI Preferences and Personalization
CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    preferred_tone TEXT DEFAULT 'professional',
    trade_terminology_level TEXT DEFAULT 'standard', -- 'basic', 'standard', 'advanced'
    voice_enabled BOOLEAN DEFAULT true,
    proactive_suggestions BOOLEAN DEFAULT true,
    morning_summary BOOLEAN DEFAULT true,
    greeting_style TEXT DEFAULT 'friendly', -- 'formal', 'friendly', 'casual'
    language_preference TEXT DEFAULT 'en',
    response_length TEXT DEFAULT 'balanced', -- 'brief', 'balanced', 'detailed'
    notification_frequency TEXT DEFAULT 'normal', -- 'minimal', 'normal', 'frequent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Conversation Memory and Context
CREATE TABLE IF NOT EXISTS public.ai_conversation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL, -- 'preference', 'context', 'pattern', 'feedback'
    memory_key TEXT NOT NULL,
    memory_value JSONB NOT NULL,
    importance_score NUMERIC DEFAULT 1.0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Pattern Recognition and Proactive Insights
CREATE TABLE IF NOT EXISTS public.user_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL, -- 'morning_routine', 'compliance_check', 'project_inquiry', 'voice_usage'
    pattern_data JSONB NOT NULL,
    frequency_score NUMERIC DEFAULT 1.0,
    last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT now(),
    next_predicted TIMESTAMP WITH TIME ZONE,
    confidence_level NUMERIC DEFAULT 0.5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Feedback and Learning System
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.ai_messages(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL, -- 'thumbs_up', 'thumbs_down', 'correction', 'suggestion'
    feedback_value TEXT,
    correction_text TEXT,
    sentiment_score NUMERIC,
    response_quality NUMERIC, -- 1-5 rating
    helpfulness NUMERIC, -- 1-5 rating
    accuracy NUMERIC, -- 1-5 rating
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Proactive AI Suggestions
CREATE TABLE IF NOT EXISTS public.proactive_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL, -- 'morning_summary', 'compliance_reminder', 'pattern_based', 'predictive'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    action_type TEXT, -- 'open_chat', 'external_link', 'quick_action'
    action_data JSONB,
    priority_score NUMERIC DEFAULT 1.0,
    confidence_score NUMERIC DEFAULT 0.5,
    triggered_by JSONB, -- What pattern/data triggered this suggestion
    expires_at TIMESTAMP WITH TIME ZONE,
    shown_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trade-Specific Terminology and Context
CREATE TABLE IF NOT EXISTS public.trade_terminology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_category TEXT NOT NULL, -- 'plumbing', 'electrical', 'general', 'hvac', 'carpentry'
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    context_usage TEXT[],
    difficulty_level TEXT DEFAULT 'standard', -- 'basic', 'standard', 'advanced'
    synonyms TEXT[],
    related_terms TEXT[],
    usage_frequency NUMERIC DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Voice Interaction Optimization
CREATE TABLE IF NOT EXISTS public.voice_interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    session_id UUID DEFAULT gen_random_uuid(),
    audio_duration NUMERIC,
    transcription_accuracy NUMERIC,
    background_noise_level TEXT, -- 'low', 'medium', 'high'
    device_type TEXT,
    location_context TEXT, -- 'office', 'site', 'vehicle'
    recognition_confidence NUMERIC,
    response_synthesis_time NUMERIC,
    user_satisfaction NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Real-time Context Cache
CREATE TABLE IF NOT EXISTS public.user_context_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    context_type TEXT NOT NULL, -- 'current_work', 'team_status', 'compliance_summary', 'project_updates'
    context_data JSONB NOT NULL,
    cache_key TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, cache_key)
);

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_user_id ON public.user_ai_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_memory_user_id ON public.ai_conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_memory_type ON public.ai_conversation_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_user_patterns_user_id ON public.user_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patterns_type ON public.user_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_user_patterns_next_predicted ON public.user_patterns(next_predicted) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_processed ON public.ai_feedback(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_user_id ON public.proactive_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_active ON public.proactive_suggestions(is_active, expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_trade_terminology_category ON public.trade_terminology(trade_category);
CREATE INDEX IF NOT EXISTS idx_voice_logs_user_id ON public.voice_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_cache_user_key ON public.user_context_cache(user_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_user_context_cache_expires ON public.user_context_cache(expires_at);

-- Enable RLS on all tables
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_terminology ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Preferences
CREATE POLICY "Users can manage own AI preferences" ON public.user_ai_preferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE whalesync_postgres_id = user_ai_preferences.user_id 
            AND supabase_auth_id = auth.uid()
        )
    );

-- RLS Policies for Conversation Memory
CREATE POLICY "Users can access own conversation memory" ON public.ai_conversation_memory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE whalesync_postgres_id = ai_conversation_memory.user_id 
            AND supabase_auth_id = auth.uid()
        )
    );

-- RLS Policies for User Patterns
CREATE POLICY "Users can access own patterns" ON public.user_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE whalesync_postgres_id = user_patterns.user_id 
            AND supabase_auth_id = auth.uid()
        )
    );

-- RLS Policies for AI Feedback
CREATE POLICY "Users can manage own feedback" ON public.ai_feedback
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE whalesync_postgres_id = ai_feedback.user_id 
            AND supabase_auth_id = auth.uid()
        )
    );

-- RLS Policies for Proactive Suggestions
CREATE POLICY "Users can view own suggestions" ON public.proactive_suggestions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE whalesync_postgres_id = proactive_suggestions.user_id 
            AND supabase_auth_id = auth.uid()
        )
    );

-- RLS Policies for Trade Terminology (readable by all authenticated users)
CREATE POLICY "Authenticated users can read trade terminology" ON public.trade_terminology
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for Voice Logs
CREATE POLICY "Users can access own voice logs" ON public.voice_interaction_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE whalesync_postgres_id = voice_interaction_logs.user_id 
            AND supabase_auth_id = auth.uid()
        )
    );

-- RLS Policies for Context Cache
CREATE POLICY "Users can access own context cache" ON public.user_context_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE whalesync_postgres_id = user_context_cache.user_id 
            AND supabase_auth_id = auth.uid()
        )
    );

-- Admins can access all AI data for analytics
CREATE POLICY "Admins can access all AI data" ON public.user_ai_preferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Document Controller')
        )
    );

CREATE POLICY "Admins can access all conversation memory" ON public.ai_conversation_memory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Document Controller')
        )
    );

CREATE POLICY "Admins can access all patterns" ON public.user_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Document Controller')
        )
    );

CREATE POLICY "Admins can access all feedback" ON public.ai_feedback
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Document Controller')
        )
    );

-- Create functions for personalized AI operations
CREATE OR REPLACE FUNCTION public.get_user_ai_context(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_data JSONB;
    v_preferences JSONB;
    v_recent_patterns JSONB;
    v_context_cache JSONB;
BEGIN
    -- Get user basic data
    SELECT jsonb_build_object(
        'user_id', whalesync_postgres_id,
        'name', COALESCE(firstname || ' ' || lastname, fullname, email),
        'first_name', firstname,
        'role', role,
        'primary_skill', primaryskill,
        'current_project', currentproject,
        'skills', skills
    ) INTO v_user_data
    FROM public."Users"
    WHERE whalesync_postgres_id = p_user_id;
    
    -- Get AI preferences
    SELECT jsonb_build_object(
        'tone', preferred_tone,
        'terminology_level', trade_terminology_level,
        'greeting_style', greeting_style,
        'response_length', response_length
    ) INTO v_preferences
    FROM public.user_ai_preferences
    WHERE user_id = p_user_id;
    
    -- Get recent patterns
    SELECT jsonb_agg(
        jsonb_build_object(
            'type', pattern_type,
            'data', pattern_data,
            'confidence', confidence_level,
            'next_predicted', next_predicted
        )
    ) INTO v_recent_patterns
    FROM public.user_patterns
    WHERE user_id = p_user_id 
    AND is_active = true
    ORDER BY frequency_score DESC
    LIMIT 5;
    
    -- Get cached context
    SELECT jsonb_object_agg(cache_key, context_data) INTO v_context_cache
    FROM public.user_context_cache
    WHERE user_id = p_user_id
    AND expires_at > now();
    
    RETURN jsonb_build_object(
        'user', v_user_data,
        'preferences', COALESCE(v_preferences, '{}'::jsonb),
        'patterns', COALESCE(v_recent_patterns, '[]'::jsonb),
        'cached_context', COALESCE(v_context_cache, '{}'::jsonb)
    );
END;
$function$;

-- Function to generate personalized system prompt
CREATE OR REPLACE FUNCTION public.generate_personalized_prompt(p_user_id UUID, p_base_role TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_context JSONB;
    v_user_name TEXT;
    v_greeting_style TEXT;
    v_tone TEXT;
    v_trade_terms TEXT[];
    v_base_prompt TEXT;
    v_personalized_prompt TEXT;
BEGIN
    -- Get user context
    v_context := public.get_user_ai_context(p_user_id);
    
    v_user_name := v_context->'user'->>'name';
    v_greeting_style := COALESCE(v_context->'preferences'->>'greeting_style', 'friendly');
    v_tone := COALESCE(v_context->'preferences'->>'tone', 'professional');
    
    -- Get trade-specific terminology
    SELECT array_agg(term) INTO v_trade_terms
    FROM public.trade_terminology
    WHERE trade_category = COALESCE(v_context->'user'->>'primary_skill', 'general')
    LIMIT 20;
    
    -- Base role prompts (simplified from existing)
    v_base_prompt := CASE p_base_role
        WHEN 'Operative' THEN 'You are the AJ Ryan Operative AI Assistant for ' || v_user_name || '. Help with your timesheets, training records, RAMS, and assigned work.'
        WHEN 'Supervisor' THEN 'You are the AJ Ryan Supervisor AI Assistant for ' || v_user_name || '. Help with team management, project compliance, and site safety.'
        WHEN 'Project Manager' THEN 'You are the AJ Ryan Project Manager AI Assistant for ' || v_user_name || '. Help with project delivery, team coordination, and compliance tracking.'
        WHEN 'Admin' THEN 'You are the AJ Ryan Admin AI Assistant for ' || v_user_name || '. Help with user management, system administration, and compliance oversight.'
        WHEN 'Document Controller' THEN 'You are the AJ Ryan Document Controller AI Assistant for ' || v_user_name || '. Help with document management, version control, and approval workflows.'
        WHEN 'Director' THEN 'You are the AJ Ryan Director AI Assistant for ' || v_user_name || '. Provide strategic insights and organizational performance data.'
        ELSE 'You are the AJ Ryan AI Assistant for ' || v_user_name || '.'
    END;
    
    -- Add personalization
    v_personalized_prompt := v_base_prompt || 
        CASE v_greeting_style
            WHEN 'formal' THEN ' Address the user formally and professionally.'
            WHEN 'casual' THEN ' Keep interactions casual and friendly - like a helpful mate on site.'
            ELSE ' Be friendly but professional, like a knowledgeable colleague.'
        END ||
        CASE v_tone
            WHEN 'encouraging' THEN ' Always be encouraging and positive. Celebrate achievements and provide motivation.'
            WHEN 'direct' THEN ' Be direct and to-the-point. Focus on efficiency and clear communication.'
            ELSE ' Maintain a helpful and supportive tone.'
        END;
    
    -- Add trade terminology if available
    IF array_length(v_trade_terms, 1) > 0 THEN
        v_personalized_prompt := v_personalized_prompt || 
            ' Use appropriate trade terminology: ' || array_to_string(v_trade_terms, ', ') || '.';
    END IF;
    
    -- Add AJ Ryan brand context
    v_personalized_prompt := v_personalized_prompt || 
        ' You work for AJ Ryan, a leading construction company. Always maintain their values of honesty, helpfulness, and work-life balance. ' ||
        'Keep responses practical and time-saving. If asked about restricted information, politely redirect to appropriate channels.';
    
    RETURN v_personalized_prompt;
END;
$function$;

-- Function to cache user context for performance
CREATE OR REPLACE FUNCTION public.cache_user_context(p_user_id UUID, p_context_type TEXT, p_context_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.user_context_cache (user_id, context_type, context_data, cache_key)
    VALUES (p_user_id, p_context_type, p_context_data, p_context_type)
    ON CONFLICT (user_id, cache_key)
    DO UPDATE SET 
        context_data = EXCLUDED.context_data,
        expires_at = now() + interval '1 hour',
        created_at = now();
END;
$function$;

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION public.update_ai_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_user_ai_preferences_timestamp
    BEFORE UPDATE ON public.user_ai_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ai_timestamp();

CREATE TRIGGER update_user_patterns_timestamp
    BEFORE UPDATE ON public.user_patterns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ai_timestamp();

CREATE TRIGGER update_trade_terminology_timestamp
    BEFORE UPDATE ON public.trade_terminology
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ai_timestamp();

-- Insert sample trade terminology
INSERT INTO public.trade_terminology (trade_category, term, definition, context_usage, difficulty_level) VALUES
('general', 'RAMS', 'Risk Assessment Method Statement - safety planning document', ARRAY['safety', 'compliance', 'project'], 'basic'),
('general', 'POD', 'Proof of Delivery - delivery confirmation document', ARRAY['logistics', 'materials', 'tracking'], 'basic'),
('general', 'On-Hire', 'Equipment rental tracking and management', ARRAY['equipment', 'rental', 'tracking'], 'basic'),
('plumbing', 'MVHR', 'Mechanical Ventilation with Heat Recovery system', ARRAY['ventilation', 'heating', 'efficiency'], 'advanced'),
('plumbing', 'UFH', 'Underfloor Heating system installation', ARRAY['heating', 'comfort', 'efficiency'], 'standard'),
('electrical', 'RCD', 'Residual Current Device for electrical safety', ARRAY['safety', 'electrical', 'protection'], 'standard'),
('electrical', 'EICR', 'Electrical Installation Condition Report', ARRAY['testing', 'compliance', 'safety'], 'advanced'),
('general', 'Snag', 'Minor defect or issue requiring attention', ARRAY['quality', 'completion', 'handover'], 'basic'),
('general', 'Plot', 'Individual property unit within development', ARRAY['construction', 'property', 'development'], 'basic'),
('general', 'Block', 'Building containing multiple plots/units', ARRAY['construction', 'building', 'development'], 'basic')
ON CONFLICT DO NOTHING;