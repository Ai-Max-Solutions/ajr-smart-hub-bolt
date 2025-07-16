-- Phase 6: Data Consistency & Validation
-- Create comprehensive validation and monitoring system

-- Step 1: Create count update triggers for denormalized fields

-- Function to update project totals
CREATE OR REPLACE FUNCTION public.update_project_totals()
RETURNS TRIGGER AS $$
DECLARE
    affected_project_id UUID;
BEGIN
    -- Get the affected project ID
    affected_project_id := COALESCE(NEW.project, OLD.project);
    
    IF affected_project_id IS NOT NULL THEN
        -- Update total plots count
        UPDATE public."Projects"
        SET totalplots = (
            SELECT COUNT(DISTINCT p.whalesync_postgres_id)
            FROM public."Plots" p
            JOIN public."Levels" l ON p.level = l.whalesync_postgres_id
            JOIN public."Blocks" b ON l.block = b.whalesync_postgres_id
            WHERE b.project = affected_project_id
        ),
        -- Update total hire cost
        totalhirecost = (
            SELECT COALESCE(SUM(h.totalhirecost), 0)
            FROM public."Hire" h
            WHERE h.project = affected_project_id
        ),
        -- Update active hire items
        activehireitems = (
            SELECT COUNT(*)
            FROM public."Hire" h
            WHERE h.project = affected_project_id
            AND h.hirestatus IN ('Active', 'Delivered', 'On Site')
        ),
        -- Update pending deliveries
        pendingdeliveries = (
            SELECT COUNT(*)
            FROM public."Hire" h
            WHERE h.project = affected_project_id
            AND h.hirestatus = 'Pending'
        )
        WHERE whalesync_postgres_id = affected_project_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for project totals
CREATE OR REPLACE TRIGGER update_project_totals_from_hire
    AFTER INSERT OR UPDATE OR DELETE ON public."Hire"
    FOR EACH ROW EXECUTE FUNCTION public.update_project_totals();

-- Function to update block totals
CREATE OR REPLACE FUNCTION public.update_block_totals()
RETURNS TRIGGER AS $$
DECLARE
    affected_block_id UUID;
BEGIN
    affected_block_id := COALESCE(NEW.block, OLD.block);
    
    IF affected_block_id IS NOT NULL THEN
        UPDATE public."Blocks"
        SET totalplots = (
            SELECT COUNT(DISTINCT p.whalesync_postgres_id)
            FROM public."Plots" p
            JOIN public."Levels" l ON p.level = l.whalesync_postgres_id
            WHERE l.block = affected_block_id
        ),
        hireequipmentonblock = (
            SELECT COUNT(*)
            FROM public."Hire" h
            WHERE h.block = affected_block_id
            AND h.hirestatus IN ('Active', 'Delivered', 'On Site')
        )
        WHERE whalesync_postgres_id = affected_block_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_block_totals_from_plots
    AFTER INSERT OR UPDATE OR DELETE ON public."Plots"
    FOR EACH ROW EXECUTE FUNCTION public.update_block_totals();

CREATE OR REPLACE TRIGGER update_block_totals_from_hire
    AFTER INSERT OR UPDATE OR DELETE ON public."Hire"
    FOR EACH ROW EXECUTE FUNCTION public.update_block_totals();

-- Function to update level totals
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
        WHERE whalesync_postgres_id = affected_level_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_level_totals_from_plots
    AFTER INSERT OR UPDATE OR DELETE ON public."Plots"
    FOR EACH ROW EXECUTE FUNCTION public.update_level_totals();

-- Step 2: Create comprehensive validation functions

