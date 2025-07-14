-- AJ Ryan SmartWork Hub - Final Demo Data Seeding
-- This migration creates realistic demo data that works with existing schema

-- Create missing tables that don't exist yet
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    version TEXT DEFAULT 'v1.0',
    status TEXT DEFAULT 'Current',
    file_url TEXT,
    read_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id)
);

CREATE TABLE IF NOT EXISTS public.site_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    notice_type TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
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
    status TEXT DEFAULT 'Active',
    weekly_cost DECIMAL(10,2),
    notes TEXT,
    requested_by UUID REFERENCES public."Users"(whalesync_postgres_id),
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

-- Enable RLS on new tables
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'documents' AND schemaname = 'public') THEN
        ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'site_notices' AND schemaname = 'public') THEN
        ALTER TABLE public.site_notices ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'on_hire' AND schemaname = 'public') THEN
        ALTER TABLE public.on_hire ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'suppliers' AND schemaname = 'public') THEN
        ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create demo projects (skip if they already exist)
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
    (gen_random_uuid(), 'Kidbrooke Village Block C', 'Berkeley Homes', 'Kidbrooke Village, London SE3 9FJ', 'Emma Thompson', 'Active', '2024-07-01'::date, '2025-01-31'::date, 1800000.00::real, 18, '2024-07-01'::date)
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
    (gen_random_uuid(), 'pm1@ajryan.co.uk', 'James', 'Miller', 'James Miller', 'Project Manager', 'Manager', 'Active', '2024-05-15'::date, 'supabase', 45.00::real, ARRAY['Project Management', 'Construction', 'Planning']),
    (gen_random_uuid(), 'sup1@ajryan.co.uk', 'Michael', 'Brown', 'Michael Brown', 'Supervisor', 'Supervisor', 'Active', '2024-05-20'::date, 'supabase', 32.00::real, ARRAY['Team Leadership', 'Quality Control', 'Safety']),
    (gen_random_uuid(), 'op1@ajryan.co.uk', 'John', 'Smith', 'John Smith', 'Operative', 'Worker', 'Active', '2024-06-01'::date, 'supabase', 28.00::real, ARRAY['Plumbing', 'First Fix', 'Second Fix']),
    (gen_random_uuid(), 'op2@ajryan.co.uk', 'David', 'Wilson', 'David Wilson', 'Operative', 'Worker', 'Active', '2024-06-01'::date, 'supabase', 26.50::real, ARRAY['Electrical', 'Testing', 'Installation'])
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
    (gen_random_uuid(), 'KB-001', 'In Progress', 45, 2, 2, 850, '2024-10-01'::date, 'Two bedroom apartment with study'),
    (gen_random_uuid(), 'KB-002', 'In Progress', 50, 3, 2, 1100, '2024-10-15'::date, 'Three bedroom apartment')
) AS new_plots(whalesync_postgres_id, plotnumber, plotstatus, completion_percentage, numberofbedrooms, numberofbathrooms, floorarea, plannedhandoverdate, plotnotes)
WHERE NOT EXISTS (SELECT 1 FROM public."Plots" WHERE plotnumber = new_plots.plotnumber);

-- Create suppliers (skip if they already exist)
INSERT INTO public.suppliers (name, contact_email, contact_phone, performance_rating, on_time_percentage, average_overdue_days, total_orders)
SELECT * FROM (VALUES 
    ('MEP Hire Ltd', 'orders@mephire.co.uk', '020 7123 4567', 4.5, 87.5, 2, 24),
    ('Speedy Hire', 'commercial@speedyhire.co.uk', '0800 400 900', 3.8, 72.3, 5, 18),
    ('HSS Hire', 'trade@hsshire.co.uk', '0345 641 9200', 4.2, 81.2, 3, 31)
) AS new_suppliers(name, contact_email, contact_phone, performance_rating, on_time_percentage, average_overdue_days, total_orders)
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE name = new_suppliers.name);

-- Create project team assignments using the CORRECT role mapping
WITH projects AS (
    SELECT whalesync_postgres_id, projectname FROM public."Projects" WHERE projectname IN ('Woodberry Down Phase 2', 'Kidbrooke Village Block C')
),
users AS (
    SELECT whalesync_postgres_id, email, role FROM public."Users" WHERE email IN ('pm1@ajryan.co.uk', 'sup1@ajryan.co.uk', 'op1@ajryan.co.uk', 'op2@ajryan.co.uk', 'markcroud@icloud.com')
)
INSERT INTO public.project_team (project_id, user_id, role)
SELECT DISTINCT
    p.whalesync_postgres_id,
    u.whalesync_postgres_id,
    CASE 
        WHEN u.role = 'Project Manager' THEN 'PM'
        WHEN u.role = 'Operative' THEN 'Worker'
        ELSE u.role  -- Admin, Supervisor remain the same
    END AS mapped_role
FROM projects p
CROSS JOIN users u
WHERE 
    (p.projectname = 'Woodberry Down Phase 2' AND u.email IN ('pm1@ajryan.co.uk', 'sup1@ajryan.co.uk', 'op1@ajryan.co.uk', 'op2@ajryan.co.uk'))
    OR u.role = 'Admin'
ON CONFLICT DO NOTHING;

-- Create RAMS documents
WITH projects AS (SELECT whalesync_postgres_id FROM public."Projects" LIMIT 2),
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

-- Create sample timesheets using existing schema
WITH operative_users AS (
    SELECT whalesync_postgres_id, fullname FROM public."Users" WHERE role = 'Operative' LIMIT 2
)
INSERT INTO public.timesheets (user_id, week_start_date, week_end_date, total_hours, status, submitted_at)
SELECT 
    ou.whalesync_postgres_id,
    (CURRENT_DATE - INTERVAL '7 days')::date,
    CURRENT_DATE::date,
    37.5,
    'Submitted',
    CURRENT_DATE - INTERVAL '2 days'
FROM operative_users ou
WHERE NOT EXISTS (
    SELECT 1 FROM public.timesheets 
    WHERE user_id = ou.whalesync_postgres_id 
    AND week_start_date = (CURRENT_DATE - INTERVAL '7 days')::date
);

-- Create basic RLS policies
DO $$ BEGIN
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

    -- Site notices policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_notices' AND policyname = 'Users can view site notices for their projects') THEN
        CREATE POLICY "Users can view site notices for their projects" ON public.site_notices
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

    -- On-hire policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'on_hire' AND policyname = 'Users can view on-hire for their projects') THEN
        CREATE POLICY "Users can view on-hire for their projects" ON public.on_hire
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
                    AND role IN ('Admin', 'Project Manager')
                )
            );
    END IF;
END $$;