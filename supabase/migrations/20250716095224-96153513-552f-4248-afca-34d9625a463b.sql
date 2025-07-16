-- Fix one-to-many relationship schema issues
-- Phase 1: Drop problematic foreign key constraints that create circular dependencies

-- Drop foreign keys that prevent proper one-to-many relationships
ALTER TABLE "Blocks" DROP CONSTRAINT IF EXISTS "blocks_levels_foreign";
ALTER TABLE "Levels" DROP CONSTRAINT IF EXISTS "levels_plots_foreign";
ALTER TABLE "Drawings" DROP CONSTRAINT IF EXISTS "drawings_plotscovered_foreign";

-- Phase 2: Convert single UUID columns to UUID arrays for proper one-to-many relationships

-- Projects can have multiple blocks
ALTER TABLE "Projects" ALTER COLUMN blocks TYPE uuid[] USING CASE 
    WHEN blocks IS NOT NULL THEN ARRAY[blocks] 
    ELSE NULL 
END;

-- Blocks can have multiple levels
ALTER TABLE "Blocks" ALTER COLUMN levels TYPE uuid[] USING CASE 
    WHEN levels IS NOT NULL THEN ARRAY[levels] 
    ELSE NULL 
END;

-- Levels can have multiple plots
ALTER TABLE "Levels" ALTER COLUMN plots TYPE uuid[] USING CASE 
    WHEN plots IS NOT NULL THEN ARRAY[plots] 
    ELSE NULL 
END;

-- Drawings can cover multiple plots
ALTER TABLE "Drawings" ALTER COLUMN plotscovered TYPE uuid[] USING CASE 
    WHEN plotscovered IS NOT NULL THEN ARRAY[plotscovered] 
    ELSE NULL 
END;

-- Phase 3: Add proper constraints and indexes for array integrity

-- Add check constraints to ensure array elements are valid UUIDs
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

-- Phase 4: Create helper functions for maintaining referential integrity

-- Function to validate that UUIDs in arrays exist in target tables
CREATE OR REPLACE FUNCTION validate_uuid_array_references()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate Projects.blocks references
    IF TG_TABLE_NAME = 'Projects' AND NEW.blocks IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM unnest(NEW.blocks) AS block_id
            WHERE block_id NOT IN (SELECT whalesync_postgres_id FROM "Blocks")
        ) THEN
            RAISE EXCEPTION 'Invalid block reference in Projects.blocks array';
        END IF;
    END IF;
    
    -- Validate Blocks.levels references
    IF TG_TABLE_NAME = 'Blocks' AND NEW.levels IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM unnest(NEW.levels) AS level_id
            WHERE level_id NOT IN (SELECT whalesync_postgres_id FROM "Levels")
        ) THEN
            RAISE EXCEPTION 'Invalid level reference in Blocks.levels array';
        END IF;
    END IF;
    
    -- Validate Levels.plots references
    IF TG_TABLE_NAME = 'Levels' AND NEW.plots IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM unnest(NEW.plots) AS plot_id
            WHERE plot_id NOT IN (SELECT whalesync_postgres_id FROM "Plots")
        ) THEN
            RAISE EXCEPTION 'Invalid plot reference in Levels.plots array';
        END IF;
    END IF;
    
    -- Validate Drawings.plotscovered references
    IF TG_TABLE_NAME = 'Drawings' AND NEW.plotscovered IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM unnest(NEW.plotscovered) AS plot_id
            WHERE plot_id NOT IN (SELECT whalesync_postgres_id FROM "Plots")
        ) THEN
            RAISE EXCEPTION 'Invalid plot reference in Drawings.plotscovered array';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain referential integrity
CREATE TRIGGER validate_projects_references
    BEFORE INSERT OR UPDATE ON "Projects"
    FOR EACH ROW EXECUTE FUNCTION validate_uuid_array_references();

CREATE TRIGGER validate_blocks_references
    BEFORE INSERT OR UPDATE ON "Blocks"
    FOR EACH ROW EXECUTE FUNCTION validate_uuid_array_references();

CREATE TRIGGER validate_levels_references
    BEFORE INSERT OR UPDATE ON "Levels"
    FOR EACH ROW EXECUTE FUNCTION validate_uuid_array_references();

CREATE TRIGGER validate_drawings_references
    BEFORE INSERT OR UPDATE ON "Drawings"
    FOR EACH ROW EXECUTE FUNCTION validate_uuid_array_references();

-- Phase 5: Update count calculation functions

-- Function to calculate accurate counts based on array relationships
CREATE OR REPLACE FUNCTION update_hierarchical_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update totalplots in Projects based on actual plot assignments
    UPDATE "Projects" SET totalplots = (
        SELECT COUNT(DISTINCT p.whalesync_postgres_id)
        FROM "Plots" p
        JOIN "Levels" l ON p.whalesync_postgres_id = ANY(l.plots)
        JOIN "Blocks" b ON l.whalesync_postgres_id = ANY(b.levels)
        WHERE b.whalesync_postgres_id = ANY("Projects".blocks)
        AND "Projects".whalesync_postgres_id = NEW.whalesync_postgres_id
    ) WHERE whalesync_postgres_id = NEW.whalesync_postgres_id;
    
    -- Update plotsonlevel in Levels based on actual plot assignments
    IF TG_TABLE_NAME = 'Levels' THEN
        NEW.plotsonlevel = CASE 
            WHEN NEW.plots IS NOT NULL THEN array_length(NEW.plots, 1)
            ELSE 0
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for count updates
CREATE TRIGGER update_project_counts
    AFTER INSERT OR UPDATE ON "Projects"
    FOR EACH ROW EXECUTE FUNCTION update_hierarchical_counts();

CREATE TRIGGER update_level_counts
    BEFORE INSERT OR UPDATE ON "Levels"
    FOR EACH ROW EXECUTE FUNCTION update_hierarchical_counts();