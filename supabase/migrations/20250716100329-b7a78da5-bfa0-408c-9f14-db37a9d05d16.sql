-- PHASE 2 (FIXED): DATA QUALITY & USABILITY IMPROVEMENTS
-- Create helper view for common project summary data (without RLS policy)

CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.whalesync_postgres_id as project_id,
    p.projectname,
    p.projectuid,
    p.clientname,
    p.status,
    p.totalplots,
    p.startdate,
    p.plannedenddate,
    p.actualenddate,
    COALESCE(pm.fullname, p.projectmanager) as project_manager_name,
    -- Calculate progress metrics
    CASE 
        WHEN p.totalplots > 0 THEN 
            ROUND((COUNT(CASE WHEN pl.plotstatus = 'Complete' THEN 1 END) * 100.0 / p.totalplots), 1)
        ELSE 0 
    END as completion_percentage,
    COUNT(CASE WHEN pl.plotstatus = 'Complete' THEN 1 END) as completed_plots,
    COUNT(CASE WHEN pl.plotstatus = 'In Progress' THEN 1 END) as active_plots,
    COUNT(CASE WHEN pl.plotstatus = 'Not Started' THEN 1 END) as pending_plots,
    -- Team info
    COUNT(DISTINCT pt.user_id) as team_size,
    -- Recent activity
    MAX(pl.actualhandoverdate) as last_handover_date
FROM public."Projects" p
LEFT JOIN public."Users" pm ON p.project_manager_id = pm.whalesync_postgres_id
LEFT JOIN public."Blocks" b ON b.whalesync_postgres_id = ANY(p.blocks)
LEFT JOIN public."Levels" l ON l.whalesync_postgres_id = ANY(b.levels)
LEFT JOIN public."Plots" pl ON pl.whalesync_postgres_id = ANY(l.plots)
LEFT JOIN project_team pt ON pt.project_id = p.whalesync_postgres_id
GROUP BY 
    p.whalesync_postgres_id, p.projectname, p.projectuid, p.clientname, p.status,
    p.totalplots, p.startdate, p.plannedenddate, p.actualenddate, 
    COALESCE(pm.fullname, p.projectmanager);

-- PHASE 3: PERFORMANCE & MAINTENANCE IMPROVEMENTS
-- Create data validation triggers for data integrity

-- Create trigger to validate plot completion percentage
CREATE OR REPLACE FUNCTION validate_plot_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Ensure completion percentage is between 0 and 100
    IF NEW.completion_percentage < 0 THEN
        NEW.completion_percentage = 0;
    ELSIF NEW.completion_percentage > 100 THEN
        NEW.completion_percentage = 100;
    END IF;
    
    -- Auto-update plot status based on completion percentage
    IF NEW.completion_percentage = 0 THEN
        NEW.plotstatus = 'Not Started';
    ELSIF NEW.completion_percentage = 100 THEN
        NEW.plotstatus = 'Complete';
        -- Set completion date if not already set
        IF NEW.actualhandoverdate IS NULL THEN
            NEW.actualhandoverdate = CURRENT_DATE;
        END IF;
    ELSE
        NEW.plotstatus = 'In Progress';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_plot_completion_trigger
    BEFORE INSERT OR UPDATE ON "Plots"
    FOR EACH ROW EXECUTE FUNCTION validate_plot_completion();

-- Create audit logging for critical changes
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    change_reason TEXT
);

-- Enable RLS on audit trail
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Create policies for audit trail
CREATE POLICY "Admins can view all audit trail" ON audit_trail
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller')
    )
);

CREATE POLICY "System can insert audit records" ON audit_trail
FOR INSERT WITH CHECK (true);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user ID
    SELECT whalesync_postgres_id INTO current_user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Log the change
    INSERT INTO public.audit_trail (
        table_name,
        operation,
        record_id,
        old_values,
        new_values,
        changed_by
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.whalesync_postgres_id, OLD.whalesync_postgres_id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) 
             WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) 
             ELSE NULL END,
        current_user_id
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit triggers to critical tables
CREATE TRIGGER audit_projects_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Projects"
    FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER audit_plots_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Plots"
    FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Users"
    FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- Create performance optimization function
