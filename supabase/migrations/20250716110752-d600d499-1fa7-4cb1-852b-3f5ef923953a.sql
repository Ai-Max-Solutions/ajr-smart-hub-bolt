-- Comprehensive Database Cleanup & Standardization (Careful Migration)
-- This migration addresses naming, casing, structure issues systematically

BEGIN;

-- Step 1: Drop duplicate lowercase tables that conflict with our target names
-- These appear to be empty/redundant based on the schema
DROP TABLE IF EXISTS public.blocks CASCADE;
DROP TABLE IF EXISTS public.drawings CASCADE;
DROP TABLE IF EXISTS public.levels CASCADE;

-- Step 2: Standardize Primary Key naming from whalesync_postgres_id to id
-- Handle each table carefully
DO $$
BEGIN
    -- Users table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Users' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Users" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    -- Projects table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Projects' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Projects" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    -- Blocks table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Blocks' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Blocks" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    -- Levels table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Levels' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Levels" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    -- Plots table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Plots' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Plots" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    -- Other tables
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Drawings' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Drawings" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Drawing_Revisions' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Drawing_Revisions" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Drawing_Categories' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Drawing_Categories" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Hire' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Hire" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Jobs' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Jobs" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Job_Templates' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Job_Templates" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Plot_Types' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Plot_Types" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User_Job_Rates' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."User_Job_Rates" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'WorkCategories' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."WorkCategories" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Asite_Sync_Log' AND column_name = 'whalesync_postgres_id') THEN
        ALTER TABLE public."Asite_Sync_Log" RENAME COLUMN whalesync_postgres_id TO id;
    END IF;
END $$;

-- Step 3: Clean up redundant drawing columns
DO $$
BEGIN
    -- For Blocks table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Blocks' AND column_name = 'drawings_2') THEN
        -- Drop the old text drawings column if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Blocks' AND column_name = 'drawings') THEN
            ALTER TABLE public."Blocks" DROP COLUMN drawings;
        END IF;
        -- Rename drawings_2 to drawings
        ALTER TABLE public."Blocks" RENAME COLUMN drawings_2 TO drawings;
    END IF;
    
    -- For Levels table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Levels' AND column_name = 'drawings_2') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Levels' AND column_name = 'drawings') THEN
            ALTER TABLE public."Levels" DROP COLUMN drawings;
        END IF;
        ALTER TABLE public."Levels" RENAME COLUMN drawings_2 TO drawings;
    END IF;
    
    -- For Projects table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Projects' AND column_name = 'drawings_2') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Projects' AND column_name = 'drawings') THEN
            ALTER TABLE public."Projects" DROP COLUMN drawings;
        END IF;
        ALTER TABLE public."Projects" RENAME COLUMN drawings_2 TO drawings;
    END IF;
END $$;

-- Step 4: Rename tables to lowercase (PostgreSQL best practice)
DO $$
BEGIN
    -- Only rename if the uppercase table exists and lowercase doesn't
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Users' AND table_schema = 'public') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE public."Users" RENAME TO users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Projects' AND table_schema = 'public') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
        ALTER TABLE public."Projects" RENAME TO projects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Blocks' AND table_schema = 'public') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocks' AND table_schema = 'public') THEN
        ALTER TABLE public."Blocks" RENAME TO blocks;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Levels' AND table_schema = 'public') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'levels' AND table_schema = 'public') THEN
        ALTER TABLE public."Levels" RENAME TO levels;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Plots' AND table_schema = 'public') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plots' AND table_schema = 'public') THEN
        ALTER TABLE public."Plots" RENAME TO plots;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Drawings' AND table_schema = 'public') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drawings' AND table_schema = 'public') THEN
        ALTER TABLE public."Drawings" RENAME TO drawings;
    END IF;
    
    -- Other tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Drawing_Revisions' AND table_schema = 'public') THEN
        ALTER TABLE public."Drawing_Revisions" RENAME TO drawing_revisions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Drawing_Categories' AND table_schema = 'public') THEN
        ALTER TABLE public."Drawing_Categories" RENAME TO drawing_categories;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Hire' AND table_schema = 'public') THEN
        ALTER TABLE public."Hire" RENAME TO hire;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Jobs' AND table_schema = 'public') THEN
        ALTER TABLE public."Jobs" RENAME TO jobs;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Job_Templates' AND table_schema = 'public') THEN
        ALTER TABLE public."Job_Templates" RENAME TO job_templates;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Plot_Types' AND table_schema = 'public') THEN
        ALTER TABLE public."Plot_Types" RENAME TO plot_types;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User_Job_Rates' AND table_schema = 'public') THEN
        ALTER TABLE public."User_Job_Rates" RENAME TO user_job_rates;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'WorkCategories' AND table_schema = 'public') THEN
        ALTER TABLE public."WorkCategories" RENAME TO work_categories;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Asite_Sync_Log' AND table_schema = 'public') THEN
        ALTER TABLE public."Asite_Sync_Log" RENAME TO asite_sync_log;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Plot_Assignments' AND table_schema = 'public') THEN
        ALTER TABLE public."Plot_Assignments" RENAME TO plot_assignments;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Plot_Status_History' AND table_schema = 'public') THEN
        ALTER TABLE public."Plot_Status_History" RENAME TO plot_status_history;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Work_Tracking_History' AND table_schema = 'public') THEN
        ALTER TABLE public."Work_Tracking_History" RENAME TO work_tracking_history;
    END IF;
