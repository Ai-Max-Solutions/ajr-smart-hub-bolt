-- Create analytics and reporting tables (fixed foreign key references)
CREATE TABLE IF NOT EXISTS public.analytics_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('performance', 'compliance', 'cost', 'resource', 'custom')),
    description TEXT,
    parameters JSONB DEFAULT '{}',
    schedule JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    last_generated TIMESTAMP WITH TIME ZONE,
    report_data JSONB,
    export_formats TEXT[] DEFAULT ARRAY['pdf', 'excel', 'csv']
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    user_id UUID,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Create cost analysis table
CREATE TABLE IF NOT EXISTS public.cost_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    cost_category TEXT NOT NULL,
    planned_cost NUMERIC,
    actual_cost NUMERIC,
    variance NUMERIC GENERATED ALWAYS AS (actual_cost - planned_cost) STORED,
    variance_percentage NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN planned_cost > 0 THEN ((actual_cost - planned_cost) / planned_cost) * 100
            ELSE 0
        END
    ) STORED,
    cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resource utilization table
CREATE TABLE IF NOT EXISTS public.resource_utilization (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    user_id UUID,
    resource_type TEXT NOT NULL,
    allocated_hours NUMERIC,
    utilized_hours NUMERIC,
    utilization_percentage NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN allocated_hours > 0 THEN (utilized_hours / allocated_hours) * 100
            ELSE 0
        END
    ) STORED,
    efficiency_score NUMERIC,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_utilization ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage all analytics reports" ON public.analytics_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
        )
    );

CREATE POLICY "Users can view relevant performance metrics" ON public.performance_metrics
    FOR SELECT USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
        )
    );

CREATE POLICY "Admins can manage cost analysis" ON public.cost_analysis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
        )
    );

CREATE POLICY "Users can view relevant resource utilization" ON public.resource_utilization
    FOR SELECT USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
        )
    );

