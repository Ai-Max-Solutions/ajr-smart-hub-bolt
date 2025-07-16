-- Phase 3: Add constraints, indexes, and helper functions for array integrity

-- Add check constraints to ensure array elements are valid
ALTER TABLE "Projects" ADD CONSTRAINT check_blocks_array_valid 
    CHECK (blocks IS NULL OR array_length(blocks, 1) > 0);

ALTER TABLE "Blocks" ADD CONSTRAINT check_levels_array_valid 
    CHECK (levels IS NULL OR array_length(levels, 1) > 0);

ALTER TABLE "Levels" ADD CONSTRAINT check_plots_array_valid 
    CHECK (plots IS NULL OR array_length(plots, 1) > 0);

ALTER TABLE "Drawings" ADD CONSTRAINT check_plotscovered_array_valid 
    CHECK (plotscovered IS NULL OR array_length(plotscovered, 1) > 0);

-- Add GIN indexes for efficient array operations
CREATE INDEX IF NOT EXISTS idx_projects_blocks_gin ON "Projects" USING GIN (blocks);
CREATE INDEX IF NOT EXISTS idx_blocks_levels_gin ON "Blocks" USING GIN (levels);
CREATE INDEX IF NOT EXISTS idx_levels_plots_gin ON "Levels" USING GIN (plots);
CREATE INDEX IF NOT EXISTS idx_drawings_plotscovered_gin ON "Drawings" USING GIN (plotscovered);

-- Create helper function to automatically update plot count when levels change
CREATE OR REPLACE FUNCTION update_level_plot_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update plotsonlevel based on actual plots array length
    IF NEW.plots IS NOT NULL THEN
        NEW.plotsonlevel = array_length(NEW.plots, 1);
    ELSE
        NEW.plotsonlevel = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update plot counts
CREATE TRIGGER update_levels_plot_count_trigger
    BEFORE INSERT OR UPDATE ON "Levels"
    FOR EACH ROW EXECUTE FUNCTION update_level_plot_count();

-- Create helper function to update project total plots count
CREATE OR REPLACE FUNCTION update_project_total_plots()
RETURNS TRIGGER AS $$
DECLARE
    project_record RECORD;
    total_plots_count INTEGER;
BEGIN
    -- For each affected project, recalculate total plots
    FOR project_record IN 
        SELECT DISTINCT p.whalesync_postgres_id 
        FROM "Projects" p
        WHERE p.blocks IS NOT NULL 
        AND (
            (TG_TABLE_NAME = 'Blocks' AND NEW.whalesync_postgres_id = ANY(p.blocks)) OR
            (TG_TABLE_NAME = 'Levels' AND EXISTS (
                SELECT 1 FROM "Blocks" b 
                WHERE b.whalesync_postgres_id = ANY(p.blocks) 
                AND b.levels IS NOT NULL 
                AND NEW.whalesync_postgres_id = ANY(b.levels)
            ))
        )
    LOOP
        -- Calculate total plots across all blocks and levels for this project
        SELECT COALESCE(SUM(array_length(l.plots, 1)), 0) INTO total_plots_count
        FROM "Projects" p
        JOIN "Blocks" b ON b.whalesync_postgres_id = ANY(p.blocks)
        LEFT JOIN "Levels" l ON l.whalesync_postgres_id = ANY(b.levels)
        WHERE p.whalesync_postgres_id = project_record.whalesync_postgres_id
        AND l.plots IS NOT NULL;
        
        -- Update the project's total plots count
        UPDATE "Projects" 
        SET totalplots = total_plots_count
        WHERE whalesync_postgres_id = project_record.whalesync_postgres_id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain project plot counts
CREATE TRIGGER update_project_plots_from_blocks
    AFTER INSERT OR UPDATE ON "Blocks"
    FOR EACH ROW EXECUTE FUNCTION update_project_total_plots();

CREATE TRIGGER update_project_plots_from_levels
    AFTER INSERT OR UPDATE ON "Levels"
    FOR EACH ROW EXECUTE FUNCTION update_project_total_plots();