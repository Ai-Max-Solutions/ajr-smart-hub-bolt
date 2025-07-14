-- Create CSCS qualification type if it doesn't exist
INSERT INTO public.qualification_types (
    id,
    name,
    code,
    category_id,
    is_mandatory,
    mandatory_for_roles,
    description,
    requires_certificate_number,
    requires_expiry_date,
    requires_issuing_body,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'CSCS Card',
    'CSCS',
    (SELECT id FROM public.qualification_categories WHERE name = 'Safety & Compliance' LIMIT 1),
    true,
    ARRAY['Operative', 'Supervisor', 'Foreman', 'Staff'],
    'Construction Skills Certification Scheme card required for UK construction sites',
    true,
    true,
    false,
    NOW(),
    NOW()
) ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    is_mandatory = EXCLUDED.is_mandatory,
    mandatory_for_roles = EXCLUDED.mandatory_for_roles,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Create a function to save CSCS card from onboarding
CREATE OR REPLACE FUNCTION public.save_cscs_card_from_onboarding(
    p_user_id UUID,
    p_card_number TEXT,
    p_expiry_date DATE,
    p_card_type TEXT,
    p_front_image_url TEXT DEFAULT NULL,
    p_back_image_url TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_qualification_type_id UUID;
    v_qualification_id UUID;
BEGIN
    -- Get CSCS qualification type ID
    SELECT id INTO v_qualification_type_id
    FROM public.qualification_types
    WHERE code = 'CSCS'
    LIMIT 1;
    
    IF v_qualification_type_id IS NULL THEN
        RAISE EXCEPTION 'CSCS qualification type not found';
    END IF;
    
    -- Insert or update CSCS qualification
    INSERT INTO public.qualifications (
        user_id,
        qualification_type_id,
        qualification_type,
        certificate_number,
        expiry_date,
        issuing_body,
        status,
        verification_status,
        document_url,
        notes,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_qualification_type_id,
        'CSCS Card',
        p_card_number,
        p_expiry_date,
        'CITB',
        CASE 
            WHEN p_expiry_date < CURRENT_DATE THEN 'expired'
            ELSE 'active'
        END,
        'pending',
        p_front_image_url,
        JSONB_BUILD_OBJECT(
            'card_type', p_card_type,
            'front_image_url', p_front_image_url,
            'back_image_url', p_back_image_url,
            'source', 'onboarding'
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, qualification_type_id) 
    DO UPDATE SET
        certificate_number = EXCLUDED.certificate_number,
        expiry_date = EXCLUDED.expiry_date,
        status = EXCLUDED.status,
        verification_status = 'pending',
        document_url = EXCLUDED.document_url,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    RETURNING id INTO v_qualification_id;
    
    -- Also update the Users table with CSCS info for backward compatibility
    UPDATE public."Users"
    SET 
        cscscardnumber = p_card_number,
        cscsexpirydate = p_expiry_date
    WHERE whalesync_postgres_id = p_user_id;
    
    RETURN v_qualification_id;
END;
$$;