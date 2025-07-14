-- AJ Ryan SmartWork Hub - Final Setup (Simplified)
-- Create missing core tables without conflicting with existing triggers

-- Create missing core tables
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

-- Create RLS policies
DO $$ BEGIN
    -- Documents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can view project documents') THEN
        CREATE POLICY "Users can view project documents" ON public.documents
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

    -- Site notices policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_notices' AND policyname = 'Users can view project notices') THEN
        CREATE POLICY "Users can view project notices" ON public.site_notices
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

    -- On-hire policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'on_hire' AND policyname = 'Users can view project equipment') THEN
        CREATE POLICY "Users can view project equipment" ON public.on_hire
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

-- Seed demo data
INSERT INTO public.suppliers (name, contact_email, contact_phone, performance_rating, on_time_percentage, average_overdue_days, total_orders)
SELECT * FROM (VALUES 
    ('MEP Hire Ltd', 'orders@mephire.co.uk', '020 7123 4567', 4.5, 87.5, 2, 24),
    ('Speedy Hire', 'commercial@speedyhire.co.uk', '0800 400 900', 3.8, 72.3, 5, 18),
    ('HSS Hire', 'trade@hsshire.co.uk', '0345 641 9200', 4.2, 81.2, 3, 31)
) AS new_suppliers(name, contact_email, contact_phone, performance_rating, on_time_percentage, average_overdue_days, total_orders)
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE name = new_suppliers.name)
ON CONFLICT DO NOTHING;