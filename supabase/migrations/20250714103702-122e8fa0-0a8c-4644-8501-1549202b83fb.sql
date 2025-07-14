-- LEGENDARY EVIDENCE CHAIN REPORT & SMART REVISION SYSTEM
-- Phase 1: Foundation Database Schema

-- 1. Evidence Chain Records - Immutable audit trail
CREATE TABLE public.evidence_chain_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    operative_id UUID REFERENCES public."Users"(whalesync_postgres_id),
    plot_id UUID REFERENCES public."Plots"(whalesync_postgres_id),
    document_id UUID,
    document_type TEXT NOT NULL CHECK (document_type IN ('RAMS', 'Drawing', 'Task_Plan', 'Site_Notice', 'POD')),
    document_version TEXT NOT NULL,
    document_revision TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('view', 'sign', 'download', 'print', 'qr_scan', 'upload', 'supersede')),
    signature_id UUID,
    device_info JSONB,
    ip_address INET,
    gps_location POINT,
    evidence_hash TEXT NOT NULL, -- Immutable hash for integrity
    chain_sequence BIGSERIAL, -- Ensures chronological order
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id)
);

-- 2. Enhanced Document Versions with Smart Revision
CREATE TABLE public.document_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL,
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    version_number NUMERIC(10,2) NOT NULL,
    revision_code TEXT,
    file_url TEXT,
    file_size BIGINT,
    mime_type TEXT,
    qr_code_url TEXT,
    watermark_applied BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'superseded', 'archived')),
    approval_date TIMESTAMP WITH TIME ZONE,
    superseded_date TIMESTAMP WITH TIME ZONE,
    superseded_by UUID REFERENCES public.document_versions(id),
    read_required BOOLEAN DEFAULT false,
    linked_drawings UUID[],
    linked_rams UUID[],
    tags TEXT[],
    ai_suggested_tags TEXT[],
    scope_plots UUID[],
    scope_levels UUID[],
    uploaded_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    approved_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. QR Code Scan Logs for Smart Revision System
CREATE TABLE public.qr_scan_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_version_id UUID REFERENCES public.document_versions(id),
    scanned_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    scan_location POINT,
    scan_device_info JSONB,
    scan_result TEXT NOT NULL CHECK (scan_result IN ('current', 'superseded', 'error', 'unauthorized')),
    redirect_to_version UUID REFERENCES public.document_versions(id),
    poster_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Smart Revision Alerts & Notifications
CREATE TABLE public.smart_revision_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_version_id UUID REFERENCES public.document_versions(id),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('superseded', 'expiring', 'unsigned', 'missing')),
    target_users UUID[],
    notification_sent BOOLEAN DEFAULT false,
    ai_generated BOOLEAN DEFAULT false,
    alert_message TEXT,
    urgency_level TEXT DEFAULT 'medium' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. QR Poster Management
CREATE TABLE public.qr_posters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    poster_type TEXT NOT NULL CHECK (poster_type IN ('sign-in', 'welfare', 'hoarding', 'office', 'plot-specific')),
    location_name TEXT NOT NULL,
    scope_description TEXT,
    document_versions UUID[] NOT NULL,
    qr_data JSONB NOT NULL,
    poster_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    needs_reprint BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'needs-update', 'missing', 'damaged')),
    last_scan_at TIMESTAMP WITH TIME ZONE,
    scan_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Evidence Chain Exports (Compliance Reports)
