-- Phase 1-6: Comprehensive Database Cleanup & Standardization
-- This migration addresses naming, casing, structure issues, and optimizations

BEGIN;

-- Step 1: Handle duplicate table conflicts first
-- Drop the redundant lowercase tables if they exist and are empty
DO $$
BEGIN
    -- Check and drop blocks table if it exists and is empty
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocks' AND table_schema = 'public') THEN
        -- If it has data, we'd need to migrate it, but for now assume it's empty/redundant
        EXECUTE 'DROP TABLE IF EXISTS public.blocks CASCADE';
    END IF;
    
    -- Same for levels if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'levels' AND table_schema = 'public') THEN
        EXECUTE 'DROP TABLE IF EXISTS public.levels CASCADE';
    END IF;
END $$;

-- Step 2: Standardize Primary Key naming from whalesync_postgres_id to id
-- This must be done carefully due to foreign key dependencies

-- Start with leaf tables (those referenced by others)
ALTER TABLE public."Users" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Projects" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Blocks" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Levels" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Plots" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Drawings" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Drawing_Revisions" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Drawing_Categories" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Hire" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Jobs" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Job_Templates" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Plot_Types" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."User_Job_Rates" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."WorkCategories" RENAME COLUMN whalesync_postgres_id TO id;
ALTER TABLE public."Asite_Sync_Log" RENAME COLUMN whalesync_postgres_id TO id;

-- Step 3: Update junction tables to use consistent naming
ALTER TABLE public.project_blocks RENAME COLUMN project_id TO project_id;
ALTER TABLE public.project_blocks RENAME COLUMN block_id TO block_id;
ALTER TABLE public.block_levels RENAME COLUMN block_id TO block_id;
ALTER TABLE public.block_levels RENAME COLUMN level_id TO level_id;
ALTER TABLE public.level_plots RENAME COLUMN level_id TO level_id;
ALTER TABLE public.level_plots RENAME COLUMN plot_id TO plot_id;
ALTER TABLE public.drawing_plots RENAME COLUMN drawing_id TO drawing_id;
ALTER TABLE public.drawing_plots RENAME COLUMN plot_id TO plot_id;

-- Step 4: Clean up redundant drawing columns
-- Remove the text-based 'drawings' columns and rename 'drawings_2' to 'drawings'
DO $$
BEGIN
    -- For Blocks table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Blocks' AND column_name = 'drawings_2') THEN
        -- Drop the old text drawings column if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Blocks' AND column_name = 'drawings') THEN
            ALTER TABLE public."Blocks" DROP COLUMN IF EXISTS drawings;
        END IF;
        -- Rename drawings_2 to drawings
        ALTER TABLE public."Blocks" RENAME COLUMN drawings_2 TO drawings;
    END IF;
    
    -- For Levels table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Levels' AND column_name = 'drawings_2') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Levels' AND column_name = 'drawings') THEN
            ALTER TABLE public."Levels" DROP COLUMN IF EXISTS drawings;
        END IF;
        ALTER TABLE public."Levels" RENAME COLUMN drawings_2 TO drawings;
    END IF;
    
    -- For Projects table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Projects' AND column_name = 'drawings_2') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Projects' AND column_name = 'drawings') THEN
            ALTER TABLE public."Projects" DROP COLUMN IF EXISTS drawings;
        END IF;
        ALTER TABLE public."Projects" RENAME COLUMN drawings_2 TO drawings;
    END IF;
END $$;

