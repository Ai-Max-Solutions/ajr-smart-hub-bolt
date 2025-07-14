-- Add remaining database functions for Evidence Chain System

-- Function for Evidence Chain Management
CREATE OR REPLACE FUNCTION public.log_evidence_chain_event(
    p_project_id UUID,
    p_operative_id UUID,
    p_document_id UUID,
    p_document_type TEXT,
    p_document_version TEXT,
    p_action_type TEXT,
    p_plot_id UUID DEFAULT NULL,
    p_document_revision TEXT DEFAULT NULL,
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
        ARRAY[s.user_id],
        'Document updated - new signature required on version ' || dv.version_number,
        CASE 
            WHEN dv.read_required THEN 'high'
            ELSE 'medium'
        END,
        true
    FROM public.signatures s
    JOIN public.document_versions dv ON dv.id = p_new_version_id
    WHERE s.document_id::text = (
        SELECT document_id::text FROM public.document_versions WHERE id = p_old_version_id
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

-- Function to get evidence chain report
CREATE OR REPLACE FUNCTION public.get_evidence_chain_report(
    p_project_id UUID DEFAULT NULL,
    p_operative_id UUID DEFAULT NULL,
    p_plot_id UUID DEFAULT NULL,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE(
    record_id UUID,
    project_name TEXT,
    operative_name TEXT,
    plot_number TEXT,
    document_type TEXT,
    document_version TEXT,
    action_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    evidence_hash TEXT,
    device_info JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ecr.id,
        p.projectname,
        u.fullname,
        pl.plotnumber,
        ecr.document_type,
        ecr.document_version,
        ecr.action_type,
        ecr.created_at,
        ecr.evidence_hash,
        ecr.device_info
    FROM public.evidence_chain_records ecr
    LEFT JOIN public."Projects" p ON p.whalesync_postgres_id = ecr.project_id
    LEFT JOIN public."Users" u ON u.whalesync_postgres_id = ecr.operative_id
    LEFT JOIN public."Plots" pl ON pl.whalesync_postgres_id = ecr.plot_id
    WHERE 
        (p_project_id IS NULL OR ecr.project_id = p_project_id)
        AND (p_operative_id IS NULL OR ecr.operative_id = p_operative_id)
        AND (p_plot_id IS NULL OR ecr.plot_id = p_plot_id)
        AND (p_date_from IS NULL OR ecr.created_at::date >= p_date_from)
        AND (p_date_to IS NULL OR ecr.created_at::date <= p_date_to)
    ORDER BY ecr.chain_sequence DESC;
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