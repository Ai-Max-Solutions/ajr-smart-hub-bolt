-- Phase 3: Database Schema Hardening (Final)
-- Add role validation constraints and performance indexes

-- 1. Add check constraints for role validation (all existing values included)
ALTER TABLE public."Users" 
ADD CONSTRAINT valid_roles 
CHECK (role IN (
    'Admin', 'Document Controller', 'Project Manager', 'Supervisor', 'Foreman', 'Staff', 'Operative', 'Director',
    'Electrician', 'Gas Engineer', 'Heating Engineer', 'Multi-Skilled Engineer', 'Senior Plumber', 
    'Site Supervisor', 'Testing & Commissioning Engineer', 'Apprentice Plumber',
    'Subcontractor - Gas Specialist'
));

ALTER TABLE public."Users" 
ADD CONSTRAINT valid_system_roles 
CHECK (system_role IN ('Admin', 'Document Controller', 'Project Manager', 'Worker', 'Director', 'Supervisor'));

ALTER TABLE public."Users" 
ADD CONSTRAINT valid_employment_status 
CHECK (employmentstatus IN ('Active', 'Inactive', 'Suspended', 'Terminated', 'Apprentice'));

-- 2. Add check constraints for activity metrics
ALTER TABLE public.activity_metrics 
ADD CONSTRAINT valid_action_types 
CHECK (action_type IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'));

-- 3. Add check constraints for plot assignments
ALTER TABLE public."Plot_Assignments" 
ADD CONSTRAINT valid_assignment_status 
CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled', 'on_hold'));

ALTER TABLE public."Plot_Assignments" 
ADD CONSTRAINT valid_work_types 
CHECK (work_type IN ('first_fix', 'second_fix', 'final_fix', 'inspection', 'snagging', 'handover'));

-- 4. Add check constraints for work tracking
ALTER TABLE public."Work_Tracking_History" 
ADD CONSTRAINT valid_work_tracking_types 
CHECK (work_type IN ('first_fix', 'second_fix', 'final_fix', 'inspection', 'snagging', 'maintenance', 'repair'));

ALTER TABLE public."Work_Tracking_History" 
ADD CONSTRAINT positive_hours_worked 
CHECK (hours_worked >= 0 AND hours_worked <= 24);

-- 5. Add check constraints for plot completion
ALTER TABLE public."Plots" 
ADD CONSTRAINT valid_completion_percentage 
CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

-- 6. Add performance indexes (without CONCURRENTLY in transaction)
CREATE INDEX IF NOT EXISTS idx_users_role ON public."Users"(role);
CREATE INDEX IF NOT EXISTS idx_users_employment_status ON public."Users"(employmentstatus);
CREATE INDEX IF NOT EXISTS idx_users_supabase_auth_id ON public."Users"(supabase_auth_id);
CREATE INDEX IF NOT EXISTS idx_activity_metrics_user_action ON public.activity_metrics(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_plot_assignments_user_status ON public."Plot_Assignments"(user_id, status);
CREATE INDEX IF NOT EXISTS idx_work_tracking_user_date ON public."Work_Tracking_History"(user_id, work_date);

-- 7. Role escalation prevention trigger
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    SELECT role INTO current_user_role
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Prevent privilege escalation
    IF OLD.role != NEW.role AND current_user_role NOT IN ('Admin', 'Document Controller') THEN
        IF NEW.role IN ('Admin', 'Document Controller', 'Director') THEN
            RAISE EXCEPTION 'Insufficient privileges to assign administrative roles';
        END IF;
    END IF;
    
    -- Prevent self-role modification
    IF OLD.whalesync_postgres_id = (
        SELECT whalesync_postgres_id FROM public."Users" WHERE supabase_auth_id = auth.uid()
    ) AND OLD.role != NEW.role THEN
        RAISE EXCEPTION 'Users cannot modify their own role';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_role_change_trigger ON public."Users";
CREATE TRIGGER validate_role_change_trigger
    BEFORE UPDATE ON public."Users"
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_role_change();

-- 8. Orphaned records cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_records()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    DELETE FROM public.activity_metrics 
    WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT whalesync_postgres_id FROM public."Users");
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    DELETE FROM public."Plot_Assignments" 
    WHERE user_id NOT IN (SELECT whalesync_postgres_id FROM public."Users")
    OR plot_id NOT IN (SELECT whalesync_postgres_id FROM public."Plots");
    
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM public."Work_Tracking_History" 
    WHERE user_id NOT IN (SELECT whalesync_postgres_id FROM public."Users")
    OR plot_id NOT IN (SELECT whalesync_postgres_id FROM public."Plots");
    
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;