-- Update projects table to match new schema while preserving existing data
-- Keep existing columns: id, name, code, client, start_date, end_date, created_at, updated_at
-- Ensure code column has unique constraint but remains nullable

-- Add unique constraint to code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'projects_code_key' 
        AND conrelid = 'public.projects'::regclass
    ) THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_code_key UNIQUE (code);
    END IF;
END $$;

-- Update plots table to convert level from text to integer
-- First, create a backup of any non-numeric level values
CREATE TABLE IF NOT EXISTS public.plots_level_backup AS 
SELECT id, level as original_level 
FROM public.plots 
WHERE level IS NOT NULL AND level !~ '^[0-9]+$';

-- Convert level column to integer, handling non-numeric values
-- Step 1: Add new integer column
ALTER TABLE public.plots ADD COLUMN level_temp integer;

-- Step 2: Convert numeric text values to integers, set non-numeric to NULL
UPDATE public.plots 
SET level_temp = CASE 
    WHEN level ~ '^[0-9]+$' THEN level::integer
    ELSE NULL 
END;

-- Step 3: Drop old column and rename new column
ALTER TABLE public.plots DROP COLUMN level;
ALTER TABLE public.plots RENAME COLUMN level_temp TO level;

-- Add foreign key constraint to plots.project_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'plots_project_id_fkey' 
        AND conrelid = 'public.plots'::regclass
    ) THEN
        ALTER TABLE public.plots 
        ADD CONSTRAINT plots_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
END $$;