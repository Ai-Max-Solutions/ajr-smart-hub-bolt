-- Create contractor companies table first
CREATE TABLE public.contractor_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    company_type TEXT,
    registration_number TEXT,
    vat_number TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'United Kingdom',
    phone TEXT,
    email TEXT,
    website TEXT,
    primary_contact_name TEXT,
    primary_contact_phone TEXT,
    primary_contact_email TEXT,
    insurance_expiry DATE,
    health_safety_policy_url TEXT,
    accreditations TEXT[],
    preferred_work_types TEXT[],
    status TEXT CHECK (status IN ('active', 'suspended', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contractor_companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_companies
CREATE POLICY "Companies are viewable by all" 
ON public.contractor_companies FOR SELECT 
USING (status = 'active');

CREATE POLICY "Admins can manage all companies" 
ON public.contractor_companies FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

-- Insert some default contractor companies
INSERT INTO public.contractor_companies (company_name, company_type, preferred_work_types) VALUES
('ABC Construction Ltd', 'General Contractor', ARRAY['General Building', 'Groundworks']),
('Elite Electrical Services', 'Specialist Trade', ARRAY['Electrical Installation', 'Testing & Commissioning']),
('Premier Plumbing Solutions', 'Specialist Trade', ARRAY['Plumbing', 'Heating Installation']),
('Skyline Access Solutions', 'Access Equipment', ARRAY['MEWP Hire', 'Scaffolding']),
('Green Energy Systems', 'Renewables', ARRAY['Solar Installation', 'Heat Pumps']),
('Safe Lift Services', 'Plant Hire', ARRAY['Crane Hire', 'Lifting Operations']);

-- Now create contractor profiles table
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