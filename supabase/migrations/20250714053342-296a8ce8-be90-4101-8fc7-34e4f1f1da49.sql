-- AJ Ryan SmartWork Hub - Comprehensive Demo Data Seeding
-- This migration creates realistic demo data for all modules

-- First, let's create some core lookup tables if they don't exist
CREATE TABLE IF NOT EXISTS public.project_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    user_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    role TEXT NOT NULL,
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

-- Now let's seed the demo data

-- 1. First, let's create demo projects
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
) VALUES 
(
    gen_random_uuid(),
    'Woodberry Down Phase 2',
    'Berkeley Homes',
    '1-79 Woodberry Down, London N4 2TG',
    'Project Manager 1',
    'Active',
    '2024-06-01',
    '2024-12-31',
    2500000.00,
    24,
    '2024-06-01'
),
(
    gen_random_uuid(),
    'Kidbrooke Village Block C',
    'Berkeley Homes',
    'Kidbrooke Village, London SE3 9FJ',
    'Project Manager 2',
    'Active',
    '2024-07-01',
    '2025-01-31',
    1800000.00,
    18,
    '2024-07-01'
),
(
    gen_random_uuid(),
    'Greenwich Peninsula Phase 1',
    'Knight Dragon',
    'Greenwich Peninsula, London SE10 0ER',
    'Project Manager 1',
    'On Hold',
    '2024-08-01',
    '2025-03-31',
    3200000.00,
    36,
    '2024-08-01'
);

-- 2. Create demo users (these will be linked to Supabase Auth users)
-- Insert core team members
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
) VALUES 
-- Admin
(
    gen_random_uuid(),
    'markcroud@icloud.com',
    'Mark',
    'Croud',
    'Mark Croud',
    'Admin',
    'Admin',
    'Active',
    '2024-05-01',
    'supabase',
    0.00,
    ARRAY['Management', 'Strategy', 'Operations']
),
-- DPO
(
    gen_random_uuid(),
    'dpo@ajryan.co.uk',
    'Sarah',
    'Johnson',
    'Sarah Johnson',
    'DPO',
    'Admin',
    'Active',
    '2024-05-01',
    'supabase',
    0.00,
    ARRAY['Data Protection', 'Compliance', 'Legal']
),
-- Project Managers
(
    gen_random_uuid(),
    'pm1@ajryan.co.uk',
    'James',
    'Miller',
    'James Miller',
    'Project Manager',
    'Manager',
    'Active',
    '2024-05-15',
    'supabase',
    45.00,
    ARRAY['Project Management', 'Construction', 'Planning']
),
(
    gen_random_uuid(),
    'pm2@ajryan.co.uk',
    'Emma',
    'Thompson',
    'Emma Thompson',
    'Project Manager',
    'Manager',
    'Active',
    '2024-05-15',
    'supabase',
    45.00,
    ARRAY['Project Management', 'MEP', 'Quality Control']
),
-- Supervisors
(
    gen_random_uuid(),
    'sup1@ajryan.co.uk',
    'Michael',
    'Brown',
    'Michael Brown',
    'Supervisor',
    'Supervisor',
    'Active',
    '2024-05-20',
    'supabase',
    32.00,
    ARRAY['Team Leadership', 'Quality Control', 'Safety']
),
(
    gen_random_uuid(),
    'sup2@ajryan.co.uk',
    'Lisa',
    'Davis',
    'Lisa Davis',
    'Supervisor',
    'Supervisor',
    'Active',
    '2024-05-20',
    'supabase',
    32.00,
    ARRAY['Team Leadership', 'MEP', 'Training']
),
-- Operatives
(
    gen_random_uuid(),
    'op1@ajryan.co.uk',
    'John',
    'Smith',
    'John Smith',
    'Operative',
    'Worker',
    'Active',
    '2024-06-01',
    'supabase',
    28.00,
    ARRAY['Plumbing', 'First Fix', 'Second Fix']
),
(
    gen_random_uuid(),
    'op2@ajryan.co.uk',
    'David',
    'Wilson',
    'David Wilson',
    'Operative',
    'Worker',
    'Active',
    '2024-06-01',
    'supabase',
    26.50,
    ARRAY['Electrical', 'Testing', 'Installation']
),
(
    gen_random_uuid(),
    'op3@ajryan.co.uk',
    'Robert',
    'Taylor',
    'Robert Taylor',
    'Operative',
    'Worker',
    'Active',
    '2024-06-05',
    'supabase',
    27.00,
    ARRAY['Heating', 'MVHR', 'Commissioning']
),
(
    gen_random_uuid(),
    'op4@ajryan.co.uk',
    'Chris',
    'Anderson',
    'Chris Anderson',
    'Operative',
    'Worker',
    'Active',
    '2024-06-10',
    'supabase',
    25.00,
    ARRAY['General Building', 'Maintenance', 'Repairs']
),
(
    gen_random_uuid(),
    'op5@ajryan.co.uk',
    'Paul',
    'White',
    'Paul White',
    'Operative',
    'Worker',
    'Active',
    '2024-06-15',
    'supabase',
    29.00,
    ARRAY['Gas Safe', 'Boiler Installation', 'Safety Testing']
);

