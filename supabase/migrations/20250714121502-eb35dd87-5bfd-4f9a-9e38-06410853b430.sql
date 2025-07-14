-- Phase 1: Create missing tables for Admin CRUD system

-- Project Teams table for managing team assignments
CREATE TABLE public.project_teams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Operative',
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    assigned_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, user_id, role)
);

-- RAMS Documents table for document management
CREATE TABLE public.rams_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id TEXT NOT NULL,
    title TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    file_url TEXT,
    file_size BIGINT,
    mime_type TEXT,
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    level_id UUID REFERENCES public."Levels"(whalesync_postgres_id),
    plot_id UUID REFERENCES public."Plots"(whalesync_postgres_id),
    document_type TEXT NOT NULL DEFAULT 'RAMS',
    status TEXT NOT NULL DEFAULT 'active',
    read_required BOOLEAN NOT NULL DEFAULT false,
    uploaded_by UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id),
    approved_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    approval_date TIMESTAMP WITH TIME ZONE,
    superseded_by UUID REFERENCES public.rams_documents(id),
    superseded_date TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    ai_extracted_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Work Packages table for job management
CREATE TABLE public.work_packages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    level_id UUID REFERENCES public."Levels"(whalesync_postgres_id),
    plot_id UUID REFERENCES public."Plots"(whalesync_postgres_id),
    work_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    assigned_to UUID REFERENCES public."Users"(whalesync_postgres_id),
    created_by UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id),
    rams_documents UUID[] DEFAULT '{}',
    linked_drawings UUID[] DEFAULT '{}',
    safety_notes TEXT,
    completion_percentage NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Project Assignments table for tracking user assignments
CREATE TABLE public.project_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    assigned_by UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id),
    status TEXT NOT NULL DEFAULT 'active',
    ai_suggested BOOLEAN DEFAULT false,
    availability_score NUMERIC,
    workload_percentage NUMERIC,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rams_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_teams
CREATE POLICY "Admins can manage all project teams" 
ON public.project_teams FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
));

CREATE POLICY "Users can view their own team assignments" 
ON public.project_teams FOR SELECT 
USING (user_id = (
    SELECT whalesync_postgres_id FROM public."Users" 
    WHERE supabase_auth_id = auth.uid()
));

-- RLS Policies for rams_documents
CREATE POLICY "Admins and Document Controllers can manage RAMS" 
ON public.rams_documents FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
));

CREATE POLICY "Users can view RAMS for their projects" 
ON public.rams_documents FOR SELECT 
USING (project_id IN (
    SELECT project_id FROM public.project_teams pt
    JOIN public."Users" u ON pt.user_id = u.whalesync_postgres_id
    WHERE u.supabase_auth_id = auth.uid()
));

-- RLS Policies for work_packages
CREATE POLICY "Admins can manage all work packages" 
ON public.work_packages FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
));

CREATE POLICY "Users can view work packages for their projects" 
ON public.work_packages FOR SELECT 
USING (project_id IN (
    SELECT project_id FROM public.project_teams pt
    JOIN public."Users" u ON pt.user_id = u.whalesync_postgres_id
    WHERE u.supabase_auth_id = auth.uid()
));

CREATE POLICY "Assigned users can update their work packages" 
ON public.work_packages FOR UPDATE 
USING (assigned_to = (
    SELECT whalesync_postgres_id FROM public."Users" 
    WHERE supabase_auth_id = auth.uid()
));

-- RLS Policies for project_assignments
CREATE POLICY "Admins can manage all assignments" 
ON public.project_assignments FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
));

CREATE POLICY "Users can view their own assignments" 
ON public.project_assignments FOR SELECT 
USING (user_id = (
    SELECT whalesync_postgres_id FROM public."Users" 
    WHERE supabase_auth_id = auth.uid()
));

-- Create audit trigger function for comprehensive logging
CREATE OR REPLACE FUNCTION public.enhanced_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    old_record JSONB;
    new_record JSONB;
BEGIN
    -- Get current user ID from Users table
    SELECT whalesync_postgres_id INTO current_user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Convert records to JSONB
    IF TG_OP = 'DELETE' THEN
        old_record := to_jsonb(OLD);
        new_record := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_record := to_jsonb(OLD);
        new_record := to_jsonb(NEW);
    ELSE -- INSERT
        old_record := NULL;
        new_record := to_jsonb(NEW);
    END IF;
    
    -- Insert audit log
    INSERT INTO public.audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        current_user_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        old_record,
        new_record,
        inet_client_addr(),
        current_setting('request.headers', true)::jsonb->>'user-agent'
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Apply audit triggers to all CRUD tables
CREATE TRIGGER audit_project_teams 
    AFTER INSERT OR UPDATE OR DELETE ON public.project_teams
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

CREATE TRIGGER audit_rams_documents 
    AFTER INSERT OR UPDATE OR DELETE ON public.rams_documents
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

CREATE TRIGGER audit_work_packages 
    AFTER INSERT OR UPDATE OR DELETE ON public.work_packages
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

CREATE TRIGGER audit_project_assignments 
    AFTER INSERT OR UPDATE OR DELETE ON public.project_assignments
    FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_trigger();

-- Add updated_at triggers
CREATE TRIGGER update_project_teams_updated_at
    BEFORE UPDATE ON public.project_teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rams_documents_updated_at
    BEFORE UPDATE ON public.rams_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_packages_updated_at
    BEFORE UPDATE ON public.work_packages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_assignments_updated_at
    BEFORE UPDATE ON public.project_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_project_teams_project_id ON public.project_teams(project_id);
CREATE INDEX idx_project_teams_user_id ON public.project_teams(user_id);
CREATE INDEX idx_rams_documents_project_id ON public.rams_documents(project_id);
CREATE INDEX idx_rams_documents_document_type ON public.rams_documents(document_type);
CREATE INDEX idx_work_packages_project_id ON public.work_packages(project_id);
CREATE INDEX idx_work_packages_assigned_to ON public.work_packages(assigned_to);
CREATE INDEX idx_work_packages_status ON public.work_packages(status);
CREATE INDEX idx_project_assignments_user_id ON public.project_assignments(user_id);
CREATE INDEX idx_project_assignments_project_id ON public.project_assignments(project_id);