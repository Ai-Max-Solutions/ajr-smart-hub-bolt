-- Create enhanced_audit_log table (extends audit_log)
CREATE TABLE public.enhanced_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID,
    ip_address TEXT,
    evidence_chain_hash TEXT,
    gdpr_retention_category TEXT DEFAULT 'standard',
    legal_hold BOOLEAN DEFAULT false
);

-- Create contractor_companies table
CREATE TABLE public.contractor_companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contractor_profiles table
CREATE TABLE public.contractor_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    company_id UUID REFERENCES public.contractor_companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work_activity_categories table
CREATE TABLE public.work_activity_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rams_documents table
CREATE TABLE public.rams_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    document_version TEXT NOT NULL,
    work_types TEXT[],
    is_current_version BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_plan_rams_register table
CREATE TABLE public.task_plan_rams_register (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    project_name TEXT NOT NULL,
    subcontractor_company TEXT NOT NULL,
    contractor_id UUID REFERENCES public.contractor_profiles(id),
    work_activity_id UUID REFERENCES public.work_activity_categories(id),
    work_activity TEXT NOT NULL,
    rams_document_id UUID REFERENCES public.rams_documents(id),
    rams_name TEXT NOT NULL,
    version TEXT NOT NULL,
    date_issued TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    responsible_person TEXT NOT NULL,
    status TEXT DEFAULT 'Outstanding',
    signed_by TEXT,
    date_signed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Create Projects table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.Projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    projectname TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for new tables
ALTER TABLE public.enhanced_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rams_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_plan_rams_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for enhanced_audit_log
CREATE POLICY "Enhanced audit logs are viewable by authenticated users" ON public.enhanced_audit_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enhanced audit logs can be inserted by authenticated users" ON public.enhanced_audit_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for contractor_companies
CREATE POLICY "Companies are viewable by authenticated users" ON public.contractor_companies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Companies can be managed by authenticated users" ON public.contractor_companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Companies can be updated by authenticated users" ON public.contractor_companies FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for contractor_profiles
CREATE POLICY "Contractor profiles are viewable by authenticated users" ON public.contractor_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Contractor profiles can be managed by authenticated users" ON public.contractor_profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Contractor profiles can be updated by authenticated users" ON public.contractor_profiles FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for work_activity_categories
CREATE POLICY "Work activities are viewable by authenticated users" ON public.work_activity_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Work activities can be managed by authenticated users" ON public.work_activity_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Work activities can be updated by authenticated users" ON public.work_activity_categories FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for rams_documents
CREATE POLICY "RAMS documents are viewable by authenticated users" ON public.rams_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "RAMS documents can be managed by authenticated users" ON public.rams_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "RAMS documents can be updated by authenticated users" ON public.rams_documents FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for task_plan_rams_register
CREATE POLICY "Task plan RAMS register is viewable by authenticated users" ON public.task_plan_rams_register FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Task plan RAMS register can be managed by authenticated users" ON public.task_plan_rams_register FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Task plan RAMS register can be updated by authenticated users" ON public.task_plan_rams_register FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for Projects
CREATE POLICY "Projects are viewable by authenticated users" ON public.Projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Projects can be managed by authenticated users" ON public.Projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Projects can be updated by authenticated users" ON public.Projects FOR UPDATE USING (auth.role() = 'authenticated');

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_contractor_companies_updated_at
    BEFORE UPDATE ON public.contractor_companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contractor_profiles_updated_at
    BEFORE UPDATE ON public.contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_activity_categories_updated_at
    BEFORE UPDATE ON public.work_activity_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rams_documents_updated_at
    BEFORE UPDATE ON public.rams_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_plan_rams_register_updated_at
    BEFORE UPDATE ON public.task_plan_rams_register
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.Projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();