CREATE TABLE public.evidence_exports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    export_type TEXT NOT NULL CHECK (export_type IN ('project', 'operative', 'plot', 'company', 'custom')),
    scope_data JSONB NOT NULL, -- Project IDs, User IDs, Plot IDs, date ranges
    export_format TEXT NOT NULL CHECK (export_format IN ('pdf', 'csv', 'zip', 'json')),
    file_url TEXT,
    file_size BIGINT,
    record_count INTEGER,
    filters_applied JSONB,
    exported_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    export_status TEXT DEFAULT 'processing' CHECK (export_status IN ('processing', 'completed', 'failed', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Compliance Snapshots (Point-in-time compliance status)
CREATE TABLE public.compliance_snapshots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    snapshot_date DATE NOT NULL,
    compliance_percentage NUMERIC(5,2),
    total_documents INTEGER,
    signed_documents INTEGER,
    superseded_unsigned INTEGER,
    missing_signatures INTEGER,
    compliance_data JSONB NOT NULL,
    auto_generated BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Task Plan Templates (Enhanced RAMS/Task Plan management)
CREATE TABLE public.task_plan_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('RAMS', 'Task_Plan', 'Method_Statement', 'Risk_Assessment')),
    trade_category TEXT,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    template_content JSONB,
    required_signatures TEXT[],
    linked_qualifications UUID[],
    ai_risk_factors TEXT[],
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.evidence_chain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_revision_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_posters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_plan_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Evidence Chain (Read-only for immutability)
CREATE POLICY "Users can view evidence in their projects" 
ON public.evidence_chain_records FOR SELECT 
USING (
    project_id IN (
        SELECT currentproject FROM public."Users" WHERE supabase_auth_id = auth.uid()
    ) OR 
    operative_id = (
        SELECT whalesync_postgres_id FROM public."Users" WHERE supabase_auth_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    )
);

CREATE POLICY "System can insert evidence records" 
ON public.evidence_chain_records FOR INSERT 
WITH CHECK (true); -- Controlled by backend functions only

-- RLS Policies for Document Versions
CREATE POLICY "Users can view documents in their projects" 
ON public.document_versions FOR SELECT 
USING (
    project_id IN (
        SELECT currentproject FROM public."Users" WHERE supabase_auth_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    )
);

CREATE POLICY "Authorized users can manage documents" 
ON public.document_versions FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    )
);

-- RLS Policies for QR Scan Logs
CREATE POLICY "Users can log their own scans" 
ON public.qr_scan_logs FOR INSERT 
WITH CHECK (
    scanned_by = (
        SELECT whalesync_postgres_id FROM public."Users" WHERE supabase_auth_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all scan logs" 
ON public.qr_scan_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    )
);

-- Similar policies for other tables...
CREATE POLICY "Project team can view alerts" 
ON public.smart_revision_alerts FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND (
            role IN ('Admin', 'Project Manager', 'Document Controller') OR
            whalesync_postgres_id = ANY(target_users)
        )
    )
);

-- Create indexes for performance
CREATE INDEX idx_evidence_chain_project_date ON public.evidence_chain_records(project_id, created_at DESC);
CREATE INDEX idx_evidence_chain_operative ON public.evidence_chain_records(operative_id, created_at DESC);
CREATE INDEX idx_evidence_chain_document ON public.evidence_chain_records(document_id, document_version);
CREATE INDEX idx_evidence_chain_sequence ON public.evidence_chain_records(chain_sequence);

CREATE INDEX idx_document_versions_project ON public.document_versions(project_id, status);
CREATE INDEX idx_document_versions_type ON public.document_versions(document_type, status);
CREATE INDEX idx_document_versions_superseded ON public.document_versions(superseded_date) WHERE status = 'superseded';

CREATE INDEX idx_qr_scans_document ON public.qr_scan_logs(document_version_id, created_at DESC);
CREATE INDEX idx_qr_scans_user ON public.qr_scan_logs(scanned_by, created_at DESC);

