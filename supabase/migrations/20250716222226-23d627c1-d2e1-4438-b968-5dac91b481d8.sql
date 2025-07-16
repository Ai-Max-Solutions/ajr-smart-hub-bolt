-- Create RAMS (Risk Assessment and Method Statement) database schema
-- This creates the complete RAMS compliance system

-- Create RAMS documents table
CREATE TABLE IF NOT EXISTS public.rams_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  project_id UUID REFERENCES public.projects(id),
  work_types TEXT[] NOT NULL DEFAULT '{}',
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
  content TEXT NOT NULL,
  minimum_read_time INTEGER NOT NULL DEFAULT 30,
  requires_fresh_signature BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project RAMS requirements table
CREATE TABLE IF NOT EXISTS public.project_rams_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rams_document_id UUID NOT NULL REFERENCES public.rams_documents(id) ON DELETE CASCADE,
  required_work_types TEXT[] NOT NULL DEFAULT '{}',
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, rams_document_id)
);

-- Create contractor RAMS signatures table
CREATE TABLE IF NOT EXISTS public.contractor_rams_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rams_document_id UUID NOT NULL REFERENCES public.rams_documents(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL,
  reading_time_seconds INTEGER NOT NULL DEFAULT 0,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rams_documents_work_types ON public.rams_documents USING GIN(work_types);
CREATE INDEX IF NOT EXISTS idx_rams_documents_risk_level ON public.rams_documents(risk_level);
CREATE INDEX IF NOT EXISTS idx_rams_documents_active ON public.rams_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_project_rams_requirements_project ON public.project_rams_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_project_rams_requirements_document ON public.project_rams_requirements(rams_document_id);
CREATE INDEX IF NOT EXISTS idx_contractor_signatures_contractor ON public.contractor_rams_signatures(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_signatures_document ON public.contractor_rams_signatures(rams_document_id);
CREATE INDEX IF NOT EXISTS idx_contractor_signatures_current ON public.contractor_rams_signatures(is_current);

-- Enable Row Level Security
ALTER TABLE public.rams_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_rams_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_rams_signatures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rams_documents
CREATE POLICY "Contractors can view assigned RAMS documents" ON public.rams_documents
  FOR SELECT USING (
    is_active = true AND (
      project_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.supabase_auth_id = auth.uid() 
        AND u.currentproject = project_id
      )
    )
  );

CREATE POLICY "Admins can manage RAMS documents" ON public.rams_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.supabase_auth_id = auth.uid() 
      AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
    )
  );

-- Create RLS policies for project_rams_requirements
CREATE POLICY "Contractors can view project RAMS requirements" ON public.project_rams_requirements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.supabase_auth_id = auth.uid() 
      AND u.currentproject = project_id
    )
  );

CREATE POLICY "Admins can manage project RAMS requirements" ON public.project_rams_requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.supabase_auth_id = auth.uid() 
      AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
    )
  );

-- Create RLS policies for contractor_rams_signatures
CREATE POLICY "Contractors can view their own signatures" ON public.contractor_rams_signatures
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.users 
      WHERE supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can create their own signatures" ON public.contractor_rams_signatures
  FOR INSERT WITH CHECK (
    contractor_id IN (
      SELECT id FROM public.users 
      WHERE supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all signatures" ON public.contractor_rams_signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.supabase_auth_id = auth.uid() 
      AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
    )
  );

-- Create function to invalidate old signatures when a new one is created
CREATE OR REPLACE FUNCTION public.invalidate_old_rams_signatures()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark existing signatures as not current for the same contractor and document
  UPDATE public.contractor_rams_signatures 
  SET is_current = false, updated_at = now()
  WHERE contractor_id = NEW.contractor_id 
    AND rams_document_id = NEW.rams_document_id 
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically invalidate old signatures
CREATE TRIGGER invalidate_old_rams_signatures_trigger
  AFTER INSERT ON public.contractor_rams_signatures
  FOR EACH ROW EXECUTE FUNCTION public.invalidate_old_rams_signatures();

