-- Phase 2: Core Hierarchy Relationships (Project → Block → Level → Plot)

-- Step 1: Add direct foreign key constraints for the hierarchy
-- Clean up any invalid references first
UPDATE public."Blocks" SET project = NULL WHERE project IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Projects" WHERE whalesync_postgres_id = "Blocks".project);

UPDATE public."Levels" SET block = NULL WHERE block IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Blocks" WHERE whalesync_postgres_id = "Levels".block);

UPDATE public."Plots" SET level = NULL WHERE level IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Levels" WHERE whalesync_postgres_id = "Plots".level);

-- Add the core hierarchy foreign keys
ALTER TABLE public."Blocks" 
ADD CONSTRAINT blocks_project_fkey 
FOREIGN KEY (project) REFERENCES public."Projects"(whalesync_postgres_id) 
ON DELETE CASCADE;

ALTER TABLE public."Levels" 
ADD CONSTRAINT levels_block_fkey 
FOREIGN KEY (block) REFERENCES public."Blocks"(whalesync_postgres_id) 
ON DELETE CASCADE;

ALTER TABLE public."Plots" 
ADD CONSTRAINT plots_level_fkey 
FOREIGN KEY (level) REFERENCES public."Levels"(whalesync_postgres_id) 
ON DELETE CASCADE;

-- Step 2: Create junction tables for many-to-many relationships
-- Project-Blocks junction table
CREATE TABLE IF NOT EXISTS public.project_blocks (
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES public."Blocks"(whalesync_postgres_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (project_id, block_id)
);

-- Block-Levels junction table  
CREATE TABLE IF NOT EXISTS public.block_levels (
    block_id UUID NOT NULL REFERENCES public."Blocks"(whalesync_postgres_id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES public."Levels"(whalesync_postgres_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (block_id, level_id)
);

-- Level-Plots junction table
CREATE TABLE IF NOT EXISTS public.level_plots (
    level_id UUID NOT NULL REFERENCES public."Levels"(whalesync_postgres_id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES public."Plots"(whalesync_postgres_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (level_id, plot_id)
);

-- Step 3: Populate junction tables from existing array data and direct relationships
-- Populate project_blocks from Projects.blocks arrays
INSERT INTO public.project_blocks (project_id, block_id)
SELECT p.whalesync_postgres_id, unnest(p.blocks)
FROM public."Projects" p
WHERE p.blocks IS NOT NULL AND array_length(p.blocks, 1) > 0
ON CONFLICT (project_id, block_id) DO NOTHING;

-- Also populate from Blocks.project direct relationships
INSERT INTO public.project_blocks (project_id, block_id)
SELECT b.project, b.whalesync_postgres_id
FROM public."Blocks" b
WHERE b.project IS NOT NULL
ON CONFLICT (project_id, block_id) DO NOTHING;

-- Populate block_levels from Blocks.levels arrays
INSERT INTO public.block_levels (block_id, level_id)
SELECT b.whalesync_postgres_id, unnest(b.levels)
FROM public."Blocks" b
WHERE b.levels IS NOT NULL AND array_length(b.levels, 1) > 0
ON CONFLICT (block_id, level_id) DO NOTHING;

-- Also populate from Levels.block direct relationships
INSERT INTO public.block_levels (block_id, level_id)
SELECT l.block, l.whalesync_postgres_id
FROM public."Levels" l
WHERE l.block IS NOT NULL
ON CONFLICT (block_id, level_id) DO NOTHING;

-- Populate level_plots from Levels.plots arrays
INSERT INTO public.level_plots (level_id, plot_id)
SELECT l.whalesync_postgres_id, unnest(l.plots)
FROM public."Levels" l
WHERE l.plots IS NOT NULL AND array_length(l.plots, 1) > 0
ON CONFLICT (level_id, plot_id) DO NOTHING;

-- Also populate from Plots.level direct relationships
INSERT INTO public.level_plots (level_id, plot_id)
SELECT p.level, p.whalesync_postgres_id
FROM public."Plots" p
WHERE p.level IS NOT NULL
ON CONFLICT (level_id, plot_id) DO NOTHING;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_blocks_project ON public.project_blocks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_blocks_block ON public.project_blocks(block_id);

CREATE INDEX IF NOT EXISTS idx_block_levels_block ON public.block_levels(block_id);
CREATE INDEX IF NOT EXISTS idx_block_levels_level ON public.block_levels(level_id);

CREATE INDEX IF NOT EXISTS idx_level_plots_level ON public.level_plots(level_id);
CREATE INDEX IF NOT EXISTS idx_level_plots_plot ON public.level_plots(plot_id);

-- Step 5: Create triggers to keep arrays in sync with junction tables (optional denormalization)
CREATE OR REPLACE FUNCTION public.sync_project_blocks_array()
RETURNS TRIGGER AS $$
BEGIN
    -- Update Projects.blocks array when junction table changes
    UPDATE public."Projects" 
    SET blocks = (
        SELECT array_agg(pb.block_id ORDER BY pb.created_at)
        FROM public.project_blocks pb
        WHERE pb.project_id = COALESCE(NEW.project_id, OLD.project_id)
    )
    WHERE whalesync_postgres_id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER sync_project_blocks_array_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.project_blocks
    FOR EACH ROW EXECUTE FUNCTION public.sync_project_blocks_array();

CREATE OR REPLACE FUNCTION public.sync_block_levels_array()
RETURNS TRIGGER AS $$
BEGIN
    -- Update Blocks.levels array when junction table changes
    UPDATE public."Blocks"
    SET levels = (
        SELECT array_agg(bl.level_id ORDER BY bl.created_at)
        FROM public.block_levels bl
        WHERE bl.block_id = COALESCE(NEW.block_id, OLD.block_id)
    )
    WHERE whalesync_postgres_id = COALESCE(NEW.block_id, OLD.block_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER sync_block_levels_array_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.block_levels
    FOR EACH ROW EXECUTE FUNCTION public.sync_block_levels_array();

CREATE OR REPLACE FUNCTION public.sync_level_plots_array()
RETURNS TRIGGER AS $$
BEGIN
    -- Update Levels.plots array when junction table changes  
    UPDATE public."Levels"
    SET plots = (
        SELECT array_agg(lp.plot_id ORDER BY lp.created_at)
        FROM public.level_plots lp
        WHERE lp.level_id = COALESCE(NEW.level_id, OLD.level_id)
    )
    WHERE whalesync_postgres_id = COALESCE(NEW.level_id, OLD.level_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER sync_level_plots_array_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.level_plots
    FOR EACH ROW EXECUTE FUNCTION public.sync_level_plots_array();