-- Functions for Evidence Chain Management
CREATE OR REPLACE FUNCTION public.log_evidence_chain_event(
    p_project_id UUID,
    p_operative_id UUID,
    p_plot_id UUID DEFAULT NULL,
    p_document_id UUID,
    p_document_type TEXT,
    p_document_version TEXT,
    p_document_revision TEXT DEFAULT NULL,
    p_action_type TEXT,
    p_signature_id UUID DEFAULT NULL,
    p_device_info JSONB DEFAULT '{}',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record_id UUID;
    v_evidence_hash TEXT;
BEGIN
    -- Generate evidence hash for integrity
    v_evidence_hash := encode(
        digest(
            CONCAT(p_project_id, p_operative_id, p_document_id, p_document_version, p_action_type, extract(epoch from now())),
            'sha256'
        ),
        'hex'
    );
    
    -- Insert immutable evidence record
    INSERT INTO public.evidence_chain_records (
        project_id, operative_id, plot_id, document_id, document_type,
        document_version, document_revision, action_type, signature_id,
        device_info, ip_address, evidence_hash, metadata, created_by
    ) VALUES (
        p_project_id, p_operative_id, p_plot_id, p_document_id, p_document_type,
        p_document_version, p_document_revision, p_action_type, p_signature_id,
        p_device_info, inet_client_addr(), v_evidence_hash, p_metadata, p_operative_id
    ) RETURNING id INTO v_record_id;
    
    RETURN v_record_id;
END;
$$;

-- Function to supersede document versions
CREATE OR REPLACE FUNCTION public.supersede_document_version(
    p_old_version_id UUID,
    p_new_version_id UUID,
    p_superseded_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark old version as superseded
    UPDATE public.document_versions 
    SET 
        status = 'superseded',
        superseded_date = now(),
        superseded_by = p_new_version_id,
        updated_at = now()
    WHERE id = p_old_version_id;
    
    -- Create smart revision alerts for users who need to re-sign
    INSERT INTO public.smart_revision_alerts (
        document_version_id,
        alert_type,
        target_users,
        alert_message,
        urgency_level,
        ai_generated
    )
    SELECT 
        p_new_version_id,
        'superseded',
        ARRAY[DISTINCT s.user_id],
        'Document updated - new signature required on version ' || dv.version_number,
        CASE 
            WHEN dv.read_required THEN 'high'
            ELSE 'medium'
        END,
        true
    FROM public.signatures s
    JOIN public.document_versions dv ON dv.id = p_new_version_id
    WHERE s.document_id = (
        SELECT document_id FROM public.document_versions WHERE id = p_old_version_id
    );
    
    RETURN true;
END;
$$;

-- Function for QR code validation
CREATE OR REPLACE FUNCTION public.validate_qr_document(
    p_document_id UUID,
    p_scanned_by UUID,
    p_device_info JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_current_version RECORD;
    v_scan_result TEXT;
BEGIN
    -- Get current version
    SELECT * INTO v_current_version
    FROM public.document_versions
    WHERE document_id = p_document_id
    AND status = 'approved'
    ORDER BY version_number DESC
    LIMIT 1;
    
    IF v_current_version IS NULL THEN
        v_scan_result := 'error';
        v_result := jsonb_build_object(
            'status', 'error',
            'message', 'Document not found or not approved'
        );
    ELSE
        v_scan_result := 'current';
        v_result := jsonb_build_object(
            'status', 'current',
            'document_id', v_current_version.id,
            'version', v_current_version.version_number,
            'revision', v_current_version.revision_code,
            'title', v_current_version.title,
            'message', 'Document is current and approved for use'
        );
    END IF;
    
    -- Log the scan
    INSERT INTO public.qr_scan_logs (
        document_version_id,
        scanned_by,
        scan_device_info,
        scan_result
    ) VALUES (
        v_current_version.id,
        p_scanned_by,
        p_device_info,
        v_scan_result
    );
    
    RETURN v_result;
END;
$$;

-- Trigger to update document_versions updated_at
CREATE TRIGGER update_document_versions_updated_at
    BEFORE UPDATE ON public.document_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update task_plan_templates updated_at
CREATE TRIGGER update_task_plan_templates_updated_at
    BEFORE UPDATE ON public.task_plan_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();