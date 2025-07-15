-- Create contractor profiles table first
CREATE TABLE public.contractor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.contractor_companies(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    job_role TEXT NOT NULL,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    vehicle_registration TEXT,
    vehicle_type TEXT,
    vehicle_weight_category TEXT,
    fors_level TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    rams_signed_at TIMESTAMP WITH TIME ZONE,
    rams_signature_data TEXT,
    terms_accepted BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_profiles
CREATE POLICY "Contractors can view own profile" 
ON public.contractor_profiles FOR SELECT 
USING (auth_user_id = auth.uid());

CREATE POLICY "Contractors can update own profile" 
ON public.contractor_profiles FOR UPDATE 
USING (auth_user_id = auth.uid());

CREATE POLICY "Contractors can insert own profile" 
ON public.contractor_profiles FOR INSERT 
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage all contractor profiles" 
ON public.contractor_profiles FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

-- Now create training document types table
CREATE TABLE public.training_document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT true,
    requires_expiry BOOLEAN DEFAULT true,
    icon_name TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create contractor training documents table
CREATE TABLE public.contractor_training_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES public.training_document_types(id),
    document_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    issue_date DATE,
    expiry_date DATE,
    status TEXT CHECK (status IN ('active', 'expired', 'expiring_soon', 'pending_review')) DEFAULT 'active',
    verified_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create contractor project assignments table (for RAMS tracking)
CREATE TABLE public.contractor_project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id),
    job_role TEXT NOT NULL,
    rams_signed_at TIMESTAMP WITH TIME ZONE,
    rams_signature_data TEXT,
    assigned_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    status TEXT CHECK (status IN ('pending', 'active', 'completed', 'suspended')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(contractor_id, project_id, job_role)
);

-- Enable RLS for new tables
ALTER TABLE public.training_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_training_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_project_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_document_types
CREATE POLICY "Training document types are viewable by all contractors" 
ON public.training_document_types FOR SELECT 
USING (true);

-- RLS Policies for contractor_training_documents
CREATE POLICY "Contractors can view own training documents" 
ON public.contractor_training_documents FOR SELECT 
USING (
    contractor_id IN (
        SELECT id FROM public.contractor_profiles 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Contractors can insert own training documents" 
ON public.contractor_training_documents FOR INSERT 
WITH CHECK (
    contractor_id IN (
        SELECT id FROM public.contractor_profiles 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Contractors can update own training documents" 
ON public.contractor_training_documents FOR UPDATE 
USING (
    contractor_id IN (
        SELECT id FROM public.contractor_profiles 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all training documents" 
ON public.contractor_training_documents FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

-- RLS Policies for contractor_project_assignments
CREATE POLICY "Contractors can view own project assignments" 
ON public.contractor_project_assignments FOR SELECT 
USING (
    contractor_id IN (
        SELECT id FROM public.contractor_profiles 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Contractors can update own assignments (for RAMS signing)" 
ON public.contractor_project_assignments FOR UPDATE 
USING (
    contractor_id IN (
        SELECT id FROM public.contractor_profiles 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all project assignments" 
ON public.contractor_project_assignments FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

-- Insert default training document types
INSERT INTO public.training_document_types (name, description, is_mandatory, requires_expiry, icon_name, display_order) VALUES
('CSCS Card', 'Construction Skills Certification Scheme card required for all site workers', true, true, 'CreditCard', 1),
('IPAF Certificate', 'International Powered Access Federation certificate for using MEWPs and access platforms', false, true, 'Zap', 2),
('PASMA Certificate', 'Prefabricated Access Suppliers & Manufacturers Association mobile tower training', false, true, 'Building', 3),
('SSSTS Certificate', 'Site Supervisor Safety Training Scheme', false, true, 'Shield', 4),
('SMSTS Certificate', 'Site Management Safety Training Scheme', false, true, 'ShieldCheck', 5),
('Forklift Licence', 'Forklift truck operator licence', false, true, 'Truck', 6),
('First Aid Certificate', 'Workplace first aid training certificate', false, true, 'Heart', 7),
('Manual Handling Certificate', 'Manual handling training certificate', false, true, 'Package', 8),
('Working at Height Certificate', 'Working at height safety training', false, true, 'TrendingUp', 9),
('Other Qualification', 'Any other relevant qualification or certification', false, false, 'FileText', 10);