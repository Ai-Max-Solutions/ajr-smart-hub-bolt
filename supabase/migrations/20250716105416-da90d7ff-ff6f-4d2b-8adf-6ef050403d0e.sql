-- Phase 3: Drawing & Document Relationships

-- Step 1: Clean up invalid references first
UPDATE public."Drawing_Revisions" SET drawing = NULL WHERE drawing IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Drawings" WHERE whalesync_postgres_id = "Drawing_Revisions".drawing);

UPDATE public."Drawings" SET project = NULL WHERE project IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Projects" WHERE whalesync_postgres_id = "Drawings".project);

UPDATE public."Drawings" SET block = NULL WHERE block IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Blocks" WHERE whalesync_postgres_id = "Drawings".block);

UPDATE public."Drawings" SET level = NULL WHERE level IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Levels" WHERE whalesync_postgres_id = "Drawings".level);

-- Step 2: Add drawing foreign key constraints
ALTER TABLE public."Drawing_Revisions" 
ADD CONSTRAINT drawing_revisions_drawing_fkey 
FOREIGN KEY (drawing) REFERENCES public."Drawings"(whalesync_postgres_id) 
ON DELETE CASCADE;

ALTER TABLE public."Drawings" 
ADD CONSTRAINT drawings_project_fkey 
FOREIGN KEY (project) REFERENCES public."Projects"(whalesync_postgres_id) 
ON DELETE CASCADE;

ALTER TABLE public."Drawings" 
ADD CONSTRAINT drawings_block_fkey 
FOREIGN KEY (block) REFERENCES public."Blocks"(whalesync_postgres_id) 
ON DELETE SET NULL;

ALTER TABLE public."Drawings" 
ADD CONSTRAINT drawings_level_fkey 
FOREIGN KEY (level) REFERENCES public."Levels"(whalesync_postgres_id) 
ON DELETE SET NULL;

-- Step 3: Create Drawing-Plot junction table for plotscovered array
CREATE TABLE IF NOT EXISTS public.drawing_plots (
    drawing_id UUID NOT NULL REFERENCES public."Drawings"(whalesync_postgres_id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES public."Plots"(whalesync_postgres_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (drawing_id, plot_id)
);

-- Populate drawing_plots from existing plotscovered arrays
INSERT INTO public.drawing_plots (drawing_id, plot_id)
SELECT d.whalesync_postgres_id, unnest(d.plotscovered)
FROM public."Drawings" d
WHERE d.plotscovered IS NOT NULL AND array_length(d.plotscovered, 1) > 0
ON CONFLICT (drawing_id, plot_id) DO NOTHING;

-- Step 4: Create indexes for drawing relationships
CREATE INDEX IF NOT EXISTS idx_drawing_revisions_drawing ON public."Drawing_Revisions"(drawing);
CREATE INDEX IF NOT EXISTS idx_drawings_project ON public."Drawings"(project);
CREATE INDEX IF NOT EXISTS idx_drawings_block ON public."Drawings"(block);
CREATE INDEX IF NOT EXISTS idx_drawings_level ON public."Drawings"(level);
CREATE INDEX IF NOT EXISTS idx_drawing_plots_drawing ON public.drawing_plots(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_plots_plot ON public.drawing_plots(plot_id);

-- Step 5: Create trigger to sync plotscovered array
CREATE OR REPLACE FUNCTION public.sync_drawing_plots_array()
RETURNS TRIGGER AS $$
BEGIN
    -- Update Drawings.plotscovered array when junction table changes
    UPDATE public."Drawings"
    SET plotscovered = (
        SELECT array_agg(dp.plot_id ORDER BY dp.created_at)
        FROM public.drawing_plots dp
        WHERE dp.drawing_id = COALESCE(NEW.drawing_id, OLD.drawing_id)
    )
    WHERE whalesync_postgres_id = COALESCE(NEW.drawing_id, OLD.drawing_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER sync_drawing_plots_array_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.drawing_plots
    FOR EACH ROW EXECUTE FUNCTION public.sync_drawing_plots_array();

-- Step 6: Add missing foreign keys for Drawing Categories (if needed)
-- First check if Drawing_Categories has any records to reference
DO $$
BEGIN
    -- Add FK to Drawing_Categories if the relationship exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Drawings' AND column_name = 'category' 
        AND table_schema = 'public'
    ) THEN
        -- Clean invalid category references
        EXECUTE 'UPDATE public."Drawings" SET category = NULL WHERE category IS NOT NULL 
                 AND NOT EXISTS (SELECT 1 FROM public."Drawing_Categories" WHERE whalesync_postgres_id = "Drawings".category)';
        
        -- Add FK constraint
        EXECUTE 'ALTER TABLE public."Drawings" 
                 ADD CONSTRAINT drawings_category_fkey 
                 FOREIGN KEY (category) REFERENCES public."Drawing_Categories"(whalesync_postgres_id) 
                 ON DELETE SET NULL';
    END IF;
END $$;