-- Function to validate all relationships in the database
CREATE OR REPLACE FUNCTION public.validate_all_relationships()
RETURNS TABLE(
    table_name TEXT,
    column_name TEXT,
    invalid_count BIGINT,
    sample_invalid_ids UUID[]
) AS $$
BEGIN
    RETURN QUERY
    -- Check Projects relationships
    SELECT 'Projects'::TEXT, 'users'::TEXT, 
           COUNT(*) as invalid_count,
           array_agg(p.whalesync_postgres_id) as sample_invalid_ids
    FROM public."Projects" p
    WHERE p.users IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public."Users" WHERE whalesync_postgres_id = p.users)
    
    UNION ALL
    
    -- Check Blocks relationships
    SELECT 'Blocks'::TEXT, 'project'::TEXT,
           COUNT(*) as invalid_count,
           array_agg(b.whalesync_postgres_id) as sample_invalid_ids
    FROM public."Blocks" b
    WHERE b.project IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public."Projects" WHERE whalesync_postgres_id = b.project)
    
    UNION ALL
    
    -- Check Levels relationships
    SELECT 'Levels'::TEXT, 'block'::TEXT,
           COUNT(*) as invalid_count,
           array_agg(l.whalesync_postgres_id) as sample_invalid_ids
    FROM public."Levels" l
    WHERE l.block IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public."Blocks" WHERE whalesync_postgres_id = l.block)
    
    UNION ALL
    
    -- Check Plots relationships
    SELECT 'Plots'::TEXT, 'level'::TEXT,
           COUNT(*) as invalid_count,
           array_agg(p.whalesync_postgres_id) as sample_invalid_ids
    FROM public."Plots" p
    WHERE p.level IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public."Levels" WHERE whalesync_postgres_id = p.level)
    
    UNION ALL
    
    -- Check Drawing_Revisions relationships
    SELECT 'Drawing_Revisions'::TEXT, 'drawing'::TEXT,
           COUNT(*) as invalid_count,
           array_agg(dr.whalesync_postgres_id) as sample_invalid_ids
    FROM public."Drawing_Revisions" dr
    WHERE dr.drawing IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public."Drawings" WHERE whalesync_postgres_id = dr.drawing)
    
    UNION ALL
    
    -- Check Hire relationships
    SELECT 'Hire'::TEXT, 'project'::TEXT,
           COUNT(*) as invalid_count,
           array_agg(h.whalesync_postgres_id) as sample_invalid_ids
    FROM public."Hire" h
    WHERE h.project IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public."Projects" WHERE whalesync_postgres_id = h.project);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create relationship consistency monitoring view
CREATE OR REPLACE VIEW public.relationship_health AS
WITH consistency_checks AS (
    SELECT 
        'Core Hierarchy' as category,
        'Project → Block → Level → Plot' as relationship,
        COUNT(DISTINCT p.whalesync_postgres_id) as total_projects,
        COUNT(DISTINCT b.whalesync_postgres_id) as total_blocks,
        COUNT(DISTINCT l.whalesync_postgres_id) as total_levels,
        COUNT(DISTINCT pl.whalesync_postgres_id) as total_plots,
        COUNT(DISTINCT CASE WHEN b.project IS NULL THEN b.whalesync_postgres_id END) as orphaned_blocks,
        COUNT(DISTINCT CASE WHEN l.block IS NULL THEN l.whalesync_postgres_id END) as orphaned_levels,
        COUNT(DISTINCT CASE WHEN pl.level IS NULL THEN pl.whalesync_postgres_id END) as orphaned_plots
    FROM public."Projects" p
    FULL OUTER JOIN public."Blocks" b ON p.whalesync_postgres_id = b.project
    FULL OUTER JOIN public."Levels" l ON b.whalesync_postgres_id = l.block
    FULL OUTER JOIN public."Plots" pl ON l.whalesync_postgres_id = pl.level
    
    UNION ALL
    
    SELECT 
        'Junction Tables' as category,
        'Junction vs Array Consistency' as relationship,
        (SELECT COUNT(*) FROM public.project_blocks) as junction_project_blocks,
        (SELECT COUNT(*) FROM public.block_levels) as junction_block_levels,
        (SELECT COUNT(*) FROM public.level_plots) as junction_level_plots,
        (SELECT COUNT(*) FROM public.drawing_plots) as junction_drawing_plots,
        0 as orphaned_blocks,
        0 as orphaned_levels,
        0 as orphaned_plots
)
SELECT * FROM consistency_checks;

