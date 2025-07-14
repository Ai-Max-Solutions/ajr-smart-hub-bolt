-- Phase 1: Complete Security & Compliance Foundation
-- Comprehensive RLS Policies for All Core Tables

-- Enable RLS on all core tables
ALTER TABLE public."Projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Plots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Drawings" ENABLE ROW LEVEL SECURITY;

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
  OR EXISTS (
    SELECT 1 FROM public.project_team 
    WHERE project_id = whalesync_postgres_id 
    AND user_id = auth.uid()
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

-- RLS Policies for Levels
CREATE POLICY "Users can view levels for accessible projects" ON public."Levels"
FOR SELECT USING (
  block IN (
    SELECT whalesync_postgres_id FROM public."Blocks" b
    JOIN public."Projects" p ON b.project = p.whalesync_postgres_id
    WHERE p.whalesync_postgres_id IN (
      SELECT currentproject FROM public."Users" WHERE supabase_auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public."Users" 
      WHERE supabase_auth_id = auth.uid() 
      AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
    )
  )
);

CREATE POLICY "Admins can manage all levels" ON public."Levels"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
  )
);

-- RLS Policies for Plots
CREATE POLICY "Users can view plots for accessible projects" ON public."Plots"
FOR SELECT USING (
  level IN (
    SELECT whalesync_postgres_id FROM public."Levels" l
    JOIN public."Blocks" b ON l.block = b.whalesync_postgres_id
    JOIN public."Projects" p ON b.project = p.whalesync_postgres_id
    WHERE p.whalesync_postgres_id IN (
      SELECT currentproject FROM public."Users" WHERE supabase_auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public."Users" 
      WHERE supabase_auth_id = auth.uid() 
      AND role IN ('Admin', 'Document Controller', 'Project Manager', 'Director')
    )
  )
);

CREATE POLICY "Admins can manage all plots" ON public."Plots"
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

-- Enhanced Evidence Chain Integration
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
BEGIN
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
      'ip_address', inet_client_addr(),
      'session_id', current_setting('app.session_id', true)
    ),
    COALESCE(p_user_id, (
      SELECT whalesync_postgres_id FROM public."Users" 
      WHERE supabase_auth_id = auth.uid()
    )),
    NOW()
  ) RETURNING id INTO evidence_id;
  
  -- Also log in enhanced audit log
  INSERT INTO public.enhanced_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    new_values,
    evidence_chain_hash,
    ip_address,
    user_agent,
    session_id
  ) VALUES (
    COALESCE(p_user_id, (
      SELECT whalesync_postgres_id FROM public."Users" 
      WHERE supabase_auth_id = auth.uid()
    )),
    p_action,
    p_table_name,
    p_record_id,
    p_data,
    data_hash,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent',
    current_setting('app.session_id', true)
  );
  
  RETURN evidence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprehensive Audit Trigger
CREATE OR REPLACE FUNCTION public.comprehensive_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  operation_data JSONB;
BEGIN
  -- Get current user ID
  SELECT whalesync_postgres_id INTO current_user_id
  FROM public."Users"
  WHERE supabase_auth_id = auth.uid();
  
  -- Prepare operation data
  IF TG_OP = 'DELETE' THEN
    operation_data := to_jsonb(OLD);
    
    -- Check if this is a soft delete (has deleted_at column)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = TG_TABLE_NAME 
      AND column_name = 'deleted_at'
    ) THEN
      -- Prevent hard deletes on soft-delete enabled tables
      RAISE EXCEPTION 'Hard deletes not allowed on table %. Use soft delete.', TG_TABLE_NAME;
    END IF;
    
    -- Log to evidence chain
    PERFORM public.log_evidence_chain_event(
      TG_TABLE_NAME,
      OLD.whalesync_postgres_id,
      TG_OP,
      operation_data,
      current_user_id
    );
    
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    operation_data := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
    
    -- Log to evidence chain
    PERFORM public.log_evidence_chain_event(
      TG_TABLE_NAME,
      NEW.whalesync_postgres_id,
      TG_OP,
      operation_data,
      current_user_id
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    operation_data := to_jsonb(NEW);
    
    -- Log to evidence chain
    PERFORM public.log_evidence_chain_event(
      TG_TABLE_NAME,
      NEW.whalesync_postgres_id,
      TG_OP,
      operation_data,
      current_user_id
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to all core tables
DROP TRIGGER IF EXISTS audit_projects_trigger ON public."Projects";
CREATE TRIGGER audit_projects_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public."Projects"
  FOR EACH ROW EXECUTE FUNCTION public.comprehensive_audit_trigger();

DROP TRIGGER IF EXISTS audit_levels_trigger ON public."Levels";
CREATE TRIGGER audit_levels_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public."Levels"
  FOR EACH ROW EXECUTE FUNCTION public.comprehensive_audit_trigger();

DROP TRIGGER IF EXISTS audit_plots_trigger ON public."Plots";
CREATE TRIGGER audit_plots_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public."Plots"
  FOR EACH ROW EXECUTE FUNCTION public.comprehensive_audit_trigger();

DROP TRIGGER IF EXISTS audit_work_packages_trigger ON public.work_packages;
CREATE TRIGGER audit_work_packages_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.work_packages
  FOR EACH ROW EXECUTE FUNCTION public.comprehensive_audit_trigger();

DROP TRIGGER IF EXISTS audit_document_versions_trigger ON public.document_versions;
CREATE TRIGGER audit_document_versions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.document_versions
  FOR EACH ROW EXECUTE FUNCTION public.comprehensive_audit_trigger();

-- GDPR Data Anonymization Function
CREATE OR REPLACE FUNCTION public.anonymize_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Anonymize user data while preserving operational integrity
  UPDATE public."Users"
  SET 
    firstname = 'ANONYMIZED',
    lastname = 'USER',
    fullname = 'ANONYMIZED USER',
    email = 'anonymized_' || p_user_id || '@deleted.local',
    phone = NULL,
    address = NULL,
    emergencycontact = NULL,
    emergencyphone = NULL
  WHERE whalesync_postgres_id = p_user_id;
  
  -- Mark audit logs as anonymized
  UPDATE public.enhanced_audit_log
  SET anonymized_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the anonymization
  PERFORM public.log_evidence_chain_event(
    'Users',
    p_user_id,
    'ANONYMIZE',
    jsonb_build_object('anonymized_at', NOW(), 'reason', 'GDPR_ERASURE'),
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;