CREATE OR REPLACE FUNCTION optimize_project_metrics()
RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Update all project total plots counts
    UPDATE public."Projects" p
    SET totalplots = (
        SELECT COALESCE(SUM(array_length(l.plots, 1)), 0)
        FROM public."Blocks" b
        LEFT JOIN public."Levels" l ON l.whalesync_postgres_id = ANY(b.levels)
        WHERE b.whalesync_postgres_id = ANY(p.blocks)
        AND l.plots IS NOT NULL
    );
    
    -- Update all level plot counts
    UPDATE public."Levels" l
    SET plotsonlevel = COALESCE(array_length(l.plots, 1), 0);
    
    -- Update user plot completion counts
    UPDATE public."Users" u
    SET total_plots_completed = (
        SELECT COUNT(*)
        FROM public."Plots" p
        JOIN public."Plot_Assignments" pa ON pa.plot_id = p.whalesync_postgres_id
        WHERE pa.user_id = u.whalesync_postgres_id
        AND p.plotstatus = 'Complete'
    );
    
    -- Log the optimization
    INSERT INTO public.audit_trail (
        table_name,
        operation,
        record_id,
        new_values,
        changed_by
    ) VALUES (
        'system_optimization',
        'OPTIMIZE',
        gen_random_uuid(),
        jsonb_build_object(
            'action', 'optimize_project_metrics',
            'timestamp', now(),
            'projects_updated', (SELECT COUNT(*) FROM public."Projects"),
            'levels_updated', (SELECT COUNT(*) FROM public."Levels"),
            'users_updated', (SELECT COUNT(*) FROM public."Users")
        ),
        NULL
    );
END;
$$;

-- Create maintenance functions
CREATE OR REPLACE FUNCTION cleanup_old_audit_records()
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete audit records older than 2 years
    DELETE FROM public.audit_trail
    WHERE changed_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Add missing foreign key indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blocks_project ON "Blocks"(project);
CREATE INDEX IF NOT EXISTS idx_levels_block ON "Levels"(block);
CREATE INDEX IF NOT EXISTS idx_plots_assignments_user ON "Plot_Assignments"(user_id);
CREATE INDEX IF NOT EXISTS idx_plots_assignments_plot ON "Plot_Assignments"(plot_id);
CREATE INDEX IF NOT EXISTS idx_work_history_user ON "Work_Tracking_History"(user_id);
CREATE INDEX IF NOT EXISTS idx_work_history_plot ON "Work_Tracking_History"(plot_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_plots_level_status ON "Plots"(level, plotstatus);
CREATE INDEX IF NOT EXISTS idx_plots_status_completion ON "Plots"(plotstatus, completion_percentage);
CREATE INDEX IF NOT EXISTS idx_users_project_role ON "Users"(currentproject, role);
CREATE INDEX IF NOT EXISTS idx_audit_trail_table_time ON audit_trail(table_name, changed_at);

-- Create function to get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'assigned_plots', COUNT(DISTINCT pa.plot_id),
        'completed_plots', COUNT(DISTINCT CASE WHEN p.plotstatus = 'Complete' THEN pa.plot_id END),
        'active_plots', COUNT(DISTINCT CASE WHEN p.plotstatus = 'In Progress' THEN pa.plot_id END),
        'pending_plots', COUNT(DISTINCT CASE WHEN p.plotstatus = 'Not Started' THEN pa.plot_id END),
        'completion_rate', CASE 
            WHEN COUNT(DISTINCT pa.plot_id) > 0 THEN 
                ROUND((COUNT(DISTINCT CASE WHEN p.plotstatus = 'Complete' THEN pa.plot_id END) * 100.0 / COUNT(DISTINCT pa.plot_id)), 1)
            ELSE 0
        END,
        'current_project', u.currentproject,
        'project_name', pr.projectname,
        'recent_work_entries', COUNT(DISTINCT CASE WHEN wth.work_date >= CURRENT_DATE - INTERVAL '7 days' THEN wth.id END)
    ) INTO user_stats
    FROM public."Users" u
    LEFT JOIN public."Plot_Assignments" pa ON pa.user_id = u.whalesync_postgres_id
    LEFT JOIN public."Plots" p ON p.whalesync_postgres_id = pa.plot_id
    LEFT JOIN public."Projects" pr ON pr.whalesync_postgres_id = u.currentproject
    LEFT JOIN public."Work_Tracking_History" wth ON wth.user_id = u.whalesync_postgres_id
    WHERE u.whalesync_postgres_id = p_user_id
    GROUP BY u.whalesync_postgres_id, u.currentproject, pr.projectname;
    
    RETURN COALESCE(user_stats, '{}'::jsonb);
END;
$$;