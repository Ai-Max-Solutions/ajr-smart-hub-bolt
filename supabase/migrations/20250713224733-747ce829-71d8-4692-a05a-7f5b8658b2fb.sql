-- Phase 1: Critical RLS Policies for Production Security

-- Enable RLS on all sensitive tables
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Work_Tracking_History" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plot_Assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plot_Status_History" ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to get user role without infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM "Users" WHERE supabase_auth_id = auth.uid();
$$;

-- Create function to check if user has elevated permissions
CREATE OR REPLACE FUNCTION public.user_has_elevated_permissions(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    is_elevated BOOLEAN;
BEGIN
    -- Cache the result in a temporary table for the transaction
    SELECT role INTO user_role
    FROM "Users"
    WHERE whalesync_postgres_id = user_uuid;
    
    is_elevated := user_role IN ('Manager', 'Admin', 'Director', 'Supervisor', 'PM');
    
    RETURN COALESCE(is_elevated, FALSE);
END;
$$;

-- Users table policies
CREATE POLICY "Users can view their own profile and relevant data"
ON "Users" FOR SELECT USING (
    auth.uid() = supabase_auth_id 
    OR EXISTS (
        SELECT 1 FROM "Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'PM', 'Supervisor', 'Director')
    )
);

CREATE POLICY "Users can update their own profile"
ON "Users" FOR UPDATE USING (
    auth.uid() = supabase_auth_id
);

CREATE POLICY "Admins can manage all users"
ON "Users" FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin')
    )
);

-- Projects table policies
CREATE POLICY "Users can view assigned projects"
ON "Projects" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        WHERE u.supabase_auth_id = auth.uid()
        AND (
            u.role IN ('Admin', 'Director') -- Admins and Directors see all
            OR u.currentproject = whalesync_postgres_id -- Users see their current project
            OR u.role = 'PM' -- PMs see projects they manage
        )
    )
);

CREATE POLICY "Project managers can update their projects"
ON "Projects" FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        WHERE u.supabase_auth_id = auth.uid()
        AND (
            u.role IN ('Admin', 'PM')
            OR u.currentproject = whalesync_postgres_id
        )
    )
);

-- Plots table policies - project-based access
CREATE POLICY "Users can view plots in their projects"
ON "Plots" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        LEFT JOIN "Levels" l ON l.whalesync_postgres_id = "Plots".level
        LEFT JOIN "Blocks" b ON b.whalesync_postgres_id = l.block
        WHERE u.supabase_auth_id = auth.uid()
        AND (
            u.role IN ('Admin', 'Director') -- Admins and Directors see all
            OR u.currentproject = b.project -- Users see plots in their project
        )
    )
);

CREATE POLICY "Supervisors and PMs can update plots in their projects"
ON "Plots" FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        LEFT JOIN "Levels" l ON l.whalesync_postgres_id = "Plots".level
        LEFT JOIN "Blocks" b ON b.whalesync_postgres_id = l.block
        WHERE u.supabase_auth_id = auth.uid()
        AND (
            u.role IN ('Admin', 'PM', 'Supervisor')
            AND u.currentproject = b.project
        )
    )
);

-- Work tracking history - users can only see their own work
CREATE POLICY "Users can view their own work history"
ON "Work_Tracking_History" FOR SELECT USING (
    user_id = (SELECT whalesync_postgres_id FROM "Users" WHERE supabase_auth_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM "Users" u
        WHERE u.supabase_auth_id = auth.uid()
        AND u.role IN ('Admin', 'Director', 'PM', 'Supervisor')
    )
);

CREATE POLICY "Users can create their own work records"
ON "Work_Tracking_History" FOR INSERT WITH CHECK (
    user_id = (SELECT whalesync_postgres_id FROM "Users" WHERE supabase_auth_id = auth.uid())
);

CREATE POLICY "Users can update their own work records"
ON "Work_Tracking_History" FOR UPDATE USING (
    user_id = (SELECT whalesync_postgres_id FROM "Users" WHERE supabase_auth_id = auth.uid())
);

-- Plot assignments - project-based access
CREATE POLICY "Users can view plot assignments in their projects"
ON "Plot_Assignments" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        LEFT JOIN "Plots" p ON p.whalesync_postgres_id = "Plot_Assignments".plot_id
        LEFT JOIN "Levels" l ON l.whalesync_postgres_id = p.level
        LEFT JOIN "Blocks" b ON b.whalesync_postgres_id = l.block
        WHERE u.supabase_auth_id = auth.uid()
        AND (
            u.role IN ('Admin', 'Director')
            OR u.currentproject = b.project
            OR u.whalesync_postgres_id = "Plot_Assignments".user_id
        )
    )
);

CREATE POLICY "Supervisors and PMs can manage plot assignments"
ON "Plot_Assignments" FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        LEFT JOIN "Plots" p ON p.whalesync_postgres_id = "Plot_Assignments".plot_id
        LEFT JOIN "Levels" l ON l.whalesync_postgres_id = p.level
        LEFT JOIN "Blocks" b ON b.whalesync_postgres_id = l.block
        WHERE u.supabase_auth_id = auth.uid()
        AND (
            u.role IN ('Admin', 'PM', 'Supervisor')
            AND u.currentproject = b.project
        )
    )
);

-- Prevent users from updating their own role (critical security)
CREATE POLICY "Prevent self-role-escalation"
ON "Users" FOR UPDATE USING (
    CASE 
        WHEN auth.uid() = supabase_auth_id THEN
            -- Users can update their profile but NOT their role
            OLD.role = NEW.role
        ELSE
            -- Admins can update other users
            EXISTS (
                SELECT 1 FROM "Users" 
                WHERE supabase_auth_id = auth.uid() 
                AND role = 'Admin'
            )
    END
);

-- Create audit trigger for role changes
CREATE OR REPLACE FUNCTION audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO audit_log (
            user_id, action, table_name, record_id, 
            old_values, new_values, created_at
        ) VALUES (
            auth.uid(),
            'role_change',
            'Users',
            NEW.whalesync_postgres_id,
            jsonb_build_object('old_role', OLD.role),
            jsonb_build_object('new_role', NEW.role),
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_user_role_changes
    AFTER UPDATE ON "Users"
    FOR EACH ROW
    EXECUTE FUNCTION audit_role_changes();

-- Create function to safely get user profile
CREATE OR REPLACE FUNCTION get_user_profile(p_auth_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT,
    current_project_id UUID,
    current_project_name TEXT,
    permissions JSONB
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.whalesync_postgres_id,
        u.fullname,
        u.email,
        u.role,
        u.currentproject,
        p.projectname,
        jsonb_build_object(
            'can_approve_timesheets', u.role IN ('Manager', 'Admin', 'Director', 'PM'),
            'can_manage_users', u.role IN ('Admin', 'Director'),
            'can_view_all_projects', u.role IN ('Manager', 'Admin', 'Director', 'PM'),
            'is_elevated', user_has_elevated_permissions(u.whalesync_postgres_id)
        ) as permissions
    FROM "Users" u
    LEFT JOIN "Projects" p ON u.currentproject = p.whalesync_postgres_id
    WHERE u.supabase_auth_id = p_auth_id
    OR u.whalesync_postgres_id = p_auth_id;
END;
$$;