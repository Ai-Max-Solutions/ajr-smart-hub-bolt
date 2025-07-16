-- PHASE 1: CRITICAL SECURITY FIXES
-- Fix the most urgent security vulnerabilities identified by the linter

-- First, enable RLS on tables that don't have it enabled
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plot_Types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkCategories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Jobs" ENABLE ROW LEVEL SECURITY;

-- Create essential RLS policies for tables that have RLS enabled but no policies

-- Blocks table - only project team members and admins can access
CREATE POLICY "Project team can view blocks" ON "Blocks"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        JOIN "Projects" p ON u.currentproject = p.whalesync_postgres_id
        WHERE u.supabase_auth_id = auth.uid()
        AND p.whalesync_postgres_id = "Blocks".project
    ) OR EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
    )
);

CREATE POLICY "Admins can manage blocks" ON "Blocks"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

-- Levels table - same pattern as blocks
CREATE POLICY "Project team can view levels" ON "Levels"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        JOIN "Projects" p ON u.currentproject = p.whalesync_postgres_id
        JOIN "Blocks" b ON b.project = p.whalesync_postgres_id
        WHERE u.supabase_auth_id = auth.uid()
        AND "Levels".block = b.whalesync_postgres_id
    ) OR EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
    )
);

CREATE POLICY "Admins can manage levels" ON "Levels"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

-- Plots table - project team and assigned users
CREATE POLICY "Project team and assigned users can view plots" ON "Plots"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        JOIN "Projects" p ON u.currentproject = p.whalesync_postgres_id
        JOIN "Blocks" b ON b.project = p.whalesync_postgres_id
        JOIN "Levels" l ON l.block = b.whalesync_postgres_id
        WHERE u.supabase_auth_id = auth.uid()
        AND "Plots".level = l.whalesync_postgres_id
    ) OR EXISTS (
        SELECT 1 FROM "Plot_Assignments" pa
        JOIN "Users" u ON u.whalesync_postgres_id = pa.user_id
        WHERE u.supabase_auth_id = auth.uid()
        AND pa.plot_id = "Plots".whalesync_postgres_id
    ) OR EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
    )
);

CREATE POLICY "Assigned users can update plot progress" ON "Plots"
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM "Plot_Assignments" pa
        JOIN "Users" u ON u.whalesync_postgres_id = pa.user_id
        WHERE u.supabase_auth_id = auth.uid()
        AND pa.plot_id = "Plots".whalesync_postgres_id
    ) OR EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

-- Hire table - project access control
CREATE POLICY "Project team can view hire items" ON "Hire"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        JOIN "Projects" p ON u.currentproject = p.whalesync_postgres_id
        WHERE u.supabase_auth_id = auth.uid()
        AND "Hire".project = p.whalesync_postgres_id
    ) OR EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
    )
);

CREATE POLICY "Admins can manage hire items" ON "Hire"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

-- Plot_Types table - readable by all authenticated users, manageable by admins
CREATE POLICY "Authenticated users can view plot types" ON "Plot_Types"
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage plot types" ON "Plot_Types"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller')
    )
);

-- WorkCategories table - same pattern
CREATE POLICY "Authenticated users can view work categories" ON "WorkCategories"
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage work categories" ON "WorkCategories"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller')
    )
);

-- Jobs table - same pattern
CREATE POLICY "Authenticated users can view jobs" ON "Jobs"
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage jobs" ON "Jobs"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller')
    )
);

-- Job_Templates table - read access for authenticated, manage for admins
CREATE POLICY "Authenticated users can view job templates" ON "Job_Templates"
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage job templates" ON "Job_Templates"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller')
    )
);

-- User_Job_Rates table - users can view their own rates, admins can manage all
CREATE POLICY "Users can view own job rates" ON "User_Job_Rates"
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND whalesync_postgres_id = "User_Job_Rates".user
    ) OR EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

CREATE POLICY "Admins can manage job rates" ON "User_Job_Rates"
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller')
    )
);

-- Fix function security by updating search paths for critical functions
-- This addresses the 100+ security warnings about mutable search paths

-- Update existing functions to have secure search paths
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- Insert into Users table when a new auth user is created
  INSERT INTO public."Users" (
    whalesync_postgres_id,
    supabase_auth_id,
    email,
    firstname,
    lastname,
    fullname,
    role,
    system_role,
    employmentstatus,
    auth_provider,
    last_sign_in
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name', 
             TRIM(COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                  COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', '')),
             split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Operative'),
    COALESCE(NEW.raw_user_meta_data->>'system_role', 'Worker'),
    'Active',
    'supabase',
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    supabase_auth_id = EXCLUDED.supabase_auth_id,
    last_sign_in = EXCLUDED.last_sign_in,
    firstname = COALESCE(EXCLUDED.firstname, "Users".firstname),
    lastname = COALESCE(EXCLUDED.lastname, "Users".lastname),
    fullname = COALESCE(EXCLUDED.fullname, "Users".fullname);
  
  RETURN NEW;
END;
$$;

-- Update the auto-count functions we just created to have secure search paths
CREATE OR REPLACE FUNCTION update_level_plot_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Update plotsonlevel based on actual plots array length
    IF NEW.plots IS NOT NULL THEN
        NEW.plotsonlevel = array_length(NEW.plots, 1);
    ELSE
        NEW.plotsonlevel = 0;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_project_total_plots()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    project_record RECORD;
    total_plots_count INTEGER;
BEGIN
    -- For each affected project, recalculate total plots
    FOR project_record IN 
        SELECT DISTINCT p.whalesync_postgres_id 
        FROM public."Projects" p
        WHERE p.blocks IS NOT NULL 
        AND (
            (TG_TABLE_NAME = 'Blocks' AND NEW.whalesync_postgres_id = ANY(p.blocks)) OR
            (TG_TABLE_NAME = 'Levels' AND EXISTS (
                SELECT 1 FROM public."Blocks" b 
                WHERE b.whalesync_postgres_id = ANY(p.blocks) 
                AND b.levels IS NOT NULL 
                AND NEW.whalesync_postgres_id = ANY(b.levels)
            ))
        )
    LOOP
        -- Calculate total plots across all blocks and levels for this project
        SELECT COALESCE(SUM(array_length(l.plots, 1)), 0) INTO total_plots_count
        FROM public."Projects" p
        JOIN public."Blocks" b ON b.whalesync_postgres_id = ANY(p.blocks)
        LEFT JOIN public."Levels" l ON l.whalesync_postgres_id = ANY(b.levels)
        WHERE p.whalesync_postgres_id = project_record.whalesync_postgres_id
        AND l.plots IS NOT NULL;
        
        -- Update the project's total plots count
        UPDATE public."Projects" 
        SET totalplots = total_plots_count
        WHERE whalesync_postgres_id = project_record.whalesync_postgres_id;
    END LOOP;
    
    RETURN NEW;
END;
$$;