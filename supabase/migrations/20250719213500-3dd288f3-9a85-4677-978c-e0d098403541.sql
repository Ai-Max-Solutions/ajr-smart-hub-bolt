-- Project Setup Blueprint: Blocks, Levels, and Plots
-- Create the hierarchical structure for project organization

-- Blocks table (sections within a project)
CREATE TABLE public.project_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g., "A", "B1", "Tower East"
    name TEXT NOT NULL, -- Full name/description
    description TEXT,
    sequence_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, code)
);

-- Levels table (floors within a block)
CREATE TABLE public.project_levels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    block_id UUID NOT NULL REFERENCES public.project_blocks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g., "GF", "M", "B", "01", "02"
    name TEXT NOT NULL, -- Full name like "Ground Floor", "Mezzanine"
    level_number INTEGER NOT NULL, -- For sorting (-1 for basement, 0 for GF, etc.)
    level_type TEXT DEFAULT 'Standard' CHECK (level_type IN ('Standard', 'Ground', 'Mezzanine', 'Basement', 'Penthouse')),
    description TEXT,
    sequence_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(block_id, code)
);

-- Enhanced plots table (units within a level)
ALTER TABLE public.plots 
ADD COLUMN IF NOT EXISTS block_id UUID REFERENCES public.project_blocks(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES public.project_levels(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS code TEXT, -- e.g., "05", "A01"
ADD COLUMN IF NOT EXISTS composite_code TEXT, -- Auto-generated like "B1-GF-05"
ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'Residential' CHECK (unit_type IN ('Residential', 'Commercial', 'Retail', 'Parking', 'Storage')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Complete', 'On Hold')),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS sequence_order INTEGER DEFAULT 1;

-- Update existing plots table constraints
ALTER TABLE public.plots 
ADD CONSTRAINT plots_block_code_unique UNIQUE(block_id, code);

-- Task catalog for standardized tasks across projects
CREATE TABLE public.task_catalog (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- e.g., 'Plumbing', 'HVAC', 'Electrical'
    sequence_order INTEGER DEFAULT 1,
    estimated_hours NUMERIC(4,2) DEFAULT 0,
    requires_test BOOLEAN DEFAULT false,
    is_standard BOOLEAN DEFAULT true, -- Part of standard template
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Project-specific task assignments for plots
CREATE TABLE public.plot_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    task_catalog_id UUID NOT NULL REFERENCES public.task_catalog(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id),
    status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Complete', 'On Hold')),
    scheduled_date DATE,
    completed_date DATE,
    actual_hours NUMERIC(4,2) DEFAULT 0,
    notes TEXT,
    requires_test BOOLEAN DEFAULT false,
    test_completed BOOLEAN DEFAULT false,
    test_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(plot_id, task_catalog_id)
);

-- Project templates for different building types
CREATE TABLE public.project_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    building_type TEXT NOT NULL, -- e.g., 'Residential High-Rise', 'Commercial', 'Mixed-Use'
    default_blocks INTEGER DEFAULT 1,
    default_levels INTEGER DEFAULT 10,
    default_units_per_level INTEGER DEFAULT 12,
    includes_ground_floor BOOLEAN DEFAULT true,
    includes_basement BOOLEAN DEFAULT false,
    includes_mezzanine BOOLEAN DEFAULT false,
    template_data JSONB, -- Flexible storage for template configuration
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert standard task catalog entries
INSERT INTO public.task_catalog (name, description, category, sequence_order, estimated_hours, requires_test) VALUES
('1st Fix Plumbing', 'Install initial plumbing rough-in', 'Plumbing', 1, 8.0, true),
('2nd Fix Plumbing', 'Complete plumbing installation and connections', 'Plumbing', 2, 6.0, true),
('HIU Installation', 'Install Heat Interface Unit', 'HVAC', 3, 4.0, true),
('Electrical 1st Fix', 'Install electrical rough-in and cabling', 'Electrical', 4, 10.0, false),
('Electrical 2nd Fix', 'Complete electrical installation and testing', 'Electrical', 5, 6.0, true),
('Flooring Installation', 'Install floor coverings and finishes', 'Finishing', 6, 12.0, false),
('Kitchen Installation', 'Install kitchen units and appliances', 'Finishing', 7, 16.0, false),
('Bathroom Installation', 'Install bathroom fixtures and fittings', 'Finishing', 8, 14.0, true),
('Painting and Decorating', 'Paint walls and complete decorative finishes', 'Finishing', 9, 8.0, false),
('Final Snagging', 'Complete final inspection and defect correction', 'Quality', 10, 4.0, false),
('Handover Preparation', 'Prepare unit for client handover', 'Quality', 11, 2.0, false);

-- Insert project templates
INSERT INTO public.project_templates (name, description, building_type, default_blocks, default_levels, default_units_per_level, includes_ground_floor, includes_basement) VALUES
('Residential High-Rise', 'Standard residential tower block template', 'Residential', 1, 10, 12, true, false),
('Mixed-Use Development', 'Commercial ground floor with residential above', 'Mixed-Use', 2, 8, 10, true, true),
('Commercial Office Block', 'Standard office building template', 'Commercial', 1, 6, 1, true, false),
('Student Accommodation', 'Purpose-built student accommodation', 'Residential', 3, 12, 20, true, false);

-- Enable RLS on new tables
ALTER TABLE public.project_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_blocks
CREATE POLICY "Project blocks viewable by authenticated users" ON public.project_blocks FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Admins can manage project blocks" ON public.project_blocks FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.supabase_auth_id = auth.uid() AND users.role = ANY(ARRAY['Admin'::user_role_enum, 'PM'::user_role_enum, 'Director'::user_role_enum]))
);

-- RLS Policies for project_levels  
CREATE POLICY "Project levels viewable by authenticated users" ON public.project_levels FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Admins can manage project levels" ON public.project_levels FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.supabase_auth_id = auth.uid() AND users.role = ANY(ARRAY['Admin'::user_role_enum, 'PM'::user_role_enum, 'Director'::user_role_enum]))
);

-- RLS Policies for task_catalog
CREATE POLICY "Task catalog viewable by authenticated users" ON public.task_catalog FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Admins can manage task catalog" ON public.task_catalog FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.supabase_auth_id = auth.uid() AND users.role = ANY(ARRAY['Admin'::user_role_enum, 'Director'::user_role_enum]))
);

-- RLS Policies for plot_tasks
CREATE POLICY "Plot tasks viewable by authenticated users" ON public.plot_tasks FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Admins can manage plot tasks" ON public.plot_tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.supabase_auth_id = auth.uid() AND users.role = ANY(ARRAY['Admin'::user_role_enum, 'PM'::user_role_enum, 'Director'::user_role_enum, 'Supervisor'::user_role_enum]))
);
CREATE POLICY "Users can update assigned tasks" ON public.plot_tasks FOR UPDATE USING (assigned_to IN (
    SELECT users.id FROM users WHERE users.supabase_auth_id = auth.uid()
));

-- RLS Policies for project_templates
CREATE POLICY "Project templates viewable by authenticated users" ON public.project_templates FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Admins can manage project templates" ON public.project_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.supabase_auth_id = auth.uid() AND users.role = ANY(ARRAY['Admin'::user_role_enum, 'Director'::user_role_enum]))
);

-- Function to auto-generate composite codes for plots
CREATE OR REPLACE FUNCTION generate_plot_composite_code()
RETURNS TRIGGER AS $$
DECLARE
    block_code TEXT;
    level_code TEXT;
BEGIN
    -- Get block and level codes
    SELECT pb.code INTO block_code 
    FROM project_blocks pb 
    WHERE pb.id = NEW.block_id;
    
    SELECT pl.code INTO level_code 
    FROM project_levels pl 
    WHERE pl.id = NEW.level_id;
    
    -- Generate composite code: BLOCK-LEVEL-PLOT (e.g., B1-GF-05)
    NEW.composite_code := COALESCE(block_code, '') || '-' || COALESCE(level_code, '') || '-' || COALESCE(NEW.code, '');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate composite codes
CREATE TRIGGER generate_plot_composite_code_trigger
    BEFORE INSERT OR UPDATE ON public.plots
    FOR EACH ROW
    EXECUTE FUNCTION generate_plot_composite_code();

-- Function to update plot task progress when timesheet entries are added
CREATE OR REPLACE FUNCTION update_plot_task_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the plot_tasks table when timesheet entries are added
    UPDATE public.plot_tasks
    SET 
        actual_hours = COALESCE(actual_hours, 0) + NEW.hours,
        status = CASE 
            WHEN status = 'Not Started' THEN 'In Progress'
            ELSE status
        END,
        updated_at = now()
    WHERE plot_id = NEW.plot_id 
    AND task_catalog_id IN (
        SELECT tc.id FROM task_catalog tc 
        JOIN work_categories wc ON wc.main_category = tc.category 
        WHERE wc.id = NEW.work_category_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timesheet integration (if timesheet_entries table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timesheet_entries' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_plot_task_progress_trigger ON public.timesheet_entries;
        CREATE TRIGGER update_plot_task_progress_trigger
            AFTER INSERT ON public.timesheet_entries
            FOR EACH ROW
            EXECUTE FUNCTION update_plot_task_progress();
    END IF;
END $$;