-- Targeted Database Cleanup - Handle existing conflicts
-- This migration addresses primary key naming and adds essential indexes

BEGIN;

-- Step 1: Only rename primary keys, leave table names as they are for now since we have conflicts
DO $$
BEGIN
    -- Only rename whalesync_postgres_id to id where it exists
    
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
    
    -- Other main tables
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

-- Step 2: Clean up redundant drawing columns
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

-- Step 3: Add essential missing indexes on foreign key columns
-- Using uppercase table names since we're not renaming them yet
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_project ON public."Blocks"(project);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_levels_block ON public."Levels"(block);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_level ON public."Plots"(level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_plottype ON public."Plots"(plottype);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drawings_project ON public."Drawings"(project);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drawings_block ON public."Drawings"(block);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drawings_level ON public."Drawings"(level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drawing_revisions_drawing ON public."Drawing_Revisions"(drawing);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hire_project ON public."Hire"(project);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hire_block ON public."Hire"(block);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_job_rates_user ON public."User_Job_Rates"("user");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_job_rates_plottype ON public."User_Job_Rates"(plottype);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_job_rates_jobs ON public."User_Job_Rates"(jobs);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_job_rates_jobtemplate ON public."User_Job_Rates"(jobtemplate);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_currentproject ON public."Users"(currentproject);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_supabase_auth_id ON public."Users"(supabase_auth_id);

-- Step 4: Add performance indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_status ON public."Plots"(plotstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plots_completion ON public."Plots"(completion_percentage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON public."Users"(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_employment_status ON public."Users"(employmentstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON public."Projects"(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocks_status ON public."Blocks"(blockstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_levels_status ON public."Levels"(levelstatus);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hire_status ON public."Hire"(hirestatus);

-- Step 5: Update existing functions to use 'id' instead of 'whalesync_postgres_id'
CREATE OR REPLACE FUNCTION public.update_project_totals()
RETURNS TRIGGER AS $$
DECLARE
    affected_project_id UUID;
BEGIN
    affected_project_id := COALESCE(NEW.project, OLD.project);
    
    IF affected_project_id IS NOT NULL THEN
        UPDATE public."Projects"
        SET totalplots = (
            SELECT COUNT(DISTINCT p.id)
            FROM public."Plots" p
            JOIN public."Levels" l ON p.level = l.id
            JOIN public."Blocks" b ON l.block = b.id
            WHERE b.project = affected_project_id
        ),
        totalhirecost = (
            SELECT COALESCE(SUM(h.totalhirecost), 0)
            FROM public."Hire" h
            WHERE h.project = affected_project_id
        ),
        activehireitems = (
            SELECT COUNT(*)
            FROM public."Hire" h
            WHERE h.project = affected_project_id
            AND h.hirestatus IN ('Active', 'Delivered', 'On Site')
        ),
        pendingdeliveries = (
            SELECT COUNT(*)
            FROM public."Hire" h
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
        UPDATE public."Blocks"
        SET totalplots = (
            SELECT COUNT(DISTINCT p.id)
            FROM public."Plots" p
            JOIN public."Levels" l ON p.level = l.id
            WHERE l.block = affected_block_id
        ),
        hireequipmentonblock = (
            SELECT COUNT(*)
            FROM public."Hire" h
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
        UPDATE public."Levels"
        SET plotsonlevel = (
            SELECT COUNT(*)
            FROM public."Plots" p
            WHERE p.level = affected_level_id
        )
        WHERE id = affected_level_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update triggers to work with new primary key naming
CREATE OR REPLACE FUNCTION public.sync_project_blocks_array()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public."Projects"
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
    UPDATE public."Blocks"
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
    UPDATE public."Levels"
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
    UPDATE public."Drawings"
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