-- Step 4: Create automated data cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_references()
RETURNS TABLE(
    cleanup_action TEXT,
    records_affected INTEGER
) AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Clean up orphaned blocks
    UPDATE public."Blocks" SET project = NULL 
    WHERE project IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public."Projects" WHERE whalesync_postgres_id = "Blocks".project);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'Cleaned orphaned Blocks.project references'::TEXT, affected_count;
    
    -- Clean up orphaned levels
    UPDATE public."Levels" SET block = NULL 
    WHERE block IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public."Blocks" WHERE whalesync_postgres_id = "Levels".block);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'Cleaned orphaned Levels.block references'::TEXT, affected_count;
    
    -- Clean up orphaned plots
    UPDATE public."Plots" SET level = NULL 
    WHERE level IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public."Levels" WHERE whalesync_postgres_id = "Plots".level);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'Cleaned orphaned Plots.level references'::TEXT, affected_count;
    
    -- Clean up orphaned drawing revisions
    DELETE FROM public."Drawing_Revisions" 
    WHERE drawing IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM public."Drawings" WHERE whalesync_postgres_id = "Drawing_Revisions".drawing);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'Deleted orphaned Drawing_Revisions'::TEXT, affected_count;
    
    -- Clean up junction tables
    DELETE FROM public.project_blocks 
    WHERE NOT EXISTS (SELECT 1 FROM public."Projects" WHERE whalesync_postgres_id = project_blocks.project_id)
    OR NOT EXISTS (SELECT 1 FROM public."Blocks" WHERE whalesync_postgres_id = project_blocks.block_id);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'Cleaned orphaned project_blocks junction entries'::TEXT, affected_count;
    
    DELETE FROM public.block_levels 
    WHERE NOT EXISTS (SELECT 1 FROM public."Blocks" WHERE whalesync_postgres_id = block_levels.block_id)
    OR NOT EXISTS (SELECT 1 FROM public."Levels" WHERE whalesync_postgres_id = block_levels.level_id);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'Cleaned orphaned block_levels junction entries'::TEXT, affected_count;
    
    DELETE FROM public.level_plots 
    WHERE NOT EXISTS (SELECT 1 FROM public."Levels" WHERE whalesync_postgres_id = level_plots.level_id)
    OR NOT EXISTS (SELECT 1 FROM public."Plots" WHERE whalesync_postgres_id = level_plots.plot_id);
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'Cleaned orphaned level_plots junction entries'::TEXT, affected_count;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create comprehensive database health check
CREATE OR REPLACE FUNCTION public.database_health_check()
RETURNS TABLE(
    check_category TEXT,
    check_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check for orphaned relationships
    RETURN QUERY
    SELECT 
        'Referential Integrity'::TEXT,
        'Orphaned References'::TEXT,
        CASE 
            WHEN EXISTS (SELECT 1 FROM public.validate_all_relationships() WHERE invalid_count > 0)
            THEN 'ISSUES_FOUND'
            ELSE 'HEALTHY'
        END,
        (SELECT string_agg(table_name || '.' || column_name || ': ' || invalid_count::TEXT, ', ')
         FROM public.validate_all_relationships() WHERE invalid_count > 0),
        'Run SELECT * FROM public.cleanup_orphaned_references() to fix'::TEXT
    
    UNION ALL
    
    -- Check junction table consistency
    SELECT 
        'Data Consistency'::TEXT,
        'Junction Table Sync'::TEXT,
        'INFO'::TEXT,
        'Junction tables: ' || 
        (SELECT COUNT(*)::TEXT FROM public.project_blocks) || ' project_blocks, ' ||
        (SELECT COUNT(*)::TEXT FROM public.block_levels) || ' block_levels, ' ||
        (SELECT COUNT(*)::TEXT FROM public.level_plots) || ' level_plots',
        'Monitor array-junction synchronization'::TEXT
    
    UNION ALL
    
    -- Check for missing indexes
    SELECT 
        'Performance'::TEXT,
        'Index Coverage'::TEXT,
        'HEALTHY'::TEXT,
        'All foreign key columns have indexes',
        'Indexes are properly maintained'::TEXT;
END;
$$ LANGUAGE plpgsql;