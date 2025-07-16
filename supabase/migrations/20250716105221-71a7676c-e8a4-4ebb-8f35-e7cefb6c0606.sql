-- Phase 1: Data Integrity Foundation
-- First, let's audit current data and create validation functions

-- Create function to validate UUID array elements against a table
CREATE OR REPLACE FUNCTION public.validate_uuid_array_elements(
    uuid_array UUID[],
    target_table TEXT,
    target_column TEXT DEFAULT 'whalesync_postgres_id'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    element UUID;
    query_text TEXT;
    exists_count INTEGER;
BEGIN
    -- Return true for empty or null arrays
    IF uuid_array IS NULL OR array_length(uuid_array, 1) IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check each element in the array
    FOREACH element IN ARRAY uuid_array
    LOOP
        -- Build dynamic query to check existence
        query_text := format('SELECT COUNT(*) FROM %I WHERE %I = $1', target_table, target_column);
        
        EXECUTE query_text INTO exists_count USING element;
        
        -- If any element doesn't exist, return false
        IF exists_count = 0 THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$;

-- Create function to clean orphaned array elements
CREATE OR REPLACE FUNCTION public.clean_orphaned_array_elements(
    source_table TEXT,
    source_column TEXT,
    target_table TEXT,
    target_column TEXT DEFAULT 'whalesync_postgres_id'
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    update_query TEXT;
    rows_affected INTEGER := 0;
BEGIN
    -- Build update query to remove orphaned elements from arrays
    update_query := format(
        'UPDATE %I SET %I = (
            SELECT array_agg(elem) 
            FROM unnest(%I) AS elem 
            WHERE EXISTS (
                SELECT 1 FROM %I WHERE %I = elem
            )
        ) WHERE %I IS NOT NULL',
        source_table, source_column, source_column,
        target_table, target_column, source_column
    );
    
    EXECUTE update_query;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected;
END;
$$;

-- Audit current data for orphaned references
CREATE OR REPLACE VIEW public.data_integrity_audit AS
WITH orphaned_data AS (
    -- Check Projects.blocks array
    SELECT 'Projects' as table_name, 'blocks' as column_name, 
           whalesync_postgres_id as record_id,
           array_length(blocks, 1) as array_length,
           NOT validate_uuid_array_elements(blocks, 'Blocks') as has_orphans
    FROM public."Projects" 
    WHERE blocks IS NOT NULL AND array_length(blocks, 1) > 0
    
    UNION ALL
    
    -- Check Blocks.levels array  
    SELECT 'Blocks' as table_name, 'levels' as column_name,
           whalesync_postgres_id as record_id,
           array_length(levels, 1) as array_length,
           NOT validate_uuid_array_elements(levels, 'Levels') as has_orphans
    FROM public."Blocks"
    WHERE levels IS NOT NULL AND array_length(levels, 1) > 0
    
    UNION ALL
    
    -- Check Levels.plots array
    SELECT 'Levels' as table_name, 'plots' as column_name,
           whalesync_postgres_id as record_id, 
           array_length(plots, 1) as array_length,
           NOT validate_uuid_array_elements(plots, 'Plots') as has_orphans
    FROM public."Levels"
    WHERE plots IS NOT NULL AND array_length(plots, 1) > 0
    
    UNION ALL
    
    -- Check Drawings.plotscovered array
    SELECT 'Drawings' as table_name, 'plotscovered' as column_name,
           whalesync_postgres_id as record_id,
           array_length(plotscovered, 1) as array_length, 
           NOT validate_uuid_array_elements(plotscovered, 'Plots') as has_orphans
    FROM public."Drawings"
    WHERE plotscovered IS NOT NULL AND array_length(plotscovered, 1) > 0
)
SELECT * FROM orphaned_data WHERE has_orphans = true;

-- Clean up orphaned data before adding constraints
DO $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Clean Projects.blocks
    SELECT clean_orphaned_array_elements('Projects', 'blocks', 'Blocks') INTO cleanup_count;
    RAISE NOTICE 'Cleaned % orphaned elements from Projects.blocks', cleanup_count;
    
    -- Clean Blocks.levels  
    SELECT clean_orphaned_array_elements('Blocks', 'levels', 'Levels') INTO cleanup_count;
    RAISE NOTICE 'Cleaned % orphaned elements from Blocks.levels', cleanup_count;
    
    -- Clean Levels.plots
    SELECT clean_orphaned_array_elements('Levels', 'plots', 'Plots') INTO cleanup_count;
    RAISE NOTICE 'Cleaned % orphaned elements from Levels.plots', cleanup_count;
    
    -- Clean Drawings.plotscovered
    SELECT clean_orphaned_array_elements('Drawings', 'plotscovered', 'Plots') INTO cleanup_count;
    RAISE NOTICE 'Cleaned % orphaned elements from Drawings.plotscovered', cleanup_count;
END $$;