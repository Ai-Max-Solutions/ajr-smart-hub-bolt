-- Function to check contractor compliance
CREATE OR REPLACE FUNCTION public.check_contractor_compliance(p_contractor_id UUID, p_project_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_mandatory_docs INTEGER;
    v_uploaded_docs INTEGER;
    v_expired_docs INTEGER;
    v_expiring_soon_docs INTEGER;
BEGIN
    -- Check mandatory documents
    SELECT COUNT(*) INTO v_mandatory_docs
    FROM public.training_document_types
    WHERE is_mandatory = true;
    
    -- Check uploaded mandatory documents
    SELECT COUNT(*) INTO v_uploaded_docs
    FROM public.contractor_training_documents ctd
    JOIN public.training_document_types tdt ON ctd.document_type_id = tdt.id
    WHERE ctd.contractor_id = p_contractor_id
    AND tdt.is_mandatory = true
    AND ctd.status IN ('active', 'expiring_soon');
    
    -- Check expired documents
    SELECT COUNT(*) INTO v_expired_docs
    FROM public.contractor_training_documents
    WHERE contractor_id = p_contractor_id
    AND expiry_date < CURRENT_DATE;
    
    -- Check expiring soon (within 30 days)
    SELECT COUNT(*) INTO v_expiring_soon_docs
    FROM public.contractor_training_documents
    WHERE contractor_id = p_contractor_id
    AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';
    
    -- Check project-specific RAMS signing
    v_result := jsonb_build_object(
        'is_compliant', (v_uploaded_docs >= v_mandatory_docs AND v_expired_docs = 0),
        'mandatory_docs_count', v_mandatory_docs,
        'uploaded_docs_count', v_uploaded_docs,
        'expired_docs_count', v_expired_docs,
        'expiring_soon_count', v_expiring_soon_docs,
        'compliance_percentage', CASE 
            WHEN v_mandatory_docs > 0 THEN ROUND((v_uploaded_docs::NUMERIC / v_mandatory_docs) * 100, 0)
            ELSE 100
        END
    );
    
    -- Add project-specific compliance if project_id provided
    IF p_project_id IS NOT NULL THEN
        v_result := v_result || jsonb_build_object(
            'project_rams_signed', EXISTS (
                SELECT 1 FROM public.contractor_project_assignments
                WHERE contractor_id = p_contractor_id
                AND project_id = p_project_id
                AND rams_signed_at IS NOT NULL
            )
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- Function to update document status based on expiry
CREATE OR REPLACE FUNCTION public.update_training_document_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.expiry_date IS NOT NULL THEN
        IF NEW.expiry_date < CURRENT_DATE THEN
            NEW.status := 'expired';
        ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
            NEW.status := 'expiring_soon';
        ELSE
            NEW.status := 'active';
        END IF;
    END IF;
    
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- Create trigger for automatic status updates
CREATE TRIGGER update_training_document_status_trigger
    BEFORE INSERT OR UPDATE ON public.contractor_training_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_training_document_status();

-- Create storage bucket for contractor documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contractor-documents',
    'contractor-documents',
    false,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
);

-- Storage policies for contractor documents
CREATE POLICY "Contractors can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'contractor-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Contractors can view own documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'contractor-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Contractors can update own documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'contractor-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Contractors can delete own documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'contractor-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage all contractor documents"
ON storage.objects FOR ALL
USING (
    bucket_id = 'contractor-documents' 
    AND EXISTS (
        SELECT 1 FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);