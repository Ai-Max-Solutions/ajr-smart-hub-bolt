-- PHASE 2: DATA QUALITY & USABILITY IMPROVEMENTS
-- Add sensible defaults for key fields and improve data constraints

-- Add helpful defaults for frequently used fields
ALTER TABLE "Plots" 
  ALTER COLUMN plotstatus SET DEFAULT 'Not Started',
  ALTER COLUMN completion_percentage SET DEFAULT 0,
  ALTER COLUMN snaggingitems SET DEFAULT 0;

-- Add defaults for project fields
ALTER TABLE "Projects"
  ALTER COLUMN status SET DEFAULT 'Planning',
  ALTER COLUMN totalplots SET DEFAULT 0,
  ALTER COLUMN pendingdeliveries SET DEFAULT 0,
  ALTER COLUMN activehireitems SET DEFAULT 0,
  ALTER COLUMN completeddeliveries SET DEFAULT 0,
  ALTER COLUMN outstandingpods SET DEFAULT 0;

-- Add defaults for block and level fields
ALTER TABLE "Blocks"
  ALTER COLUMN blockstatus SET DEFAULT 'Planning',
  ALTER COLUMN blockdeliveries SET DEFAULT 0,
  ALTER COLUMN pendingblockdeliveries SET DEFAULT 0,
  ALTER COLUMN snaggingitems SET DEFAULT 0,
  ALTER COLUMN totalplots SET DEFAULT 0;

ALTER TABLE "Levels"
  ALTER COLUMN levelstatus SET DEFAULT 'Not Started',
  ALTER COLUMN leveldeliveries SET DEFAULT 0,
  ALTER COLUMN pendingleveldeliveries SET DEFAULT 0,
  ALTER COLUMN snaggingitems SET DEFAULT 0,
  ALTER COLUMN plotsonlevel SET DEFAULT 0,
  ALTER COLUMN firstfixprogress SET DEFAULT 0,
  ALTER COLUMN secondfixprogress SET DEFAULT 0;

-- Add defaults for user fields
ALTER TABLE "Users"
  ALTER COLUMN employmentstatus SET DEFAULT 'Active',
  ALTER COLUMN total_plots_completed SET DEFAULT 0,
  ALTER COLUMN ai_queries_count SET DEFAULT 0,
  ALTER COLUMN reactivated_count SET DEFAULT 0,
  ALTER COLUMN onboarding_completed SET DEFAULT false,
  ALTER COLUMN cscs_upload_required SET DEFAULT true,
  ALTER COLUMN cscs_required SET DEFAULT false,
  ALTER COLUMN deactivation_warning_sent SET DEFAULT false;