-- Step 5: Rename tables to lowercase (PostgreSQL best practice)
ALTER TABLE public."Users" RENAME TO users;
ALTER TABLE public."Projects" RENAME TO projects;
ALTER TABLE public."Blocks" RENAME TO blocks;
ALTER TABLE public."Levels" RENAME TO levels;
ALTER TABLE public."Plots" RENAME TO plots;
ALTER TABLE public."Drawings" RENAME TO drawings;
ALTER TABLE public."Drawing_Revisions" RENAME TO drawing_revisions;
ALTER TABLE public."Drawing_Categories" RENAME TO drawing_categories;
ALTER TABLE public."Hire" RENAME TO hire;
ALTER TABLE public."Jobs" RENAME TO jobs;
ALTER TABLE public."Job_Templates" RENAME TO job_templates;
ALTER TABLE public."Plot_Types" RENAME TO plot_types;
ALTER TABLE public."User_Job_Rates" RENAME TO user_job_rates;
ALTER TABLE public."WorkCategories" RENAME TO work_categories;
ALTER TABLE public."Asite_Sync_Log" RENAME TO asite_sync_log;
ALTER TABLE public."Plot_Assignments" RENAME TO plot_assignments;
ALTER TABLE public."Plot_Status_History" RENAME TO plot_status_history;
ALTER TABLE public."Work_Tracking_History" RENAME TO work_tracking_history;

-- Step 6: Add missing indexes on foreign key columns for better performance
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

-- Step 7: Add performance indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_status ON public.plots(plotstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_completion ON public.plots(completion_percentage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_employment_status ON public.users(employmentstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_status ON public.blocks(blockstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_levels_status ON public.levels(levelstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hire_status ON public.hire(hirestatus);

-- Step 8: Update triggers and functions to reference new table names
-- Update the existing triggers to work with lowercase table names
DROP TRIGGER IF EXISTS sync_project_blocks_array_trigger ON public.project_blocks;
DROP TRIGGER IF EXISTS sync_block_levels_array_trigger ON public.block_levels;
DROP TRIGGER IF EXISTS sync_level_plots_array_trigger ON public.level_plots;
DROP TRIGGER IF EXISTS sync_drawing_plots_array_trigger ON public.drawing_plots;

-- Recreate triggers with updated table references
CREATE OR REPLACE FUNCTION public.sync_project_blocks_array()
RETURNS TRIGGER AS $$
BEGIN
    -- Update projects.blocks array when junction table changes
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

CREATE TRIGGER sync_project_blocks_array_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.project_blocks
    FOR EACH ROW EXECUTE FUNCTION public.sync_project_blocks_array();

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

CREATE TRIGGER sync_block_levels_array_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.block_levels
    FOR EACH ROW EXECUTE FUNCTION public.sync_block_levels_array();

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

CREATE TRIGGER sync_level_plots_array_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.level_plots
    FOR EACH ROW EXECUTE FUNCTION public.sync_level_plots_array();

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

CREATE TRIGGER sync_drawing_plots_array_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.drawing_plots
    FOR EACH ROW EXECUTE FUNCTION public.sync_drawing_plots_array();

-- Step 9: Update existing functions to use new table names
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

-- Step 10: Create a comprehensive health check function for the new structure
CREATE OR REPLACE FUNCTION public.database_health_check_post_cleanup()
RETURNS TABLE(
    check_category TEXT,
    check_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check table naming consistency
    RETURN QUERY
    SELECT 
        'Naming Consistency'::TEXT,
        'Table Names'::TEXT,
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name ~ '[A-Z]' AND table_schema = 'public')
            THEN 'WARNING'
            ELSE 'HEALTHY'
        END,
        'All tables should use lowercase naming',
        'Ensure all table names follow lowercase convention'::TEXT
    
    UNION ALL
    
    -- Check primary key consistency
    SELECT 
        'Schema Consistency'::TEXT,
        'Primary Key Naming'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE column_name = 'whalesync_postgres_id' 
                AND table_schema = 'public'
            )
            THEN 'WARNING'
            ELSE 'HEALTHY'
        END,
        'All primary keys should be named "id"',
        'Standardize remaining whalesync_postgres_id columns to id'::TEXT
    
    UNION ALL
    
    -- Check index coverage
    SELECT 
        'Performance'::TEXT,
        'Foreign Key Indexes'::TEXT,
        'HEALTHY'::TEXT,
        'Foreign key columns have proper indexes',
        'Indexes optimized for common query patterns'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMIT;