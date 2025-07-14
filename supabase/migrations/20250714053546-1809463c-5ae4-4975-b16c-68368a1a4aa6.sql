-- AJ Ryan SmartWork Hub - Comprehensive Demo Data Seeding (Fixed)
-- This migration creates realistic demo data for all modules

-- First, let's create some core lookup tables if they don't exist
CREATE TABLE IF NOT EXISTS public.project_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Project Manager', 'Supervisor', 'Operative', 'DPO')),
    assigned_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    title TEXT NOT NULL,
    document_type TEXT NOT NULL, -- RAMS, Drawing, Site Notice, etc.
    version TEXT DEFAULT 'v1.0',
    status TEXT DEFAULT 'Current', -- Current, Superseded, Draft
    file_url TEXT,
    read_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    superseded_at TIMESTAMP WITH TIME ZONE,
    superseded_by UUID REFERENCES public."Users"(whalesync_postgres_id)
);

CREATE TABLE IF NOT EXISTS public.site_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    notice_type TEXT NOT NULL, -- Safety Alert, Toolbox Talk, General
    priority TEXT DEFAULT 'Medium', -- High, Medium, Low
    requires_signature BOOLEAN DEFAULT true,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.on_hire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    item_name TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    hire_start_date DATE NOT NULL,
    expected_end_date DATE,
    actual_end_date DATE,
    status TEXT DEFAULT 'Active', -- Active, Requested Off-Hire, Returned, Overdue
    weekly_cost DECIMAL(10,2),
    notes TEXT,
    requested_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    total_hours DECIMAL(5,2) DEFAULT 0,
    status TEXT DEFAULT 'Draft', -- Draft, Submitted, Approved, Disputed
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    dispute_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timesheet_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timesheet_id UUID REFERENCES public.timesheets(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    hours_worked DECIMAL(4,2) NOT NULL,
    work_description TEXT,
    plot_id UUID REFERENCES public."Plots"(whalesync_postgres_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    document_id UUID REFERENCES public.documents(id),
    site_notice_id UUID REFERENCES public.site_notices(id),
    signature_data TEXT, -- Base64 signature image
    signature_version TEXT DEFAULT 'v1.0',
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_info JSONB,
    location_data JSONB
);

CREATE TABLE IF NOT EXISTS public.inductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    title TEXT NOT NULL,
    version TEXT DEFAULT 'v1.0',
    content TEXT NOT NULL,
    mandatory BOOLEAN DEFAULT true,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    performance_rating DECIMAL(2,1) DEFAULT 5.0,
    on_time_percentage DECIMAL(5,2) DEFAULT 100.0,
    average_overdue_days INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.on_hire ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create demo projects first (skip if they already exist)
INSERT INTO public."Projects" (
    whalesync_postgres_id,
    projectname,
    clientname,
    siteaddress,
    projectmanager,
    status,
    startdate,
    plannedenddate,
    projectvalue,
    totalplots,
    airtable_created_time
) 
SELECT * FROM (VALUES 
    (gen_random_uuid(), 'Woodberry Down Phase 2', 'Berkeley Homes', '1-79 Woodberry Down, London N4 2TG', 'James Miller', 'Active', '2024-06-01'::date, '2024-12-31'::date, 2500000.00::real, 24, '2024-06-01'::date),
    (gen_random_uuid(), 'Kidbrooke Village Block C', 'Berkeley Homes', 'Kidbrooke Village, London SE3 9FJ', 'Emma Thompson', 'Active', '2024-07-01'::date, '2025-01-31'::date, 1800000.00::real, 18, '2024-07-01'::date),
    (gen_random_uuid(), 'Greenwich Peninsula Phase 1', 'Knight Dragon', 'Greenwich Peninsula, London SE10 0ER', 'James Miller', 'On Hold', '2024-08-01'::date, '2025-03-31'::date, 3200000.00::real, 36, '2024-08-01'::date)
) AS new_projects(whalesync_postgres_id, projectname, clientname, siteaddress, projectmanager, status, startdate, plannedenddate, projectvalue, totalplots, airtable_created_time)
WHERE NOT EXISTS (SELECT 1 FROM public."Projects" WHERE projectname = new_projects.projectname);

-- Create demo users (skip if they already exist)
INSERT INTO public."Users" (
    whalesync_postgres_id,
    email,
    firstname,
    lastname,
    fullname,
    role,
    system_role,
    employmentstatus,
    airtable_created_time,
    auth_provider,
    basehourlyrate,
    skills
) 
SELECT * FROM (VALUES 
    (gen_random_uuid(), 'markcroud@icloud.com', 'Mark', 'Croud', 'Mark Croud', 'Admin', 'Admin', 'Active', '2024-05-01'::date, 'supabase', 0.00::real, ARRAY['Management', 'Strategy', 'Operations']),
    (gen_random_uuid(), 'dpo@ajryan.co.uk', 'Sarah', 'Johnson', 'Sarah Johnson', 'DPO', 'Admin', 'Active', '2024-05-01'::date, 'supabase', 0.00::real, ARRAY['Data Protection', 'Compliance', 'Legal']),
    (gen_random_uuid(), 'pm1@ajryan.co.uk', 'James', 'Miller', 'James Miller', 'Project Manager', 'Manager', 'Active', '2024-05-15'::date, 'supabase', 45.00::real, ARRAY['Project Management', 'Construction', 'Planning']),
    (gen_random_uuid(), 'pm2@ajryan.co.uk', 'Emma', 'Thompson', 'Emma Thompson', 'Project Manager', 'Manager', 'Active', '2024-05-15'::date, 'supabase', 45.00::real, ARRAY['Project Management', 'MEP', 'Quality Control']),
    (gen_random_uuid(), 'sup1@ajryan.co.uk', 'Michael', 'Brown', 'Michael Brown', 'Supervisor', 'Supervisor', 'Active', '2024-05-20'::date, 'supabase', 32.00::real, ARRAY['Team Leadership', 'Quality Control', 'Safety']),
    (gen_random_uuid(), 'sup2@ajryan.co.uk', 'Lisa', 'Davis', 'Lisa Davis', 'Supervisor', 'Supervisor', 'Active', '2024-05-20'::date, 'supabase', 32.00::real, ARRAY['Team Leadership', 'MEP', 'Training']),
    (gen_random_uuid(), 'op1@ajryan.co.uk', 'John', 'Smith', 'John Smith', 'Operative', 'Worker', 'Active', '2024-06-01'::date, 'supabase', 28.00::real, ARRAY['Plumbing', 'First Fix', 'Second Fix']),
    (gen_random_uuid(), 'op2@ajryan.co.uk', 'David', 'Wilson', 'David Wilson', 'Operative', 'Worker', 'Active', '2024-06-01'::date, 'supabase', 26.50::real, ARRAY['Electrical', 'Testing', 'Installation']),
    (gen_random_uuid(), 'op3@ajryan.co.uk', 'Robert', 'Taylor', 'Robert Taylor', 'Operative', 'Worker', 'Active', '2024-06-05'::date, 'supabase', 27.00::real, ARRAY['Heating', 'MVHR', 'Commissioning']),
    (gen_random_uuid(), 'op4@ajryan.co.uk', 'Chris', 'Anderson', 'Chris Anderson', 'Operative', 'Worker', 'Active', '2024-06-10'::date, 'supabase', 25.00::real, ARRAY['General Building', 'Maintenance', 'Repairs']),
    (gen_random_uuid(), 'op5@ajryan.co.uk', 'Paul', 'White', 'Paul White', 'Operative', 'Worker', 'Active', '2024-06-15'::date, 'supabase', 29.00::real, ARRAY['Gas Safe', 'Boiler Installation', 'Safety Testing'])
) AS new_users(whalesync_postgres_id, email, firstname, lastname, fullname, role, system_role, employmentstatus, airtable_created_time, auth_provider, basehourlyrate, skills)
WHERE NOT EXISTS (SELECT 1 FROM public."Users" WHERE email = new_users.email);

-- Create demo plots (skip if they already exist)
INSERT INTO public."Plots" (
    whalesync_postgres_id,
    plotnumber,
    plotstatus,
    completion_percentage,
    numberofbedrooms,
    numberofbathrooms,
    floorarea,
    plannedhandoverdate,
    plotnotes
) 
SELECT * FROM (VALUES 
    (gen_random_uuid(), 'WD-001', 'Completed', 100, 2, 1, 750, '2024-08-15'::date, 'Two bedroom apartment with balcony'),
    (gen_random_uuid(), 'WD-002', 'Completed', 100, 1, 1, 550, '2024-08-20'::date, 'One bedroom apartment'),
    (gen_random_uuid(), 'WD-003', 'In Progress', 75, 3, 2, 950, '2024-09-15'::date, 'Three bedroom apartment with garden'),
    (gen_random_uuid(), 'WD-004', 'In Progress', 65, 2, 2, 800, '2024-09-20'::date, 'Two bedroom apartment'),
    (gen_random_uuid(), 'KB-001', 'In Progress', 45, 2, 2, 850, '2024-10-01'::date, 'Two bedroom apartment with study'),
    (gen_random_uuid(), 'KB-002', 'In Progress', 50, 3, 2, 1100, '2024-10-15'::date, 'Three bedroom apartment')
) AS new_plots(whalesync_postgres_id, plotnumber, plotstatus, completion_percentage, numberofbedrooms, numberofbathrooms, floorarea, plannedhandoverdate, plotnotes)
WHERE NOT EXISTS (SELECT 1 FROM public."Plots" WHERE plotnumber = new_plots.plotnumber);

-- Create suppliers (skip if they already exist)
INSERT INTO public.suppliers (name, contact_email, contact_phone, performance_rating, on_time_percentage, average_overdue_days, total_orders)
SELECT * FROM (VALUES 
    ('MEP Hire Ltd', 'orders@mephire.co.uk', '020 7123 4567', 4.5, 87.5, 2, 24),
    ('Speedy Hire', 'commercial@speedyhire.co.uk', '0800 400 900', 3.8, 72.3, 5, 18),
    ('HSS Hire', 'trade@hsshire.co.uk', '0345 641 9200', 4.2, 81.2, 3, 31),
    ('Brandon Hire', 'info@brandonhire.co.uk', '0800 898 2898', 4.0, 78.9, 4, 15)
) AS new_suppliers(name, contact_email, contact_phone, performance_rating, on_time_percentage, average_overdue_days, total_orders)
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE name = new_suppliers.name);

-- Now create project team assignments using ONLY the exact role values
WITH projects AS (
    SELECT whalesync_postgres_id, projectname FROM public."Projects" WHERE projectname IN ('Woodberry Down Phase 2', 'Kidbrooke Village Block C')
),
users AS (
    SELECT whalesync_postgres_id, email, role FROM public."Users" WHERE email IN ('pm1@ajryan.co.uk', 'sup1@ajryan.co.uk', 'op1@ajryan.co.uk', 'op2@ajryan.co.uk', 'op3@ajryan.co.uk', 'pm2@ajryan.co.uk', 'sup2@ajryan.co.uk', 'op4@ajryan.co.uk', 'op5@ajryan.co.uk', 'markcroud@icloud.com', 'dpo@ajryan.co.uk')
)
INSERT INTO public.project_team (project_id, user_id, role)
SELECT DISTINCT
    p.whalesync_postgres_id,
    u.whalesync_postgres_id,
    u.role  -- Use the exact role from Users table
FROM projects p
CROSS JOIN users u
WHERE 
    (p.projectname = 'Woodberry Down Phase 2' AND u.email IN ('pm1@ajryan.co.uk', 'sup1@ajryan.co.uk', 'op1@ajryan.co.uk', 'op2@ajryan.co.uk', 'op3@ajryan.co.uk'))
    OR (p.projectname = 'Kidbrooke Village Block C' AND u.email IN ('pm2@ajryan.co.uk', 'sup2@ajryan.co.uk', 'op4@ajryan.co.uk', 'op5@ajryan.co.uk'))
    OR u.role IN ('Admin', 'DPO')
ON CONFLICT DO NOTHING;

-- Create RAMS documents
WITH projects AS (SELECT whalesync_postgres_id FROM public."Projects" LIMIT 3),
     admin_user AS (SELECT whalesync_postgres_id FROM public."Users" WHERE email = 'markcroud@icloud.com' LIMIT 1)
INSERT INTO public.documents (project_id, title, document_type, version, status, read_required, created_by)
SELECT 
    p.whalesync_postgres_id,
    docs.title,
    'RAMS',
    docs.version,
    docs.status,
    true,
    a.whalesync_postgres_id
FROM projects p
CROSS JOIN admin_user a
CROSS JOIN (VALUES 
    ('MVHR Installation RAMS', 'v1.0', 'Current'),
    ('First Fix Pipework RAMS', 'v2.0', 'Current'),
    ('Electrical Testing RAMS', 'v1.1', 'Current')
) AS docs(title, version, status)
WHERE NOT EXISTS (
    SELECT 1 FROM public.documents 
    WHERE title = docs.title AND project_id = p.whalesync_postgres_id
);

-- Create site notices
WITH projects AS (SELECT whalesync_postgres_id FROM public."Projects" LIMIT 2),
     admin_user AS (SELECT whalesync_postgres_id FROM public."Users" WHERE email = 'markcroud@icloud.com' LIMIT 1)
INSERT INTO public.site_notices (project_id, title, content, notice_type, priority, requires_signature, valid_until, created_by)
SELECT 
    p.whalesync_postgres_id,
    notices.title,
    notices.content,
    notices.notice_type,
    notices.priority,
    notices.requires_signature,
    CURRENT_DATE + INTERVAL '30 days',
    a.whalesync_postgres_id
FROM projects p
CROSS JOIN admin_user a
CROSS JOIN (VALUES 
    ('Scaffold Access Route Changed', 'Due to structural work on Level 2, the main scaffold access has been relocated to the north elevation. All personnel must use the new designated route marked with orange barriers.', 'Safety Alert', 'High', true),
    ('Confined Space Awareness', 'Mandatory toolbox talk for all operatives working in mechanical rooms, roof voids, or underground areas. Covers gas monitoring, ventilation requirements, and emergency procedures.', 'Toolbox Talk', 'Medium', true)
) AS notices(title, content, notice_type, priority, requires_signature)
WHERE NOT EXISTS (
    SELECT 1 FROM public.site_notices 
    WHERE title = notices.title AND project_id = p.whalesync_postgres_id
);

-- Create on-hire equipment
WITH projects AS (SELECT whalesync_postgres_id FROM public."Projects" LIMIT 2),
     pm_user AS (SELECT whalesync_postgres_id FROM public."Users" WHERE email = 'pm1@ajryan.co.uk' LIMIT 1)
INSERT INTO public.on_hire (project_id, item_name, supplier_name, hire_start_date, expected_end_date, status, weekly_cost, notes, requested_by)
SELECT 
    p.whalesync_postgres_id,
    equipment.item_name,
    'MEP Hire Ltd',
    equipment.hire_start_date::date,
    equipment.expected_end_date::date,
    equipment.status,
    equipment.weekly_cost,
    equipment.notes,
    pm.whalesync_postgres_id
FROM projects p
CROSS JOIN pm_user pm
CROSS JOIN (VALUES 
    ('Welfare Unit - 12 Person', '2024-06-01', '2024-12-31', 'Active', 125.00, 'Weekly clean included'),
    ('Lighting Tower - LED 9m', '2024-06-15', '2024-11-30', 'Active', 85.00, 'Automatic operation'),
    ('Power Tools Set - Makita', '2024-07-01', '2024-10-31', 'Requested Off-Hire', 95.00, 'Includes drill, saw, grinder')
) AS equipment(item_name, hire_start_date, expected_end_date, status, weekly_cost, notes)
WHERE NOT EXISTS (
    SELECT 1 FROM public.on_hire 
    WHERE item_name = equipment.item_name AND project_id = p.whalesync_postgres_id
);

-- Create timesheets for operatives
WITH operative_users AS (
    SELECT whalesync_postgres_id, fullname FROM public."Users" WHERE role = 'Operative' LIMIT 3
),
projects AS (
    SELECT whalesync_postgres_id FROM public."Projects" LIMIT 1
)
INSERT INTO public.timesheets (user_id, project_id, week_start_date, week_end_date, total_hours, status, submitted_at)
SELECT 
    ou.whalesync_postgres_id,
    p.whalesync_postgres_id,
    (CURRENT_DATE - INTERVAL '7 days')::date,
    CURRENT_DATE::date,
    37.5,
    'Submitted',
    CURRENT_DATE - INTERVAL '2 days'
FROM operative_users ou
CROSS JOIN projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.timesheets 
    WHERE user_id = ou.whalesync_postgres_id 
    AND week_start_date = (CURRENT_DATE - INTERVAL '7 days')::date
);

-- Create basic RLS policies for the new tables
DO $$ BEGIN
    -- Project team policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_team' AND policyname = 'Users can view their project assignments') THEN
        CREATE POLICY "Users can view their project assignments" ON public.project_team
            FOR SELECT USING (user_id = (SELECT whalesync_postgres_id FROM public."Users" WHERE supabase_auth_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_team' AND policyname = 'Managers can view all project assignments') THEN
        CREATE POLICY "Managers can view all project assignments" ON public.project_team
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public."Users" 
                    WHERE supabase_auth_id = auth.uid() 
                    AND role IN ('Admin', 'Project Manager', 'Supervisor')
                )
            );
    END IF;

    -- Documents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can view documents for their projects') THEN
        CREATE POLICY "Users can view documents for their projects" ON public.documents
            FOR SELECT USING (
                project_id IN (
                    SELECT pt.project_id 
                    FROM public.project_team pt
                    JOIN public."Users" u ON u.whalesync_postgres_id = pt.user_id
                    WHERE u.supabase_auth_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public."Users" 
                    WHERE supabase_auth_id = auth.uid() 
                    AND role IN ('Admin', 'DPO')
                )
            );
    END IF;

    -- Timesheets policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'timesheets' AND policyname = 'Users can view their own timesheets') THEN
        CREATE POLICY "Users can view their own timesheets" ON public.timesheets
            FOR ALL USING (
                user_id = (SELECT whalesync_postgres_id FROM public."Users" WHERE supabase_auth_id = auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public."Users" 
                    WHERE supabase_auth_id = auth.uid() 
                    AND role IN ('Admin', 'Project Manager', 'Supervisor')
                )
            );
    END IF;

    -- Suppliers policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Managers can view suppliers') THEN
        CREATE POLICY "Managers can view suppliers" ON public.suppliers
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public."Users" 
                    WHERE supabase_auth_id = auth.uid() 
                    AND role IN ('Admin', 'Project Manager', 'Supervisor')
                )
            );
    END IF;
END $$;