-- Create helper function to generate unique plot numbers
CREATE OR REPLACE FUNCTION generate_plot_number(p_level_id UUID, p_block_prefix TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    block_code TEXT;
    level_number INTEGER;
    next_plot_sequence INTEGER;
    plot_number TEXT;
BEGIN
    -- Get block code and level information
    SELECT 
        COALESCE(b.blockcode, COALESCE(p_block_prefix, 'BLK')),
        COALESCE(l.levelnumber, 1)
    INTO block_code, level_number
    FROM public."Levels" l
    LEFT JOIN public."Blocks" b ON l.block = b.whalesync_postgres_id
    WHERE l.whalesync_postgres_id = p_level_id;
    
    -- Get next sequence number for this level
    SELECT COALESCE(MAX(
        CASE 
            WHEN plotid ~ '^[A-Z0-9]+-L[0-9]+-([0-9]+)$' 
            THEN (regexp_split_to_array(plotid, '-'))[3]::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO next_plot_sequence
    FROM public."Plots"
    WHERE level = p_level_id;
    
    -- Format: BLOCKCODE-L[LEVEL]-[SEQUENCE]
    plot_number := block_code || '-L' || level_number || '-' || LPAD(next_plot_sequence::TEXT, 3, '0');
    
    RETURN plot_number;
END;
$$;

-- Create trigger to auto-generate plot numbers if not provided
CREATE OR REPLACE FUNCTION auto_generate_plot_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Only generate if plotnumber is null or empty
    IF NEW.plotnumber IS NULL OR NEW.plotnumber = '' THEN
        NEW.plotnumber := generate_plot_number(NEW.level);
    END IF;
    
    -- Set plot ID if not provided
    IF NEW.plotid IS NULL OR NEW.plotid = '' THEN
        NEW.plotid := NEW.plotnumber;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER auto_plot_number_trigger
    BEFORE INSERT ON "Plots"
    FOR EACH ROW EXECUTE FUNCTION auto_generate_plot_number();

-- Create helper function to generate project references
CREATE OR REPLACE FUNCTION generate_project_reference(p_client_name TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    client_prefix TEXT;
    year_suffix TEXT;
    next_sequence INTEGER;
    project_ref TEXT;
BEGIN
    -- Create client prefix (first 3 chars of client name, or 'PRJ' if no client)
    client_prefix := UPPER(COALESCE(LEFT(REGEXP_REPLACE(p_client_name, '[^A-Za-z0-9]', '', 'g'), 3), 'PRJ'));
    
    -- Get current year suffix
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
        CASE 
            WHEN projectuid ~ ('^' || client_prefix || year_suffix || '[0-9]+$')
            THEN SUBSTRING(projectuid FROM LENGTH(client_prefix || year_suffix) + 1)::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO next_sequence
    FROM public."Projects";
    
    -- Format: CLIENT-PREFIX + YY + SEQUENCE
    project_ref := client_prefix || year_suffix || LPAD(next_sequence::TEXT, 3, '0');
    
    RETURN project_ref;
END;
$$;

-- Create trigger to auto-generate project UIDs
CREATE OR REPLACE FUNCTION auto_generate_project_uid()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Only generate if projectuid is null or empty
    IF NEW.projectuid IS NULL OR NEW.projectuid = '' THEN
        NEW.projectuid := generate_project_reference(NEW.clientname);
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER auto_project_uid_trigger
    BEFORE INSERT ON "Projects"
    FOR EACH ROW EXECUTE FUNCTION auto_generate_project_uid();

-- Create indexes for commonly queried fields to improve performance
CREATE INDEX IF NOT EXISTS idx_plots_status ON "Plots"(plotstatus);
CREATE INDEX IF NOT EXISTS idx_plots_level ON "Plots"(level);
CREATE INDEX IF NOT EXISTS idx_plots_completion ON "Plots"(completion_percentage);

CREATE INDEX IF NOT EXISTS idx_projects_status ON "Projects"(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON "Projects"(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON "Projects"(clientname);

CREATE INDEX IF NOT EXISTS idx_users_role ON "Users"(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON "Users"(employmentstatus);
CREATE INDEX IF NOT EXISTS idx_users_project ON "Users"(currentproject);

CREATE INDEX IF NOT EXISTS idx_blocks_status ON "Blocks"(blockstatus);
CREATE INDEX IF NOT EXISTS idx_levels_status ON "Levels"(levelstatus);

-- Create a helper view for common project summary data
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.whalesync_postgres_id as project_id,
    p.projectname,
    p.projectuid,
    p.clientname,
    p.status,
    p.totalplots,
    p.startdate,
    p.plannedenddate,
    p.actualenddate,
    COALESCE(pm.fullname, p.projectmanager) as project_manager_name,
    -- Calculate progress metrics
    CASE 
        WHEN p.totalplots > 0 THEN 
            ROUND((COUNT(CASE WHEN pl.plotstatus = 'Complete' THEN 1 END) * 100.0 / p.totalplots), 1)
        ELSE 0 
    END as completion_percentage,
    COUNT(CASE WHEN pl.plotstatus = 'Complete' THEN 1 END) as completed_plots,
    COUNT(CASE WHEN pl.plotstatus = 'In Progress' THEN 1 END) as active_plots,
    COUNT(CASE WHEN pl.plotstatus = 'Not Started' THEN 1 END) as pending_plots,
    -- Team info
    COUNT(DISTINCT pt.user_id) as team_size,
    -- Recent activity
    MAX(pl.actualhandoverdate) as last_handover_date
FROM public."Projects" p
LEFT JOIN public."Users" pm ON p.project_manager_id = pm.whalesync_postgres_id
LEFT JOIN public."Blocks" b ON b.whalesync_postgres_id = ANY(p.blocks)
LEFT JOIN public."Levels" l ON l.whalesync_postgres_id = ANY(b.levels)
LEFT JOIN public."Plots" pl ON pl.whalesync_postgres_id = ANY(l.plots)
LEFT JOIN project_team pt ON pt.project_id = p.whalesync_postgres_id
GROUP BY 
    p.whalesync_postgres_id, p.projectname, p.projectuid, p.clientname, p.status,
    p.totalplots, p.startdate, p.plannedenddate, p.actualenddate, 
    COALESCE(pm.fullname, p.projectmanager);

-- Add RLS policy for the view
CREATE POLICY "Project team can view project summary" ON project_summary
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Users" u
        WHERE u.supabase_auth_id = auth.uid()
        AND (u.currentproject = project_id 
             OR u.role IN ('Admin', 'Document Controller', 'Project Manager', 'Director'))
    )
);