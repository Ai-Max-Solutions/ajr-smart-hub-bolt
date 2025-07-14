-- Phase 1: Complete Security & Compliance Foundation (Fixed)
-- Comprehensive RLS Policies for All Core Tables

-- Enable RLS on all core tables
ALTER TABLE public."Projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Levels" ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public."Plots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Drawings" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all projects" ON public."Projects";
DROP POLICY IF EXISTS "Users can view assigned projects" ON public."Projects";
DROP POLICY IF EXISTS "Admins can manage all projects" ON public."Projects";

-- Comprehensive RLS Policies for Projects
CREATE POLICY "Admins can view all projects" ON public."Projects"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
  )
);

CREATE POLICY "Users can view assigned projects" ON public."Projects"
FOR SELECT USING (
  whalesync_postgres_id IN (
    SELECT currentproject FROM public."Users" 
    WHERE supabase_auth_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all projects" ON public."Projects"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
  )
);

-- Enhanced Audit Log Table with GDPR Compliance
CREATE TABLE IF NOT EXISTS public.enhanced_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public."Users"(whalesync_postgres_id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  evidence_chain_hash TEXT,
  gdpr_retention_category TEXT DEFAULT 'operational',
  legal_hold BOOLEAN DEFAULT FALSE,
  anonymized_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.enhanced_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies - only admins can view
CREATE POLICY "Admins can view audit logs" ON public.enhanced_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller')
  )
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.enhanced_audit_log
FOR INSERT WITH CHECK (true);

-- Soft Delete Enhancement Table
CREATE TABLE IF NOT EXISTS public.soft_delete_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by UUID REFERENCES public."Users"(whalesync_postgres_id),
  deletion_reason TEXT,
  retention_period INTERVAL DEFAULT '7 years',
  legal_hold BOOLEAN DEFAULT FALSE,
  gdpr_deletion_eligible BOOLEAN DEFAULT TRUE,
  archived_data JSONB NOT NULL,
  evidence_chain_reference TEXT,
  UNIQUE(table_name, record_id)
);

ALTER TABLE public.soft_delete_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage soft deletes" ON public.soft_delete_registry
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller')
  )
);

-- GDPR Compliance Table
CREATE TABLE IF NOT EXISTS public.gdpr_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_subject_id UUID,
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'denied')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  requester_email TEXT,
  legal_basis TEXT,
  affected_tables TEXT[],
  response_data JSONB,
  dpo_notes TEXT,
  retention_override_reason TEXT
);

ALTER TABLE public.gdpr_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DPO can manage GDPR requests" ON public.gdpr_compliance
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller')
  )
);

-- Enhanced Evidence Chain Integration Function
CREATE OR REPLACE FUNCTION public.log_evidence_chain_event(
  p_table_name TEXT,
  p_record_id UUID,
  p_action TEXT,
  p_data JSONB,
  p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  evidence_id UUID;
  data_hash TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user ID if not provided
  IF p_user_id IS NULL THEN
    SELECT whalesync_postgres_id INTO current_user_id
    FROM public."Users" 
    WHERE supabase_auth_id = auth.uid();
  ELSE
    current_user_id := p_user_id;
  END IF;

  -- Generate cryptographic hash of the data
  data_hash := encode(sha256(p_data::text::bytea), 'hex');
  
  -- Insert into evidence chain
  INSERT INTO public.evidence_chain_records (
    id,
    record_type,
    reference_id,
    action_type,
    data_hash,
    metadata,
    created_by,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_table_name,
    p_record_id,
    p_action,
    data_hash,
    jsonb_build_object(
      'table', p_table_name,
      'action', p_action,
      'timestamp', NOW(),
      'user_id', current_user_id
    ),
    current_user_id,
    NOW()
  ) RETURNING id INTO evidence_id;
  
  -- Also log in enhanced audit log
  INSERT INTO public.enhanced_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    new_values,
    evidence_chain_hash
  ) VALUES (
    current_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_data,
    data_hash
  );
  
  RETURN evidence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;