-- Create analytics functions
CREATE OR REPLACE FUNCTION public.get_project_analytics(p_project_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
    v_end_date := COALESCE(p_end_date, CURRENT_DATE);
    
    WITH project_metrics AS (
        SELECT 
            COUNT(DISTINCT wth.user_id) as active_workers,
            SUM(wth.hours_worked) as total_hours,
            AVG(wth.hours_worked) as avg_hours_per_day,
            COUNT(DISTINCT wth.plot_id) as plots_worked,
            COUNT(*) as total_entries
        FROM public."Work_Tracking_History" wth
        JOIN public."Plots" p ON wth.plot_id = p.whalesync_postgres_id
        JOIN public."Levels" l ON p.level = l.whalesync_postgres_id
        JOIN public."Blocks" b ON l.block = b.whalesync_postgres_id
        WHERE b.project = p_project_id
        AND wth.work_date BETWEEN v_start_date AND v_end_date
    ),
    plot_completion AS (
        SELECT 
            COUNT(*) as total_plots,
            COUNT(*) FILTER (WHERE completion_percentage >= 100) as completed_plots,
            AVG(completion_percentage) as avg_completion
        FROM public."Plots" p
        JOIN public."Levels" l ON p.level = l.whalesync_postgres_id
        JOIN public."Blocks" b ON l.block = b.whalesync_postgres_id
        WHERE b.project = p_project_id
    ),
    cost_summary AS (
        SELECT 
            SUM(actual_cost) as total_actual_cost,
            SUM(planned_cost) as total_planned_cost,
            AVG(variance_percentage) as avg_variance_percentage
        FROM public.cost_analysis
        WHERE project_id = p_project_id
        AND cost_date BETWEEN v_start_date AND v_end_date
    )
    SELECT jsonb_build_object(
        'project_id', p_project_id,
        'period', jsonb_build_object(
            'start_date', v_start_date,
            'end_date', v_end_date
        ),
        'workforce', jsonb_build_object(
            'active_workers', COALESCE(pm.active_workers, 0),
            'total_hours', COALESCE(pm.total_hours, 0),
            'avg_hours_per_day', COALESCE(pm.avg_hours_per_day, 0),
            'productivity_score', CASE 
                WHEN pm.total_hours > 0 THEN ROUND((pm.plots_worked::NUMERIC / pm.total_hours) * 100, 2)
                ELSE 0
            END
        ),
        'completion', jsonb_build_object(
            'total_plots', COALESCE(pc.total_plots, 0),
            'completed_plots', COALESCE(pc.completed_plots, 0),
            'completion_rate', CASE 
                WHEN pc.total_plots > 0 THEN ROUND((pc.completed_plots::NUMERIC / pc.total_plots) * 100, 2)
                ELSE 0
            END,
            'avg_completion', COALESCE(ROUND(pc.avg_completion, 2), 0)
        ),
        'costs', jsonb_build_object(
            'actual_cost', COALESCE(cs.total_actual_cost, 0),
            'planned_cost', COALESCE(cs.total_planned_cost, 0),
            'variance_percentage', COALESCE(cs.avg_variance_percentage, 0),
            'budget_status', CASE 
                WHEN cs.avg_variance_percentage <= 5 THEN 'on_track'
                WHEN cs.avg_variance_percentage <= 15 THEN 'warning'
                ELSE 'over_budget'
            END
        )
    ) INTO v_result
    FROM project_metrics pm
    CROSS JOIN plot_completion pc
    CROSS JOIN cost_summary cs;
    
    RETURN COALESCE(v_result, '{"error": "No data available"}'::jsonb);
END;
$$;

-- Create predictive analytics function
CREATE OR REPLACE FUNCTION public.predict_project_completion(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH recent_progress AS (
        SELECT 
            AVG(p.completion_percentage) as current_completion,
            COUNT(*) as total_plots,
            EXTRACT(DAYS FROM (MAX(wth.work_date) - MIN(wth.work_date))) as work_days
        FROM public."Plots" p
        JOIN public."Levels" l ON p.level = l.whalesync_postgres_id
        JOIN public."Blocks" b ON l.block = b.whalesync_postgres_id
        LEFT JOIN public."Work_Tracking_History" wth ON wth.plot_id = p.whalesync_postgres_id
        WHERE b.project = p_project_id
        AND wth.work_date >= CURRENT_DATE - INTERVAL '30 days'
    ),
    daily_progress AS (
        SELECT 
            wth.work_date,
            COUNT(DISTINCT wth.plot_id) as plots_worked
        FROM public."Work_Tracking_History" wth
        JOIN public."Plots" p ON wth.plot_id = p.whalesync_postgres_id
        JOIN public."Levels" l ON p.level = l.whalesync_postgres_id
        JOIN public."Blocks" b ON l.block = b.whalesync_postgres_id
        WHERE b.project = p_project_id
        AND wth.work_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY wth.work_date
    )
    SELECT jsonb_build_object(
        'project_id', p_project_id,
        'current_completion', COALESCE(rp.current_completion, 0),
        'predicted_completion_date', CASE 
            WHEN COALESCE(dp_avg.avg_plots_per_day, 0) > 0 AND COALESCE(rp.current_completion, 0) < 100
            THEN CURRENT_DATE + ((100 - COALESCE(rp.current_completion, 0)) / dp_avg.avg_plots_per_day)::INTEGER
            ELSE NULL
        END,
        'confidence_level', CASE 
            WHEN rp.work_days >= 14 AND dp_avg.avg_plots_per_day > 0 THEN 'high'
            WHEN rp.work_days >= 7 THEN 'medium'
            ELSE 'low'
        END,
        'daily_progress_rate', COALESCE(dp_avg.avg_plots_per_day, 0),
        'risk_factors', jsonb_build_array(
            CASE WHEN dp_avg.avg_plots_per_day < 1 THEN 'low_productivity' END,
            CASE WHEN rp.current_completion < 50 AND rp.work_days > 30 THEN 'behind_schedule' END
        ) - 'null'::text
    ) INTO v_result
    FROM recent_progress rp
    CROSS JOIN (
        SELECT AVG(plots_worked) as avg_plots_per_day
        FROM daily_progress
    ) dp_avg;
    
    RETURN COALESCE(v_result, '{"error": "Insufficient data for prediction"}'::jsonb);
END;
$$;

-- Create resource efficiency function
CREATE OR REPLACE FUNCTION public.calculate_resource_efficiency(p_project_id UUID DEFAULT NULL, p_period_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH user_efficiency AS (
        SELECT 
            u.whalesync_postgres_id as user_id,
            u.fullname,
            u.role,
            COUNT(DISTINCT wth.plot_id) as plots_completed,
            SUM(wth.hours_worked) as total_hours,
            ROUND(COUNT(DISTINCT wth.plot_id)::NUMERIC / NULLIF(SUM(wth.hours_worked), 0), 2) as plots_per_hour,
            ROUND(AVG(wth.hours_worked), 2) as avg_hours_per_day
        FROM public."Users" u
        LEFT JOIN public."Work_Tracking_History" wth ON wth.user_id = u.whalesync_postgres_id
        WHERE (p_project_id IS NULL OR u.currentproject = p_project_id)
        AND wth.work_date >= CURRENT_DATE - p_period_days
        AND u.employmentstatus = 'Active'
        GROUP BY u.whalesync_postgres_id, u.fullname, u.role
        HAVING SUM(wth.hours_worked) > 0
    ),
    efficiency_stats AS (
        SELECT 
            COUNT(*) as total_workers,
            AVG(plots_per_hour) as avg_efficiency,
            STDDEV(plots_per_hour) as efficiency_stddev,
            MAX(plots_per_hour) as max_efficiency,
            MIN(plots_per_hour) as min_efficiency
        FROM user_efficiency
    )
    SELECT jsonb_build_object(
        'period_days', p_period_days,
        'project_id', p_project_id,
        'summary', jsonb_build_object(
            'total_workers', COALESCE(es.total_workers, 0),
            'avg_efficiency', COALESCE(ROUND(es.avg_efficiency, 3), 0),
            'efficiency_range', jsonb_build_object(
                'min', COALESCE(ROUND(es.min_efficiency, 3), 0),
                'max', COALESCE(ROUND(es.max_efficiency, 3), 0),
                'stddev', COALESCE(ROUND(es.efficiency_stddev, 3), 0)
            )
        ),
        'top_performers', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'user_id', user_id,
                    'name', fullname,
                    'role', role,
                    'efficiency', plots_per_hour,
                    'plots_completed', plots_completed,
                    'total_hours', total_hours
                ) ORDER BY plots_per_hour DESC
            ) FROM (
                SELECT * FROM user_efficiency 
                ORDER BY plots_per_hour DESC 
                LIMIT 5
            ) top
        )
    ) INTO v_result
    FROM efficiency_stats es;
    
    RETURN COALESCE(v_result, '{"error": "No efficiency data available"}'::jsonb);
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_project_date ON public.performance_metrics(project_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_date ON public.performance_metrics(user_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_project_date ON public.cost_analysis(project_id, cost_date);
CREATE INDEX IF NOT EXISTS idx_resource_utilization_project_period ON public.resource_utilization(project_id, period_start, period_end);