
-- Create AI suggestion functions and enhance existing tables
CREATE OR REPLACE FUNCTION public.ai_suggest_user_for_task(
    p_work_category_id UUID,
    p_plot_id UUID,
    p_project_id UUID DEFAULT NULL
)
RETURNS TABLE(
    user_id UUID,
    user_name TEXT,
    suggestion_score NUMERIC,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        -- Simple scoring based on recent completion rate and experience
        CASE 
            WHEN COUNT(uwl.id) > 0 THEN 
                (COUNT(CASE WHEN uwl.status = 'completed' THEN 1 END)::NUMERIC / COUNT(uwl.id)::NUMERIC) * 100
            ELSE 50 -- Default score for new users
        END as suggestion_score,
        CASE 
            WHEN COUNT(uwl.id) > 5 THEN 'High experience with similar tasks'
            WHEN COUNT(uwl.id) > 2 THEN 'Some experience with similar tasks'
            ELSE 'Available for assignment'
        END as reason
    FROM public.users u
    LEFT JOIN public.unit_work_logs uwl ON uwl.user_id = u.id 
        AND uwl.work_category_id = p_work_category_id
        AND uwl.created_at > NOW() - INTERVAL '30 days'
    WHERE u.role IN ('Operative', 'Supervisor')
        AND u.employmentstatus = 'Active'
    GROUP BY u.id, u.name
    ORDER BY suggestion_score DESC, u.name ASC;
END;
$$;

-- Create function to predict task delays
CREATE OR REPLACE FUNCTION public.predict_task_delay(
    p_assignment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assignment RECORD;
    v_avg_hours NUMERIC;
    v_days_overdue INTEGER;
    v_risk_level TEXT;
    v_reason TEXT;
BEGIN
    -- Get assignment details
    SELECT 
        uwa.*,
        wc.main_category,
        wc.sub_task,
        u.name as assigned_user_name
    INTO v_assignment
    FROM public.unit_work_assignments uwa
    JOIN public.work_categories wc ON wc.id = uwa.work_category_id
    JOIN public.users u ON u.id = uwa.assigned_user_id
    WHERE uwa.id = p_assignment_id;
    
    -- Calculate average hours for similar tasks
    SELECT AVG(uwl.hours) INTO v_avg_hours
    FROM public.unit_work_logs uwl
    WHERE uwl.work_category_id = v_assignment.work_category_id
        AND uwl.status = 'completed'
        AND uwl.created_at > NOW() - INTERVAL '90 days';
    
    -- Check if overdue
    v_days_overdue := CASE 
        WHEN v_assignment.due_date IS NOT NULL AND v_assignment.due_date < CURRENT_DATE 
        THEN CURRENT_DATE - v_assignment.due_date
        ELSE 0
    END;
    
    -- Determine risk level
    IF v_days_overdue > 3 THEN
        v_risk_level := 'HIGH';
        v_reason := 'Task is ' || v_days_overdue || ' days overdue';
    ELSIF v_days_overdue > 0 THEN
        v_risk_level := 'MEDIUM';
        v_reason := 'Task is ' || v_days_overdue || ' days overdue';
    ELSIF v_assignment.estimated_hours IS NOT NULL AND v_avg_hours IS NOT NULL AND v_avg_hours > v_assignment.estimated_hours * 1.5 THEN
        v_risk_level := 'MEDIUM';
        v_reason := 'Similar tasks typically take longer than estimated';
    ELSE
        v_risk_level := 'LOW';
        v_reason := 'Task appears to be on track';
    END IF;
    
    RETURN jsonb_build_object(
        'risk_level', v_risk_level,
        'reason', v_reason,
        'days_overdue', v_days_overdue,
        'avg_hours', COALESCE(v_avg_hours, 0),
        'estimated_hours', COALESCE(v_assignment.estimated_hours, 0)
    );
END;
$$;

-- Create function to calculate completion percentage for a plot
CREATE OR REPLACE FUNCTION public.calculate_plot_completion(p_plot_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_assignments INTEGER;
    v_completed_assignments INTEGER;
    v_completion_percentage NUMERIC;
BEGIN
    -- Count total assignments for this plot
    SELECT COUNT(*) INTO v_total_assignments
    FROM public.unit_work_assignments
    WHERE plot_id = p_plot_id;
    
    -- Count completed assignments
    SELECT COUNT(*) INTO v_completed_assignments
    FROM public.unit_work_assignments
    WHERE plot_id = p_plot_id
        AND status = 'completed';
    
    -- Calculate percentage
    IF v_total_assignments > 0 THEN
        v_completion_percentage := (v_completed_assignments::NUMERIC / v_total_assignments::NUMERIC);
    ELSE
        v_completion_percentage := 0;
    END IF;
    
    RETURN v_completion_percentage;
END;
$$;

-- Create function to calculate bonus for completing tasks under estimated time
CREATE OR REPLACE FUNCTION public.calculate_task_bonus(
    p_assignment_id UUID,
    p_actual_hours NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assignment RECORD;
    v_user_rate NUMERIC;
    v_bonus_rate NUMERIC;
    v_time_saved NUMERIC;
    v_bonus_amount NUMERIC;
BEGIN
    -- Get assignment details
    SELECT * INTO v_assignment
    FROM public.unit_work_assignments
    WHERE id = p_assignment_id;
    
    -- Get user rates
    SELECT hourly_rate, COALESCE(bonus_rate, 0) 
    INTO v_user_rate, v_bonus_rate
    FROM public.user_job_rates
    WHERE user_id = v_assignment.assigned_user_id
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY effective_from DESC
    LIMIT 1;
    
    -- Calculate bonus if completed under estimated time
    IF v_assignment.estimated_hours IS NOT NULL AND p_actual_hours < v_assignment.estimated_hours THEN
        v_time_saved := v_assignment.estimated_hours - p_actual_hours;
        v_bonus_amount := v_time_saved * COALESCE(v_bonus_rate, v_user_rate * 0.5);
    ELSE
        v_time_saved := 0;
        v_bonus_amount := 0;
    END IF;
    
    RETURN jsonb_build_object(
        'eligible', v_bonus_amount > 0,
        'time_saved', v_time_saved,
        'bonus_amount', v_bonus_amount,
        'message', CASE 
            WHEN v_bonus_amount > 0 THEN 'Bonus earned: £' || ROUND(v_bonus_amount, 2) || ' for completing ' || v_time_saved || ' hours early!'
            ELSE 'No bonus earned'
        END
    );
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_unit_work_assignments_plot_status ON public.unit_work_assignments(plot_id, status);
CREATE INDEX IF NOT EXISTS idx_unit_work_logs_category_user ON public.unit_work_logs(work_category_id, user_id);
CREATE INDEX IF NOT EXISTS idx_unit_work_logs_created_at ON public.unit_work_logs(created_at);