-- Create function to get contractor RAMS compliance
CREATE OR REPLACE FUNCTION public.get_contractor_rams_compliance(
  p_contractor_id UUID,
  p_project_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_required_docs INTEGER;
  v_signed_docs INTEGER;
  v_expired_docs INTEGER;
  v_compliance_percentage NUMERIC;
  v_compliance_status TEXT;
  v_result JSONB;
BEGIN
  -- Get required documents count
  SELECT COUNT(DISTINCT pr.rams_document_id)
  INTO v_required_docs
  FROM public.project_rams_requirements pr
  JOIN public.rams_documents rd ON pr.rams_document_id = rd.id
  WHERE (p_project_id IS NULL OR pr.project_id = p_project_id)
    AND pr.is_mandatory = true
    AND rd.is_active = true;

  -- Get signed documents count (current signatures)
  SELECT COUNT(DISTINCT cs.rams_document_id)
  INTO v_signed_docs
  FROM public.contractor_rams_signatures cs
  JOIN public.project_rams_requirements pr ON cs.rams_document_id = pr.rams_document_id
  WHERE cs.contractor_id = p_contractor_id
    AND (p_project_id IS NULL OR pr.project_id = p_project_id)
    AND cs.is_current = true
    AND (cs.expires_at IS NULL OR cs.expires_at > now());

  -- Get expired signatures count
  SELECT COUNT(DISTINCT cs.rams_document_id)
  INTO v_expired_docs
  FROM public.contractor_rams_signatures cs
  JOIN public.project_rams_requirements pr ON cs.rams_document_id = pr.rams_document_id
  WHERE cs.contractor_id = p_contractor_id
    AND (p_project_id IS NULL OR pr.project_id = p_project_id)
    AND cs.is_current = true
    AND cs.expires_at IS NOT NULL 
    AND cs.expires_at <= now();

  -- Calculate compliance percentage
  IF v_required_docs > 0 THEN
    v_compliance_percentage := ROUND((v_signed_docs::NUMERIC / v_required_docs::NUMERIC) * 100, 2);
  ELSE
    v_compliance_percentage := 100;
  END IF;

  -- Determine compliance status
  IF v_compliance_percentage = 100 THEN
    v_compliance_status := 'COMPLIANT';
  ELSIF v_compliance_percentage >= 80 THEN
    v_compliance_status := 'MOSTLY_COMPLIANT';
  ELSIF v_compliance_percentage >= 50 THEN
    v_compliance_status := 'PARTIALLY_COMPLIANT';
  ELSE
    v_compliance_status := 'NON_COMPLIANT';
  END IF;

  -- Build result JSON
  v_result := jsonb_build_object(
    'contractor_id', p_contractor_id,
    'project_id', p_project_id,
    'required_documents', v_required_docs,
    'signed_documents', v_signed_docs,
    'expired_signatures', v_expired_docs,
    'outstanding_documents', v_required_docs - v_signed_docs,
    'compliance_percentage', v_compliance_percentage,
    'compliance_status', v_compliance_status,
    'is_compliant', v_compliance_percentage = 100,
    'checked_at', now()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample RAMS documents for testing
INSERT INTO public.rams_documents (title, version, work_types, risk_level, content, minimum_read_time, requires_fresh_signature) VALUES
(
  'High Voltage Maintenance Safety Plan',
  '2.1',
  '{testing,maintenance,fault-finding}',
  'very_high',
  'HIGH VOLTAGE MAINTENANCE PLAN

RISK ASSESSMENT AND METHOD STATEMENT

Reference: RAMS-HV-001
Version: 2.1
Effective Date: Jan 15, 2024

VERY HIGH RISK ACTIVITY
This document requires careful review

SCOPE OF WORK
This document covers the safety procedures for high voltage electrical maintenance work including:
- Isolation procedures
- Testing protocols
- Personal protective equipment requirements
- Emergency procedures

HAZARDS IDENTIFIED
• Electric shock/electrocution
• Arc flash/blast
• Burns from hot surfaces
• Falls from height
• Manual handling injuries

CONTROL MEASURES
1. All work must be carried out by competent persons
2. Proper isolation and lock-out procedures must be followed
3. Appropriate PPE must be worn at all times
4. Work area must be secured and signed
5. Emergency procedures must be understood by all personnel

By signing this document, you confirm that you have read, understood, and will comply with all safety procedures outlined above.',
  60,
  true
),
(
  'Electrical Installation Safety Guidelines',
  '3.0',
  '{installations,first-fix,second-fix}',
  'high',
  'ELECTRICAL INSTALLATION SAFETY GUIDELINES

RISK ASSESSMENT AND METHOD STATEMENT

Reference: RAMS-EI-001
Version: 3.0

SCOPE OF WORK
Safety procedures for electrical installation work including first and second fix activities.

HAZARDS IDENTIFIED
• Electric shock
• Manual handling
• Working at height
• Tool-related injuries

CONTROL MEASURES
1. Always isolate circuits before work
2. Use appropriate PPE
3. Follow safe working practices
4. Regular tool inspection

By signing this document, you confirm understanding of all safety requirements.',
  45,
  false
),
(
  'Fire Alarm System Safety Procedures',
  '3.1',
  '{fire-alarms,testing}',
  'high',
  'FIRE ALARM SYSTEM SAFETY PROCEDURES

RISK ASSESSMENT AND METHOD STATEMENT

Reference: RAMS-FA-001
Version: 3.1

SCOPE OF WORK
Safety procedures for fire alarm system installation, testing, and maintenance.

HAZARDS IDENTIFIED
• Electrical hazards
• Working at height
• Noise exposure during testing
• Manual handling

CONTROL MEASURES
1. Coordinate with building management
2. Use hearing protection during alarm testing
3. Follow height safety procedures
4. Proper isolation procedures

By signing this document, you confirm understanding of fire alarm safety requirements.',
  40,
  false
)
ON CONFLICT DO NOTHING;