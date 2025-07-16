-- Data Migration: Populate array relationships and fix constraints

-- Phase 1: Populate Projects.blocks array from existing Blocks.project references
UPDATE public."Projects" 
SET blocks = (
    SELECT ARRAY_AGG(b.whalesync_postgres_id ORDER BY b.blockname)
    FROM public."Blocks" b 
    WHERE b.project = "Projects".whalesync_postgres_id
)
WHERE EXISTS (
    SELECT 1 FROM public."Blocks" b 
    WHERE b.project = "Projects".whalesync_postgres_id
);

-- Phase 2: Populate Blocks.levels array from existing Levels.block references  
UPDATE public."Blocks"
SET levels = (
    SELECT ARRAY_AGG(l.whalesync_postgres_id ORDER BY l.levelnumber)
    FROM public."Levels" l
    WHERE l.block = "Blocks".whalesync_postgres_id
)
WHERE EXISTS (
    SELECT 1 FROM public."Levels" l
    WHERE l.block = "Blocks".whalesync_postgres_id
);

-- Phase 3: Populate Levels.plots array from existing Plots.level references
UPDATE public."Levels"
SET plots = (
    SELECT ARRAY_AGG(p.whalesync_postgres_id ORDER BY p.plotnumber)
    FROM public."Plots" p
    WHERE p.level = "Levels".whalesync_postgres_id
)
WHERE EXISTS (
    SELECT 1 FROM public."Plots" p
    WHERE p.level = "Levels".whalesync_postgres_id
);

-- Phase 4: Create junction table for many-to-many relationships (User-Plot assignments)
CREATE TABLE IF NOT EXISTS public.project_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'Operative',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID,
    is_active BOOLEAN DEFAULT true
);

-- Add unique constraint after table creation
ALTER TABLE public.project_team 
ADD CONSTRAINT project_team_unique_assignment 
UNIQUE (project_id, user_id);

-- Enable RLS on project_team
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;

-- Create policies for project_team
CREATE POLICY "Admins can manage project team" ON public.project_team
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

CREATE POLICY "Project team members can view team" ON public.project_team
FOR SELECT USING (
    user_id = (
        SELECT whalesync_postgres_id FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
    )
    OR project_id IN (
        SELECT currentproject FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
    )
);

-- Phase 5: Populate project_team from existing Users.currentproject relationships
INSERT INTO public.project_team (project_id, user_id, role, created_at)
SELECT 
    u.currentproject,
    u.whalesync_postgres_id,
    u.role,
    COALESCE(u.airtable_created_time, now())
FROM public."Users" u
WHERE u.currentproject IS NOT NULL
AND u.employmentstatus = 'Active'
ON CONFLICT ON CONSTRAINT project_team_unique_assignment DO NOTHING;

-- Phase 6: Create data validation function
CREATE OR REPLACE FUNCTION public.validate_array_relationships()
RETURNS TABLE(
    issue_type TEXT,
    table_name TEXT,
    record_id UUID,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check for orphaned blocks in Projects.blocks arrays
    RETURN QUERY
    SELECT 
        'orphaned_block'::TEXT,
        'Projects'::TEXT,
        p.whalesync_postgres_id,
        'Block ID ' || unnest_val::TEXT || ' not found in Blocks table'
    FROM public."Projects" p,
         UNNEST(COALESCE(p.blocks, ARRAY[]::UUID[])) AS unnest_val
    WHERE NOT EXISTS (
        SELECT 1 FROM public."Blocks" b 
        WHERE b.whalesync_postgres_id = unnest_val
    );
    
    -- Check for orphaned levels in Blocks.levels arrays
    RETURN QUERY
    SELECT 
        'orphaned_level'::TEXT,
        'Blocks'::TEXT,
        b.whalesync_postgres_id,
        'Level ID ' || unnest_val::TEXT || ' not found in Levels table'
    FROM public."Blocks" b,
         UNNEST(COALESCE(b.levels, ARRAY[]::UUID[])) AS unnest_val
    WHERE NOT EXISTS (
        SELECT 1 FROM public."Levels" l 
        WHERE l.whalesync_postgres_id = unnest_val
    );
    
    -- Check for orphaned plots in Levels.plots arrays
    RETURN QUERY
    SELECT 
        'orphaned_plot'::TEXT,
        'Levels'::TEXT,
        l.whalesync_postgres_id,
        'Plot ID ' || unnest_val::TEXT || ' not found in Plots table'
    FROM public."Levels" l,
         UNNEST(COALESCE(l.plots, ARRAY[]::UUID[])) AS unnest_val
    WHERE NOT EXISTS (
        SELECT 1 FROM public."Plots" p 
        WHERE p.whalesync_postgres_id = unnest_val
    );
END;
$$;

-- Phase 7: Add monitoring function for relationship health
CREATE OR REPLACE FUNCTION public.monitor_relationship_health()
RETURNS TABLE(
    metric_name TEXT,
    metric_value BIGINT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Count projects with blocks
    RETURN QUERY
    SELECT 
        'projects_with_blocks'::TEXT,
        COUNT(*)::BIGINT,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END
    FROM public."Projects"
    WHERE blocks IS NOT NULL AND array_length(blocks, 1) > 0;
    
    -- Count blocks with levels
    RETURN QUERY
    SELECT 
        'blocks_with_levels'::TEXT,
        COUNT(*)::BIGINT,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END
    FROM public."Blocks"
    WHERE levels IS NOT NULL AND array_length(levels, 1) > 0;
    
    -- Count levels with plots
    RETURN QUERY
    SELECT 
        'levels_with_plots'::TEXT,
        COUNT(*)::BIGINT,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END
    FROM public."Levels"
    WHERE plots IS NOT NULL AND array_length(plots, 1) > 0;
    
    -- Count validation issues
    RETURN QUERY
    SELECT 
        'validation_issues'::TEXT,
        (SELECT COUNT(*) FROM public.validate_array_relationships())::BIGINT,
        CASE WHEN (SELECT COUNT(*) FROM public.validate_array_relationships()) = 0 THEN 'OK' ELSE 'ERROR' END;
END;
$$;