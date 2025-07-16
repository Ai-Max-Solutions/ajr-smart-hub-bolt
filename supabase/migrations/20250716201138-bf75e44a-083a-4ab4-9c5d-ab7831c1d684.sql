-- Drop existing tables to start fresh
DROP TABLE IF EXISTS public.taskplanrams CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.enhanced_audit_log CASCADE;
DROP TABLE IF EXISTS public.contractor_companies CASCADE;
DROP TABLE IF EXISTS public.contractor_profiles CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.rams_documents CASCADE;
DROP TABLE IF EXISTS public.task_plan_rams_register CASCADE;
DROP TABLE IF EXISTS public.work_activity_categories CASCADE;

-- Create enums
CREATE TYPE public.user_role_enum AS ENUM ('Operative', 'Supervisor', 'Admin', 'PM', 'Director');
CREATE TYPE public.work_status_enum AS ENUM ('Available', 'In Progress', 'Completed', 'On Hold');
CREATE TYPE public.hire_status_enum AS ENUM ('Available', 'On Hire', 'Maintenance', 'Damaged');
CREATE TYPE public.timesheet_status_enum AS ENUM ('Draft', 'Submitted', 'Approved', 'Rejected');

-- Create Users table (connected to Supabase Auth)
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supabase_auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role public.user_role_enum NOT NULL DEFAULT 'Operative',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Projects table
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    client TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Plots table
CREATE TABLE public.plots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Work Categories table
CREATE TABLE public.work_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    main_category TEXT NOT NULL,
    sub_task TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Timesheets table
CREATE TABLE public.timesheets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    week_commencing DATE NOT NULL,
    status public.timesheet_status_enum NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Timesheet Entries table
CREATE TABLE public.timesheet_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    timesheet_id UUID NOT NULL REFERENCES public.timesheets(id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    work_category_id UUID NOT NULL REFERENCES public.work_categories(id) ON DELETE CASCADE,
    hours DECIMAL(4,2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Qualifications table
CREATE TABLE public.qualifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create User Qualifications table
CREATE TABLE public.user_qualifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    qualification_id UUID NOT NULL REFERENCES public.qualifications(id) ON DELETE CASCADE,
    obtained_date DATE NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, qualification_id)
);

-- Create User Job Rates table
CREATE TABLE public.user_job_rates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role public.user_role_enum NOT NULL,
    hourly_rate DECIMAL(8,2) NOT NULL CHECK (hourly_rate >= 0),
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create On Hire Items table
CREATE TABLE public.on_hire_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    status public.hire_status_enum NOT NULL DEFAULT 'Available',
    daily_rate DECIMAL(8,2) NOT NULL CHECK (daily_rate >= 0),
    current_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    hired_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    hire_date DATE,
    return_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_job_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.on_hire_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Users
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own record" ON public.users FOR UPDATE USING (auth.uid() = supabase_auth_id);
CREATE POLICY "Users can insert their own record" ON public.users FOR INSERT WITH CHECK (auth.uid() = supabase_auth_id);

-- Create RLS policies for Projects (viewable by all authenticated users)
CREATE POLICY "Projects are viewable by authenticated users" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage projects" ON public.projects FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Admin', 'PM', 'Director'))
);

-- Create RLS policies for Plots
CREATE POLICY "Plots are viewable by authenticated users" ON public.plots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage plots" ON public.plots FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Admin', 'PM', 'Director'))
);

-- Create RLS policies for Work Categories (viewable by all authenticated users)
CREATE POLICY "Work categories are viewable by authenticated users" ON public.work_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage work categories" ON public.work_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Admin', 'Director'))
);

-- Create RLS policies for Timesheets
CREATE POLICY "Users can view their own timesheets" ON public.timesheets FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid())
);
CREATE POLICY "Supervisors can view team timesheets" ON public.timesheets FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Supervisor', 'PM', 'Admin', 'Director'))
);
CREATE POLICY "Users can create their own timesheets" ON public.timesheets FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid())
);
CREATE POLICY "Users can update their own timesheets" ON public.timesheets FOR UPDATE USING (
    user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid())
);

-- Create RLS policies for Timesheet Entries
CREATE POLICY "Users can view their own timesheet entries" ON public.timesheet_entries FOR SELECT USING (
    timesheet_id IN (
        SELECT t.id FROM public.timesheets t 
        JOIN public.users u ON t.user_id = u.id 
        WHERE u.supabase_auth_id = auth.uid()
    )
);
CREATE POLICY "Supervisors can view team timesheet entries" ON public.timesheet_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Supervisor', 'PM', 'Admin', 'Director'))
);
CREATE POLICY "Users can manage their own timesheet entries" ON public.timesheet_entries FOR ALL USING (
    timesheet_id IN (
        SELECT t.id FROM public.timesheets t 
        JOIN public.users u ON t.user_id = u.id 
        WHERE u.supabase_auth_id = auth.uid()
    )
);

-- Create RLS policies for other tables (viewable by authenticated users)
CREATE POLICY "Qualifications are viewable by authenticated users" ON public.qualifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage qualifications" ON public.qualifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Admin', 'Director'))
);

CREATE POLICY "Users can view their own qualifications" ON public.user_qualifications FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid())
);
CREATE POLICY "Supervisors can view team qualifications" ON public.user_qualifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Supervisor', 'PM', 'Admin', 'Director'))
);
CREATE POLICY "Admins can manage user qualifications" ON public.user_qualifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Admin', 'Director'))
);

CREATE POLICY "Users can view their own job rates" ON public.user_job_rates FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid())
);
CREATE POLICY "Supervisors can view team job rates" ON public.user_job_rates FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Supervisor', 'PM', 'Admin', 'Director'))
);
CREATE POLICY "Admins can manage job rates" ON public.user_job_rates FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Admin', 'Director'))
);

CREATE POLICY "On hire items are viewable by authenticated users" ON public.on_hire_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Supervisors can manage on hire items" ON public.on_hire_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth.uid() AND role IN ('Supervisor', 'PM', 'Admin', 'Director'))
);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON public.plots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_categories_updated_at BEFORE UPDATE ON public.work_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON public.timesheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timesheet_entries_updated_at BEFORE UPDATE ON public.timesheet_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_qualifications_updated_at BEFORE UPDATE ON public.qualifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_qualifications_updated_at BEFORE UPDATE ON public.user_qualifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_job_rates_updated_at BEFORE UPDATE ON public.user_job_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_on_hire_items_updated_at BEFORE UPDATE ON public.on_hire_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Data: Users (10 users with mix of roles)
INSERT INTO public.users (name, email, phone, role) VALUES
('John Smith', 'john.smith@ajryan.co.uk', '07700123456', 'Director'),
('Sarah Johnson', 'sarah.johnson@ajryan.co.uk', '07700123457', 'PM'),
('Mike Wilson', 'mike.wilson@ajryan.co.uk', '07700123458', 'Supervisor'),
('Emma Davis', 'emma.davis@ajryan.co.uk', '07700123459', 'Admin'),
('Tom Brown', 'tom.brown@ajryan.co.uk', '07700123460', 'Operative'),
('Lisa Taylor', 'lisa.taylor@ajryan.co.uk', '07700123461', 'Operative'),
('David Jones', 'david.jones@ajryan.co.uk', '07700123462', 'Supervisor'),
('Claire White', 'claire.white@ajryan.co.uk', '07700123463', 'Operative'),
('Mark Thompson', 'mark.thompson@ajryan.co.uk', '07700123464', 'Operative'),
('Helen Clark', 'helen.clark@ajryan.co.uk', '07700123465', 'PM');

-- Seed Data: Projects (3 projects with DO371-style codes)
INSERT INTO public.projects (name, code, client, start_date, end_date) VALUES
('Manchester City Centre Development', 'DO371', 'Balfour Beatty', '2024-01-15', '2024-12-31'),
('Birmingham Hospital Extension', 'DO372', 'Skanska UK', '2024-03-01', '2025-02-28'),
('Leeds University Campus', 'DO373', 'Morgan Sindall', '2024-06-01', '2025-05-31');

-- Seed Data: Plots (6-8 plots per project)
WITH project_ids AS (
    SELECT id, code FROM public.projects
)
INSERT INTO public.plots (project_id, name, level) VALUES
-- DO371 plots
((SELECT id FROM project_ids WHERE code = 'DO371'), 'Block A - Level 2', 'Level 2'),
((SELECT id FROM project_ids WHERE code = 'DO371'), 'Block A - Level 3', 'Level 3'),
((SELECT id FROM project_ids WHERE code = 'DO371'), 'Block B - Ground Floor', 'Ground Floor'),
((SELECT id FROM project_ids WHERE code = 'DO371'), 'Block B - Level 1', 'Level 1'),
((SELECT id FROM project_ids WHERE code = 'DO371'), 'Mechanical Plant Room', 'Basement'),
((SELECT id FROM project_ids WHERE code = 'DO371'), 'Electrical Switchroom', 'Ground Floor'),
-- DO372 plots
((SELECT id FROM project_ids WHERE code = 'DO372'), 'Ward Block - Level 4', 'Level 4'),
((SELECT id FROM project_ids WHERE code = 'DO372'), 'Ward Block - Level 5', 'Level 5'),
((SELECT id FROM project_ids WHERE code = 'DO372'), 'Theatre Suite', 'Level 2'),
((SELECT id FROM project_ids WHERE code = 'DO372'), 'ICU Extension', 'Level 3'),
((SELECT id FROM project_ids WHERE code = 'DO372'), 'Plant Room Extension', 'Roof Level'),
((SELECT id FROM project_ids WHERE code = 'DO372'), 'Emergency Generator Room', 'Basement'),
-- DO373 plots
((SELECT id FROM project_ids WHERE code = 'DO373'), 'Science Block - Level 1', 'Level 1'),
((SELECT id FROM project_ids WHERE code = 'DO373'), 'Science Block - Level 2', 'Level 2'),
((SELECT id FROM project_ids WHERE code = 'DO373'), 'Library Extension', 'Ground Floor'),
((SELECT id FROM project_ids WHERE code = 'DO373'), 'Student Accommodation Block A', 'Various'),
((SELECT id FROM project_ids WHERE code = 'DO373'), 'Central Plant Room', 'Basement'),
((SELECT id FROM project_ids WHERE code = 'DO373'), 'Lecture Theatre Complex', 'Ground Floor');

-- Seed Data: Work Categories (8 main categories with sub-tasks)
INSERT INTO public.work_categories (main_category, sub_task) VALUES
('Testing', 'Pressure Testing'),
('Testing', 'Leak Detection'),
('Testing', 'System Commissioning'),
('Installations', 'Pipe Installation'),
('Installations', 'Radiator Installation'),
('Installations', 'Boiler Installation'),
('Installations', 'Electrical Wiring'),
('Fix Stages', 'First Fix Plumbing'),
('Fix Stages', 'Second Fix Plumbing'),
('Fix Stages', 'First Fix Electrical'),
('Fix Stages', 'Second Fix Electrical'),
('Fault Finding', 'Heating System Diagnostics'),
('Fault Finding', 'Electrical Fault Diagnosis'),
('Fault Finding', 'Water System Investigation'),
('Labouring', 'General Labouring'),
('Labouring', 'Material Handling'),
('Labouring', 'Site Cleanup'),
('Site Management', 'Site Supervision'),
('Site Management', 'Health & Safety Checks'),
('Site Management', 'Progress Monitoring'),
('Repairs', 'Emergency Repairs'),
('Repairs', 'Preventive Maintenance'),
('Repairs', 'System Repairs'),
('Sign-Offs', 'Final Inspection'),
('Sign-Offs', 'System Handover'),
('Sign-Offs', 'Documentation Review');

-- Seed Data: Qualifications
INSERT INTO public.qualifications (name, description) VALUES
('City & Guilds Level 2 Plumbing', 'Plumbing and Heating Qualification'),
('City & Guilds Level 3 Plumbing', 'Advanced Plumbing and Heating'),
('18th Edition Electrical', 'Electrical Installation Regulations'),
('CSCS Card', 'Construction Skills Certification'),
('First Aid at Work', 'First Aid Certification'),
('IPAF (3a & 3b)', 'Mobile Elevated Work Platform'),
('Asbestos Awareness', 'Asbestos Safety Training'),
('Manual Handling', 'Safe Lifting Techniques');

-- Seed Data: On Hire Items (5 items with cycling status)
INSERT INTO public.on_hire_items (name, category, status, daily_rate, current_project_id, hired_by, hire_date) VALUES
('110V Drill SDS Max', 'Power Tools', 'On Hire', 15.50, (SELECT id FROM public.projects WHERE code = 'DO371'), (SELECT id FROM public.users WHERE name = 'Tom Brown'), '2024-07-15'),
('Pipe Threading Machine', 'Plumbing Tools', 'Available', 45.00, NULL, NULL, NULL),
('Electrical Tester (PAT)', 'Electrical Tools', 'On Hire', 25.00, (SELECT id FROM public.projects WHERE code = 'DO372'), (SELECT id FROM public.users WHERE name = 'Claire White'), '2024-07-14'),
('Pressure Washer', 'Cleaning Equipment', 'Maintenance', 20.00, NULL, NULL, NULL),
('Hydraulic Pipe Bender', 'Plumbing Tools', 'Available', 35.00, NULL, NULL, NULL);

-- Create sample timesheets using simple approach
DO $$
DECLARE
    operatives_cursor CURSOR FOR 
        SELECT id, name FROM public.users WHERE role IN ('Operative', 'Supervisor') LIMIT 6;
    projects_cursor CURSOR FOR 
        SELECT id, code FROM public.projects;
    user_rec RECORD;
    project_rec RECORD;
    timesheet_id UUID;
    counter INTEGER := 0;
BEGIN
    FOR user_rec IN operatives_cursor LOOP
        FOR project_rec IN projects_cursor LOOP
            counter := counter + 1;
            -- Create timesheet
            INSERT INTO public.timesheets (user_id, project_id, week_commencing, status)
            VALUES (
                user_rec.id,
                project_rec.id,
                '2024-07-08'::date,
                CASE 
                    WHEN counter % 4 = 0 THEN 'Approved'::timesheet_status_enum
                    WHEN counter % 3 = 0 THEN 'Submitted'::timesheet_status_enum
                    ELSE 'Draft'::timesheet_status_enum
                END
            ) RETURNING id INTO timesheet_id;
            
            -- Create some timesheet entries for each timesheet
            INSERT INTO public.timesheet_entries (timesheet_id, plot_id, work_category_id, hours, notes)
            SELECT 
                timesheet_id,
                pl.id,
                wc.id,
                ROUND((RANDOM() * 8 + 1)::numeric, 2),
                'Work completed as scheduled'
            FROM public.plots pl
            JOIN public.work_categories wc ON true
            WHERE pl.project_id = project_rec.id
            LIMIT 5;
            
            EXIT WHEN counter >= 8;
        END LOOP;
        EXIT WHEN counter >= 8;
    END LOOP;
END $$;