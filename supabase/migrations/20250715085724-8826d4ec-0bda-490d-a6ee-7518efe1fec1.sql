-- Create enhanced RAMS documents table for project-specific assignments
CREATE TABLE IF NOT EXISTS public.rams_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  project_id UUID REFERENCES "Projects"(whalesync_postgres_id),
  work_types TEXT[] NOT NULL DEFAULT '{}',
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
  content TEXT NOT NULL,
  minimum_read_time INTEGER NOT NULL DEFAULT 30,
  requires_fresh_signature BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project-specific RAMS assignments table
CREATE TABLE IF NOT EXISTS public.project_rams_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES "Projects"(whalesync_postgres_id),
  rams_document_id UUID NOT NULL REFERENCES rams_documents(id),
  required_for_work_types TEXT[] NOT NULL DEFAULT '{}',
  mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, rams_document_id)
);

-- Create contractor RAMS signatures table
CREATE TABLE IF NOT EXISTS public.contractor_rams_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES contractor_profiles(id),
  project_id UUID NOT NULL REFERENCES "Projects"(whalesync_postgres_id),
  rams_document_id UUID NOT NULL REFERENCES rams_documents(id),
  signature_data TEXT NOT NULL,
  reading_time_seconds INTEGER NOT NULL DEFAULT 0,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  superseded_by UUID REFERENCES contractor_rams_signatures(id),
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contractor_id, project_id, rams_document_id, is_current)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rams_documents_project_work_types ON rams_documents USING GIN (work_types);
CREATE INDEX IF NOT EXISTS idx_project_rams_requirements_project_work_types ON project_rams_requirements USING GIN (required_for_work_types);
CREATE INDEX IF NOT EXISTS idx_contractor_rams_signatures_contractor_project ON contractor_rams_signatures(contractor_id, project_id);
CREATE INDEX IF NOT EXISTS idx_contractor_rams_signatures_current ON contractor_rams_signatures(is_current) WHERE is_current = true;

-- Enable RLS
ALTER TABLE public.rams_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_rams_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_rams_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rams_documents
CREATE POLICY "Contractors can view assigned RAMS documents"
ON public.rams_documents
FOR SELECT
USING (
  active = true AND (
    -- Can view if assigned to a project with this RAMS
    EXISTS (
      SELECT 1 FROM contractor_project_assignments cpa
      JOIN project_rams_requirements prr ON prr.project_id = cpa.project_id
      WHERE cpa.contractor_id IN (
        SELECT id FROM contractor_profiles WHERE auth_user_id = auth.uid()
      )
      AND prr.rams_document_id = rams_documents.id
    )
    OR
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM "Users" u
      WHERE u.supabase_auth_id = auth.uid()
      AND u.role IN ('Admin', 'Document Controller', 'Project Manager')
    )
  )
);

CREATE POLICY "Admins can manage RAMS documents"
ON public.rams_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "Users" u
    WHERE u.supabase_auth_id = auth.uid()
    AND u.role IN ('Admin', 'Document Controller', 'Project Manager')
  )
);

-- RLS Policies for project_rams_requirements
CREATE POLICY "Contractors can view project RAMS requirements"
ON public.project_rams_requirements
FOR SELECT
USING (
  -- Can view if assigned to the project
  EXISTS (
    SELECT 1 FROM contractor_project_assignments cpa
    WHERE cpa.project_id = project_rams_requirements.project_id
    AND cpa.contractor_id IN (
      SELECT id FROM contractor_profiles WHERE auth_user_id = auth.uid()
    )
  )
  OR
  -- Admins can view all
  EXISTS (
    SELECT 1 FROM "Users" u
    WHERE u.supabase_auth_id = auth.uid()
    AND u.role IN ('Admin', 'Document Controller', 'Project Manager')
  )
);

CREATE POLICY "Admins can manage project RAMS requirements"
ON public.project_rams_requirements
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "Users" u
    WHERE u.supabase_auth_id = auth.uid()
    AND u.role IN ('Admin', 'Document Controller', 'Project Manager')
  )
);

-- RLS Policies for contractor_rams_signatures
CREATE POLICY "Contractors can view own signatures"
ON public.contractor_rams_signatures
FOR SELECT
USING (
  contractor_id IN (
    SELECT id FROM contractor_profiles WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Contractors can create own signatures"
ON public.contractor_rams_signatures
FOR INSERT
WITH CHECK (
  contractor_id IN (
    SELECT id FROM contractor_profiles WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all signatures"
ON public.contractor_rams_signatures
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Users" u
    WHERE u.supabase_auth_id = auth.uid()
    AND u.role IN ('Admin', 'Document Controller', 'Project Manager')
  )
);

-- Function to invalidate old signatures when new version is signed
CREATE OR REPLACE FUNCTION invalidate_old_rams_signatures()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark previous signatures as not current
  UPDATE contractor_rams_signatures
  SET is_current = false
  WHERE contractor_id = NEW.contractor_id
    AND project_id = NEW.project_id
    AND rams_document_id = NEW.rams_document_id
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to invalidate old signatures
CREATE TRIGGER invalidate_old_rams_signatures_trigger
  AFTER INSERT ON contractor_rams_signatures
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_old_rams_signatures();

-- Function to get contractor RAMS compliance status
CREATE OR REPLACE FUNCTION get_contractor_rams_compliance(
  p_contractor_id UUID,
  p_project_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_required_count INTEGER;
  v_signed_count INTEGER;
  v_expired_count INTEGER;
BEGIN
  -- Count required RAMS documents
  SELECT COUNT(*) INTO v_required_count
  FROM project_rams_requirements prr
  JOIN rams_documents rd ON rd.id = prr.rams_document_id
  WHERE (p_project_id IS NULL OR prr.project_id = p_project_id)
    AND rd.active = true
    AND prr.mandatory = true;
  
  -- Count signed (current) RAMS documents
  SELECT COUNT(*) INTO v_signed_count
  FROM contractor_rams_signatures crs
  JOIN project_rams_requirements prr ON prr.rams_document_id = crs.rams_document_id
  WHERE crs.contractor_id = p_contractor_id
    AND (p_project_id IS NULL OR crs.project_id = p_project_id)
    AND crs.is_current = true
    AND (crs.valid_until IS NULL OR crs.valid_until > now());
  
  -- Count expired signatures
  SELECT COUNT(*) INTO v_expired_count
  FROM contractor_rams_signatures crs
  WHERE crs.contractor_id = p_contractor_id
    AND (p_project_id IS NULL OR crs.project_id = p_project_id)
    AND crs.is_current = true
    AND crs.valid_until IS NOT NULL
    AND crs.valid_until <= now();
  
  v_result := jsonb_build_object(
    'contractor_id', p_contractor_id,
    'project_id', p_project_id,
    'required_documents', v_required_count,
    'signed_documents', v_signed_count,
    'expired_signatures', v_expired_count,
    'compliance_percentage', CASE 
      WHEN v_required_count > 0 THEN ROUND((v_signed_count::NUMERIC / v_required_count) * 100, 0)
      ELSE 100
    END,
    'is_compliant', (v_signed_count >= v_required_count AND v_expired_count = 0)
  );
  
  RETURN v_result;
END;
$$;