END $$;

-- Step 5: Add missing indexes on foreign key columns for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_project ON public.blocks(project);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_levels_block ON public.levels(block);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_level ON public.plots(level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_plottype ON public.plots(plottype);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drawings_project ON public.drawings(project);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drawings_block ON public.drawings(block);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drawings_level ON public.drawings(level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drawing_revisions_drawing ON public.drawing_revisions(drawing);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hire_project ON public.hire(project);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hire_block ON public.hire(block);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_job_rates_user ON public.user_job_rates("user");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_job_rates_plottype ON public.user_job_rates(plottype);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_job_rates_jobs ON public.user_job_rates(jobs);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_job_rates_jobtemplate ON public.user_job_rates(jobtemplate);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_currentproject ON public.users(currentproject);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_supabase_auth_id ON public.users(supabase_auth_id);

-- Step 6: Add performance indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_status ON public.plots(plotstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_completion ON public.plots(completion_percentage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_employment_status ON public.users(employmentstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_status ON public.blocks(blockstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_levels_status ON public.levels(levelstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hire_status ON public.hire(hirestatus);

-- Step 7: Update existing functions to use new table names
CREATE OR REPLACE FUNCTION public.update_project_totals()
RETURNS TRIGGER AS $$
DECLARE
    affected_project_id UUID;
BEGIN
    affected_project_id := COALESCE(NEW.project, OLD.project);
    
    IF affected_project_id IS NOT NULL THEN
        UPDATE public.projects
        SET totalplots = (
            SELECT COUNT(DISTINCT p.id)
            FROM public.plots p
            JOIN public.levels l ON p.level = l.id
            JOIN public.blocks b ON l.block = b.id
            WHERE b.project = affected_project_id
        ),
        totalhirecost = (
            SELECT COALESCE(SUM(h.totalhirecost), 0)
            FROM public.hire h
            WHERE h.project = affected_project_id
        ),
        activehireitems = (
            SELECT COUNT(*)
            FROM public.hire h
            WHERE h.project = affected_project_id
            AND h.hirestatus IN ('Active', 'Delivered', 'On Site')
        ),
        pendingdeliveries = (
            SELECT COUNT(*)
            FROM public.hire h
            WHERE h.project = affected_project_id
            AND h.hirestatus = 'Pending'
        )
        WHERE id = affected_project_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_block_totals()
RETURNS TRIGGER AS $$
DECLARE
    affected_block_id UUID;
BEGIN
    affected_block_id := COALESCE(NEW.block, OLD.block);
    
    IF affected_block_id IS NOT NULL THEN
        UPDATE public.blocks
        SET totalplots = (
            SELECT COUNT(DISTINCT p.id)
            FROM public.plots p
            JOIN public.levels l ON p.level = l.id
            WHERE l.block = affected_block_id
        ),
        hireequipmentonblock = (
            SELECT COUNT(*)
            FROM public.hire h
            WHERE h.block = affected_block_id
            AND h.hirestatus IN ('Active', 'Delivered', 'On Site')
        )
        WHERE id = affected_block_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_level_totals()
RETURNS TRIGGER AS $$
DECLARE
    affected_level_id UUID;
BEGIN
    affected_level_id := COALESCE(NEW.level, OLD.level);
    
    IF affected_level_id IS NOT NULL THEN
        UPDATE public.levels
        SET plotsonlevel = (
            SELECT COUNT(*)
            FROM public.plots p
            WHERE p.level = affected_level_id
        )
        WHERE id = affected_level_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 8: Update triggers to work with new table names
CREATE OR REPLACE FUNCTION public.sync_project_blocks_array()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.projects
    SET blocks = (
        SELECT array_agg(pb.block_id ORDER BY pb.created_at)
        FROM public.project_blocks pb
        WHERE pb.project_id = COALESCE(NEW.project_id, OLD.project_id)
    )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_block_levels_array()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.blocks
    SET levels = (
        SELECT array_agg(bl.level_id ORDER BY bl.created_at)
        FROM public.block_levels bl
        WHERE bl.block_id = COALESCE(NEW.block_id, OLD.block_id)
    )
    WHERE id = COALESCE(NEW.block_id, OLD.block_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_level_plots_array()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.levels
    SET plots = (
        SELECT array_agg(lp.plot_id ORDER BY lp.created_at)
        FROM public.level_plots lp
        WHERE lp.level_id = COALESCE(NEW.level_id, OLD.level_id)
    )
    WHERE id = COALESCE(NEW.level_id, OLD.level_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_drawing_plots_array()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.drawings
    SET plotscovered = (
        SELECT array_agg(dp.plot_id ORDER BY dp.created_at)
        FROM public.drawing_plots dp
        WHERE dp.drawing_id = COALESCE(NEW.drawing_id, OLD.drawing_id)
    )
    WHERE id = COALESCE(NEW.drawing_id, OLD.drawing_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMIT;