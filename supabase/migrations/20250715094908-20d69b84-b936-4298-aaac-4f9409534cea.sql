-- Phase 1: Database Architecture for Task Plan / RAMS Register (Fixed)

-- Create work activity categories table
CREATE TABLE public.work_activity_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#acb7d1',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert common construction work activities
INSERT INTO public.work_activity_categories (name, code, description, display_order) VALUES
('1st Fix Electrical', '1FE', 'First fix electrical installation work', 1),
('2nd Fix Electrical', '2FE', 'Second fix electrical installation work', 2),
('1st Fix Plumbing', '1FP', 'First fix plumbing installation work', 3),
('2nd Fix Plumbing', '2FP', 'Second fix plumbing installation work', 4),
('Gas Installation', 'GAS', 'Gas fitting and installation work', 5),
('Heating Installation', 'HTG', 'Heating system installation work', 6),
('General Construction', 'GEN', 'General construction and building work', 7),
('Fire Safety Systems', 'FIR', 'Fire alarm and safety system installation', 8),
('HVAC Installation', 'HVC', 'Heating, ventilation and air conditioning work', 9),
('Groundworks', 'GRD', 'Excavation and groundwork activities', 10);

-- Create the core Task Plan / RAMS Register table
CREATE TABLE public.task_plan_rams_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    project_name TEXT NOT NULL,
    subcontractor_company TEXT NOT NULL,
    contractor_id UUID REFERENCES public.contractor_profiles(id),
    work_activity_id UUID REFERENCES public.work_activity_categories(id),
    work_activity TEXT NOT NULL,
    rams_document_id UUID REFERENCES public.rams_documents(id),
    rams_name TEXT NOT NULL,
    version TEXT NOT NULL,
    date_issued TIMESTAMP WITH TIME ZONE DEFAULT now(),
    responsible_person TEXT NOT NULL,
    status TEXT DEFAULT 'Outstanding' CHECK (status IN ('Outstanding', 'Signed', 'Expired', 'Superseded')),
    signed_by TEXT,
    date_signed TIMESTAMP WITH TIME ZONE,
    signature_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    
    -- Ensure unique assignments per contractor/work activity/version
    UNIQUE(contractor_id, work_activity_id, rams_document_id, version)
);

-- Add work activities to contractor profiles (only if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contractor_profiles' 
        AND column_name = 'assigned_work_activities'
    ) THEN
        ALTER TABLE public.contractor_profiles 
        ADD COLUMN assigned_work_activities UUID[] DEFAULT '{}';
    END IF;
END $$;

-- Create contractor work activity assignments table
CREATE TABLE public.contractor_work_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
    work_activity_id UUID REFERENCES public.work_activity_categories(id),
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    assigned_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(contractor_id, work_activity_id, project_id)
);

-- Add version tracking to RAMS documents (only if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rams_documents' 
        AND column_name = 'document_version'
    ) THEN
        ALTER TABLE public.rams_documents 
        ADD COLUMN document_version TEXT DEFAULT '1.0';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rams_documents' 
        AND column_name = 'is_current_version'
    ) THEN
        ALTER TABLE public.rams_documents 
        ADD COLUMN is_current_version BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rams_documents' 
        AND column_name = 'version_notes'
    ) THEN
        ALTER TABLE public.rams_documents 
        ADD COLUMN version_notes TEXT;
    END IF;
END $$;

-- Create RAMS signatures tracking table (enhanced from existing)
CREATE TABLE public.rams_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    register_entry_id UUID REFERENCES public.task_plan_rams_register(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES public.contractor_profiles(id),
    rams_document_id UUID REFERENCES public.rams_documents(id),
    document_version TEXT NOT NULL,
    signature_data TEXT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reading_time_seconds INTEGER,
    ip_address INET,
    device_info JSONB,
    is_valid BOOLEAN DEFAULT true,
    invalidated_at TIMESTAMP WITH TIME ZONE,
    invalidated_reason TEXT,
    
    UNIQUE(contractor_id, rams_document_id, document_version)
);

-- Enable RLS on all new tables
ALTER TABLE public.work_activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_plan_rams_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_work_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rams_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_activity_categories
CREATE POLICY "Everyone can view work activity categories" 
ON public.work_activity_categories FOR SELECT 
USING (true);

-- RLS Policies for task_plan_rams_register
CREATE POLICY "Admins can manage all register entries" 
ON public.task_plan_rams_register FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
));

CREATE POLICY "Contractors can view own register entries" 
ON public.task_plan_rams_register FOR SELECT 
USING (contractor_id IN (
    SELECT id FROM public.contractor_profiles 
    WHERE auth_user_id = auth.uid()
));

-- RLS Policies for contractor_work_assignments
CREATE POLICY "Admins can manage work assignments" 
ON public.contractor_work_assignments FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
));

CREATE POLICY "Contractors can view own assignments" 
ON public.contractor_work_assignments FOR SELECT 
USING (contractor_id IN (
    SELECT id FROM public.contractor_profiles 
    WHERE auth_user_id = auth.uid()
));

-- RLS Policies for rams_signatures
CREATE POLICY "Admins can view all signatures" 
ON public.rams_signatures FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
));

CREATE POLICY "Contractors can manage own signatures" 
ON public.rams_signatures FOR ALL 
USING (contractor_id IN (
    SELECT id FROM public.contractor_profiles 
    WHERE auth_user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_task_plan_rams_register_contractor ON public.task_plan_rams_register(contractor_id);
CREATE INDEX idx_task_plan_rams_register_project ON public.task_plan_rams_register(project_id);
CREATE INDEX idx_task_plan_rams_register_status ON public.task_plan_rams_register(status);
CREATE INDEX idx_contractor_work_assignments_contractor ON public.contractor_work_assignments(contractor_id);
CREATE INDEX idx_rams_signatures_contractor ON public.rams_signatures(contractor_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_work_activity_categories_updated_at
    BEFORE UPDATE ON public.work_activity_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_plan_rams_register_updated_at
    BEFORE UPDATE ON public.task_plan_rams_register
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create register entries when contractors are assigned work activities
CREATE OR REPLACE FUNCTION public.auto_assign_rams_for_work_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- When a contractor is assigned a work activity, automatically create register entries
    -- for all RAMS documents that apply to that work activity
    INSERT INTO public.task_plan_rams_register (
        project_id,
        project_name,
        subcontractor_company,
        contractor_id,
        work_activity_id,
        work_activity,
        rams_document_id,
        rams_name,
        version,
        responsible_person,
        created_by
    )
    SELECT 
        NEW.project_id,
        p.projectname,
        cc.company_name,
        NEW.contractor_id,
        NEW.work_activity_id,
        wac.name,
        rd.id,
        rd.title,
        rd.document_version,
        COALESCE(u.fullname, 'System'),
        NEW.assigned_by
    FROM public.work_activity_categories wac
    JOIN public.rams_documents rd ON rd.work_types && ARRAY[wac.code]
    JOIN public.contractor_profiles cp ON cp.id = NEW.contractor_id
    JOIN public.contractor_companies cc ON cc.id = cp.company_id
    LEFT JOIN public."Projects" p ON p.whalesync_postgres_id = NEW.project_id
    LEFT JOIN public."Users" u ON u.whalesync_postgres_id = NEW.assigned_by
    WHERE wac.id = NEW.work_activity_id
    AND rd.is_current_version = true
    AND NOT EXISTS (
        SELECT 1 FROM public.task_plan_rams_register tprr
        WHERE tprr.contractor_id = NEW.contractor_id
        AND tprr.work_activity_id = NEW.work_activity_id
        AND tprr.rams_document_id = rd.id
        AND tprr.version = rd.document_version
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_rams
    AFTER INSERT ON public.contractor_work_assignments
    FOR EACH ROW EXECUTE FUNCTION public.auto_assign_rams_for_work_activity();

-- Function to handle RAMS version updates and mark old signatures as superseded
CREATE OR REPLACE FUNCTION public.handle_rams_version_update()
RETURNS TRIGGER AS $$
BEGIN
    -- When a RAMS document version is updated, mark old register entries as superseded
    -- and create new entries for the new version
    IF OLD.document_version != NEW.document_version THEN
        -- Mark old entries as superseded
        UPDATE public.task_plan_rams_register
        SET status = 'Superseded'
        WHERE rams_document_id = NEW.id
        AND version = OLD.document_version
        AND status IN ('Outstanding', 'Signed');
        
        -- Create new register entries for contractors who had the old version
        INSERT INTO public.task_plan_rams_register (
            project_id,
            project_name,
            subcontractor_company,
            contractor_id,
            work_activity_id,
            work_activity,
            rams_document_id,
            rams_name,
            version,
            responsible_person,
            created_by
        )
        SELECT 
            old_reg.project_id,
            old_reg.project_name,
            old_reg.subcontractor_company,
            old_reg.contractor_id,
            old_reg.work_activity_id,
            old_reg.work_activity,
            NEW.id,
            NEW.title,
            NEW.document_version,
            old_reg.responsible_person,
            old_reg.created_by
        FROM public.task_plan_rams_register old_reg
        WHERE old_reg.rams_document_id = NEW.id
        AND old_reg.version = OLD.document_version
        AND old_reg.status = 'Superseded';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_rams_version_update
    AFTER UPDATE ON public.rams_documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_rams_version_update();