-- 3. Create Levels for projects
INSERT INTO public."Levels" (
    whalesync_postgres_id,
    levelname,
    levelnumber,
    levelstatus,
    plannedstartdate,
    plannedenddate,
    plotsonlevel
) VALUES 
-- Woodberry Down Phase 2 Levels
(gen_random_uuid(), 'Ground Floor', 0, 'Completed', '2024-06-01', '2024-08-31', 6),
(gen_random_uuid(), 'First Floor', 1, 'In Progress', '2024-07-01', '2024-09-30', 6),
(gen_random_uuid(), 'Second Floor', 2, 'In Progress', '2024-08-01', '2024-10-31', 6),
(gen_random_uuid(), 'Third Floor', 3, 'Pending', '2024-09-01', '2024-11-30', 6),
-- Kidbrooke Village Block C Levels
(gen_random_uuid(), 'Ground Floor', 0, 'In Progress', '2024-07-01', '2024-09-30', 6),
(gen_random_uuid(), 'First Floor', 1, 'Pending', '2024-08-01', '2024-10-31', 6),
(gen_random_uuid(), 'Second Floor', 2, 'Pending', '2024-09-01', '2024-11-30', 6);

-- 4. Create demo plots
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
) VALUES 
-- Woodberry Down plots
(gen_random_uuid(), 'WD-001', 'Completed', 100, 2, 1, 750, '2024-08-15', 'Two bedroom apartment with balcony'),
(gen_random_uuid(), 'WD-002', 'Completed', 100, 1, 1, 550, '2024-08-20', 'One bedroom apartment'),
(gen_random_uuid(), 'WD-003', 'In Progress', 75, 3, 2, 950, '2024-09-15', 'Three bedroom apartment with garden'),
(gen_random_uuid(), 'WD-004', 'In Progress', 65, 2, 2, 800, '2024-09-20', 'Two bedroom apartment'),
(gen_random_uuid(), 'WD-005', 'Pending', 25, 2, 1, 700, '2024-10-15', 'Two bedroom apartment'),
(gen_random_uuid(), 'WD-006', 'Pending', 15, 1, 1, 500, '2024-10-20', 'Studio apartment'),
-- Kidbrooke Village plots
(gen_random_uuid(), 'KB-001', 'In Progress', 45, 2, 2, 850, '2024-10-01', 'Two bedroom apartment with study'),
(gen_random_uuid(), 'KB-002', 'In Progress', 50, 3, 2, 1100, '2024-10-15', 'Three bedroom apartment'),
(gen_random_uuid(), 'KB-003', 'Pending', 20, 2, 1, 750, '2024-11-01', 'Two bedroom apartment'),
(gen_random_uuid(), 'KB-004', 'Pending', 10, 1, 1, 600, '2024-11-15', 'One bedroom apartment');

-- 5. Create project team assignments
WITH projects AS (
    SELECT whalesync_postgres_id, projectname FROM public."Projects"
),
users AS (
    SELECT whalesync_postgres_id, email, role FROM public."Users"
)
INSERT INTO public.project_team (project_id, user_id, role)
SELECT 
    p.whalesync_postgres_id,
    u.whalesync_postgres_id,
    u.role
FROM projects p
CROSS JOIN users u
WHERE 
    (p.projectname = 'Woodberry Down Phase 2' AND u.email IN ('pm1@ajryan.co.uk', 'sup1@ajryan.co.uk', 'op1@ajryan.co.uk', 'op2@ajryan.co.uk', 'op3@ajryan.co.uk'))
    OR (p.projectname = 'Kidbrooke Village Block C' AND u.email IN ('pm2@ajryan.co.uk', 'sup2@ajryan.co.uk', 'op4@ajryan.co.uk', 'op5@ajryan.co.uk'))
    OR u.role IN ('Admin', 'DPO');

-- 6. Create suppliers
INSERT INTO public.suppliers (name, contact_email, contact_phone, performance_rating, on_time_percentage, average_overdue_days, total_orders)
VALUES 
('MEP Hire Ltd', 'orders@mephire.co.uk', '020 7123 4567', 4.5, 87.5, 2, 24),
('Speedy Hire', 'commercial@speedyhire.co.uk', '0800 400 900', 3.8, 72.3, 5, 18),
('HSS Hire', 'trade@hsshire.co.uk', '0345 641 9200', 4.2, 81.2, 3, 31),
('Brandon Hire', 'info@brandonhire.co.uk', '0800 898 2898', 4.0, 78.9, 4, 15);

-- 7. Create RAMS documents
WITH projects AS (SELECT whalesync_postgres_id, projectname FROM public."Projects"),
     admin_user AS (SELECT whalesync_postgres_id FROM public."Users" WHERE email = 'markcroud@icloud.com' LIMIT 1)
INSERT INTO public.documents (project_id, title, document_type, version, status, read_required, created_by)
SELECT 
    p.whalesync_postgres_id,
    title,
    'RAMS',
    version,
    status,
    true,
    a.whalesync_postgres_id
FROM projects p
CROSS JOIN admin_user a
CROSS JOIN (
    VALUES 
    ('MVHR Installation RAMS', 'v1.0', 'Current'),
    ('First Fix Pipework RAMS', 'v2.0', 'Current'),
    ('Electrical Testing & Commissioning RAMS', 'v1.1', 'Current'),
    ('Gas Installation RAMS', 'v3.0', 'Current'),
    ('Hot Works Permit RAMS', 'v1.0', 'Superseded')
) AS docs(title, version, status);

-- 8. Create technical drawings
WITH projects AS (SELECT whalesync_postgres_id, projectname FROM public."Projects"),
     admin_user AS (SELECT whalesync_postgres_id FROM public."Users" WHERE email = 'markcroud@icloud.com' LIMIT 1)
INSERT INTO public.documents (project_id, title, document_type, version, status, read_required, created_by)
SELECT 
    p.whalesync_postgres_id,
    title,
    'Drawing',
    version,
    status,
    false,
    a.whalesync_postgres_id
FROM projects p
CROSS JOIN admin_user a
CROSS JOIN (
    VALUES 
    ('Mechanical Layout - A1-101 Rev B', 'Rev B', 'Current'),
    ('Electrical Schematic - E1-201 Rev C', 'Rev C', 'Current'),
    ('Plumbing Riser - P1-301 Rev A', 'Rev A', 'Current'),
    ('MVHR Layout - M1-401 Rev A', 'Rev A', 'Superseded'),
    ('Gas Installation - G1-501 Rev B', 'Rev B', 'Current')
) AS docs(title, version, status);

-- 9. Create site notices
WITH projects AS (SELECT whalesync_postgres_id, projectname FROM public."Projects"),
     admin_user AS (SELECT whalesync_postgres_id FROM public."Users" WHERE email = 'markcroud@icloud.com' LIMIT 1)
INSERT INTO public.site_notices (project_id, title, content, notice_type, priority, requires_signature, valid_until, created_by)
SELECT 
    p.whalesync_postgres_id,
    title,
    content,
    notice_type,
    priority,
    requires_signature,
    CURRENT_DATE + INTERVAL '30 days',
    a.whalesync_postgres_id
FROM projects p
CROSS JOIN admin_user a
CROSS JOIN (
    VALUES 
    ('Scaffold Access Route Changed', 'Due to structural work on Level 2, the main scaffold access has been relocated to the north elevation. All personnel must use the new designated route marked with orange barriers. Old access route is strictly prohibited.', 'Safety Alert', 'High', true),
    ('Confined Space Awareness Toolbox Talk', 'Mandatory toolbox talk for all operatives working in mechanical rooms, roof voids, or underground areas. Covers gas monitoring, ventilation requirements, and emergency procedures. Certificate valid for 12 months.', 'Toolbox Talk', 'Medium', true),
    ('New PPE Requirements', 'Following HSE guidance update, all operatives must now wear high-visibility vests with reflective strips when working above ground level. Standard hi-vis no longer acceptable for elevated work.', 'General', 'Medium', false),
    ('Hot Works Permit Procedure Update', 'Updated procedure for hot works permits effective immediately. New form HW-23 must be completed 24 hours in advance. Fire warden must be present for all welding and cutting operations.', 'Safety Alert', 'High', true)
) AS notices(title, content, notice_type, priority, requires_signature);

-- 10. Create on-hire equipment
WITH projects AS (SELECT whalesync_postgres_id, projectname FROM public."Projects"),
     pm_users AS (SELECT whalesync_postgres_id, email FROM public."Users" WHERE role = 'Project Manager'),
     suppliers AS (SELECT id, name FROM public.suppliers)
INSERT INTO public.on_hire (project_id, item_name, supplier_name, hire_start_date, expected_end_date, status, weekly_cost, notes, requested_by)
SELECT 
    p.whalesync_postgres_id,
    item_name,
    s.name,
    hire_start_date,
    expected_end_date,
    status,
    weekly_cost,
    notes,
    pm.whalesync_postgres_id
FROM projects p
CROSS JOIN (
    VALUES 
    ('Welfare Unit - 12 Person', '2024-06-01', '2024-12-31', 'Active', 125.00, 'Weekly clean included'),
    ('Lighting Tower - LED 9m', '2024-06-15', '2024-11-30', 'Active', 85.00, 'Automatic operation'),
    ('Power Tools Set - Makita', '2024-07-01', '2024-10-31', 'Requested Off-Hire', 95.00, 'Includes drill, saw, grinder'),
    ('Generator - 20kVA Silent', '2024-08-01', '2024-09-30', 'Overdue', 150.00, 'Return overdue by 5 days'),
    ('Scaffold Tower - 8m', '2024-07-15', '2024-12-15', 'Active', 75.00, 'Weekly inspection required')
) AS equipment(item_name, hire_start_date, expected_end_date, status, weekly_cost, notes)
CROSS JOIN suppliers s
CROSS JOIN pm_users pm
WHERE s.name = 'MEP Hire Ltd' AND pm.email = 'pm1@ajryan.co.uk'
LIMIT 5;

-- 11. Create inductions
WITH projects AS (SELECT whalesync_postgres_id, projectname FROM public."Projects"),
     admin_user AS (SELECT whalesync_postgres_id FROM public."Users" WHERE email = 'markcroud@icloud.com' LIMIT 1)
INSERT INTO public.inductions (project_id, title, version, content, mandatory, valid_until, created_by)
SELECT 
    p.whalesync_postgres_id,
    title || ' - ' || p.projectname,
    version,
    content,
    mandatory,
    CURRENT_DATE + INTERVAL '6 months',
    a.whalesync_postgres_id
FROM projects p
CROSS JOIN admin_user a
CROSS JOIN (
    VALUES 
    ('Site Safety Induction', 'v2.1', 'Comprehensive safety briefing covering site-specific hazards, emergency procedures, PPE requirements, and reporting protocols. Includes fire evacuation routes and first aid locations.', true),
    ('MEP Systems Overview', 'v1.0', 'Technical overview of mechanical, electrical, and plumbing systems on site. Covers system layouts, isolation procedures, and quality standards. Required for all MEP operatives.', true),
    ('Environmental Awareness', 'v1.1', 'Environmental protection measures, waste segregation, noise control, and pollution prevention. Covers legal requirements and company environmental policy.', false)
) AS inductions(title, version, content, mandatory);

-- 12. Create timesheets for last 2 weeks
WITH operative_users AS (
    SELECT whalesync_postgres_id, fullname FROM public."Users" WHERE role = 'Operative'
),
projects AS (
    SELECT whalesync_postgres_id FROM public."Projects" LIMIT 2
),
week_dates AS (
    SELECT 
        CURRENT_DATE - INTERVAL '14 days' + (n * INTERVAL '7 days') AS week_start,
        CURRENT_DATE - INTERVAL '7 days' + (n * INTERVAL '7 days') AS week_end
    FROM generate_series(0, 1) AS n
)
INSERT INTO public.timesheets (user_id, project_id, week_start_date, week_end_date, total_hours, status, submitted_at)
SELECT 
    ou.whalesync_postgres_id,
    p.whalesync_postgres_id,
    wd.week_start::date,
    wd.week_end::date,
    CASE 
        WHEN ou.fullname = 'Chris Anderson' AND wd.week_start = CURRENT_DATE - INTERVAL '7 days' THEN 35.5
        ELSE 37.5
    END,
    CASE 
        WHEN ou.fullname = 'Chris Anderson' AND wd.week_start = CURRENT_DATE - INTERVAL '7 days' THEN 'Disputed'
        WHEN wd.week_start = CURRENT_DATE - INTERVAL '14 days' THEN 'Approved'
        ELSE 'Submitted'
    END,
    wd.week_start + INTERVAL '5 days'
FROM operative_users ou
CROSS JOIN projects p
CROSS JOIN week_dates wd
LIMIT 10;

-- 13. Create timesheet entries
WITH recent_timesheets AS (
    SELECT id, user_id, week_start_date FROM public.timesheets ORDER BY created_at DESC LIMIT 10
),
work_days AS (
    SELECT generate_series(0, 4) AS day_offset -- Monday to Friday
)
INSERT INTO public.timesheet_entries (timesheet_id, work_date, hours_worked, work_description)
SELECT 
    rt.id,
    (rt.week_start_date + (wd.day_offset * INTERVAL '1 day'))::date,
    CASE 
        WHEN random() < 0.1 THEN 0 -- 10% chance of no work (sick/holiday)
        WHEN random() < 0.3 THEN 7.5 -- 20% chance of half day
        ELSE 7.5 -- Normal working day
    END,
    CASE (random() * 4)::int
        WHEN 0 THEN 'First fix plumbing installation'
        WHEN 1 THEN 'Electrical testing and commissioning'
        WHEN 2 THEN 'MVHR installation and ducting'
        WHEN 3 THEN 'Gas safe installation and testing'
        ELSE 'General MEP work'
    END
FROM recent_timesheets rt
CROSS JOIN work_days wd;

-- 14. Create signatures for RAMS and site notices
WITH operatives AS (SELECT whalesync_postgres_id FROM public."Users" WHERE role = 'Operative'),
     rams_docs AS (SELECT id FROM public.documents WHERE document_type = 'RAMS' AND status = 'Current' LIMIT 3),
     notices AS (SELECT id FROM public.site_notices WHERE requires_signature = true LIMIT 2)
INSERT INTO public.signatures (user_id, document_id, signature_data, signed_at, device_info)
SELECT 
    o.whalesync_postgres_id,
    r.id,
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    NOW() - (random() * INTERVAL '30 days'),
    '{"device": "iPad", "browser": "Safari", "os": "iOS"}'::jsonb
FROM operatives o
CROSS JOIN rams_docs r
WHERE random() < 0.7; -- 70% of operatives have signed each RAMS

-- Insert signatures for site notices
WITH operatives AS (SELECT whalesync_postgres_id FROM public."Users" WHERE role = 'Operative'),
     notices AS (SELECT id FROM public.site_notices WHERE requires_signature = true LIMIT 2)
INSERT INTO public.signatures (user_id, site_notice_id, signature_data, signed_at, device_info)
SELECT 
    o.whalesync_postgres_id,
    n.id,
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    NOW() - (random() * INTERVAL '7 days'),
    '{"device": "iPhone", "browser": "Safari", "os": "iOS"}'::jsonb
FROM operatives o
CROSS JOIN notices n
WHERE random() < 0.6; -- 60% of operatives have signed each notice

-- 15. Create basic RLS policies for the new tables
-- Project team policies
CREATE POLICY "Users can view their project assignments" ON public.project_team
    FOR SELECT USING (user_id = (SELECT whalesync_postgres_id FROM public."Users" WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Managers can view all project assignments" ON public.project_team
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Project Manager', 'Supervisor')
        )
    );

-- Documents policies
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

-- Site notices policies
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

-- Timesheets policies
CREATE POLICY "Users can view their own timesheets" ON public.timesheets
    FOR ALL USING (
        user_id = (SELECT whalesync_postgres_id FROM public."Users" WHERE supabase_auth_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Project Manager', 'Supervisor')
        )
    );

-- Signatures policies
CREATE POLICY "Users can view their own signatures" ON public.signatures
    FOR ALL USING (
        user_id = (SELECT whalesync_postgres_id FROM public."Users" WHERE supabase_auth_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'DPO', 'Project Manager')
        )
    );

-- Suppliers policies (admin/managers only)
CREATE POLICY "Managers can view suppliers" ON public.suppliers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Users" 
            WHERE supabase_auth_id = auth.uid() 
            AND role IN ('Admin', 'Project Manager', 'Supervisor')
        )
    );

-- On-hire policies
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