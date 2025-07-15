-- Add CSCS validation fields to Users table
ALTER TABLE public."Users" 
ADD COLUMN IF NOT EXISTS cscs_upload_required boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS cscs_validation_status text DEFAULT 'pending' CHECK (cscs_validation_status IN ('pending', 'valid', 'expired', 'rejected')),
ADD COLUMN IF NOT EXISTS cscs_last_validated timestamp with time zone,
ADD COLUMN IF NOT EXISTS cscs_uploaded_at timestamp with time zone;

-- Create index for efficient CSCS status queries
CREATE INDEX IF NOT EXISTS idx_users_cscs_status ON public."Users"(cscs_validation_status);
CREATE INDEX IF NOT EXISTS idx_users_cscs_expiry ON public."Users"(cscscardnumber, cscsexpirydate) WHERE cscsexpirydate IS NOT NULL;

-- Function to check CSCS validity
CREATE OR REPLACE FUNCTION public.check_user_cscs_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_result jsonb;
    v_days_until_expiry integer;
BEGIN
    -- Get user CSCS details
    SELECT 
        cscscardnumber,
        cscsexpirydate,
        cscs_validation_status,
        cscs_last_validated,
        cscs_uploaded_at
    INTO v_user
    FROM public."Users"
    WHERE whalesync_postgres_id = p_user_id;
    
    -- Check if CSCS card number exists
    IF v_user.cscscardnumber IS NULL OR v_user.cscscardnumber = '' THEN
        v_result := jsonb_build_object(
            'is_valid', false,
            'status', 'missing',
            'reason', 'No CSCS card uploaded',
            'requires_upload', true
        );
    -- Check if expiry date exists
    ELSIF v_user.cscsexpirydate IS NULL THEN
        v_result := jsonb_build_object(
            'is_valid', false,
            'status', 'incomplete',
            'reason', 'CSCS card missing expiry date',
            'requires_upload', true
        );
    ELSE
        -- Calculate days until expiry
        v_days_until_expiry := (v_user.cscsexpirydate - CURRENT_DATE)::integer;
        
        -- Determine status based on expiry
        IF v_days_until_expiry < 0 THEN
            v_result := jsonb_build_object(
                'is_valid', false,
                'status', 'expired',
                'reason', 'CSCS card has expired',
                'requires_upload', true,
                'days_until_expiry', v_days_until_expiry,
                'expired_days', abs(v_days_until_expiry)
            );
        ELSIF v_days_until_expiry <= 7 THEN
            v_result := jsonb_build_object(
                'is_valid', true,
                'status', 'critical',
                'reason', 'CSCS card expires within 7 days',
                'requires_upload', false,
                'days_until_expiry', v_days_until_expiry,
                'warning_level', 'critical'
            );
        ELSIF v_days_until_expiry <= 30 THEN
            v_result := jsonb_build_object(
                'is_valid', true,
                'status', 'warning',
                'reason', 'CSCS card expires within 30 days',
                'requires_upload', false,
                'days_until_expiry', v_days_until_expiry,
                'warning_level', 'warning'
            );
        ELSE
            v_result := jsonb_build_object(
                'is_valid', true,
                'status', 'valid',
                'reason', 'CSCS card is valid',
                'requires_upload', false,
                'days_until_expiry', v_days_until_expiry
            );
        END IF;
    END IF;
    
    -- Add card details to result
    v_result := v_result || jsonb_build_object(
        'card_number', v_user.cscscardnumber,
        'expiry_date', v_user.cscsexpirydate,
        'last_validated', v_user.cscs_last_validated,
        'uploaded_at', v_user.cscs_uploaded_at
    );
    
    RETURN v_result;
END;
$$;

-- Function to update CSCS status after upload
CREATE OR REPLACE FUNCTION public.update_user_cscs_status(p_user_id uuid, p_card_number text, p_expiry_date date)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_validation_status text;
BEGIN
    -- Determine validation status based on expiry date
    IF p_expiry_date < CURRENT_DATE THEN
        v_validation_status := 'expired';
    ELSIF p_expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN
        v_validation_status := 'valid'; -- Still valid but will show critical warning
    ELSE
        v_validation_status := 'valid';
    END IF;
    
    -- Update user record
    UPDATE public."Users"
    SET 
        cscscardnumber = p_card_number,
        cscsexpirydate = p_expiry_date,
        cscs_validation_status = v_validation_status,
        cscs_last_validated = now(),
        cscs_uploaded_at = COALESCE(cscs_uploaded_at, now()), -- Only set if not already set
        cscs_upload_required = false
    WHERE whalesync_postgres_id = p_user_id;
    
    RETURN FOUND;
END;
$$;