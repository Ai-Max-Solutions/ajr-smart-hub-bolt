-- Final constraint and data type cleanup
-- Clean up data first
UPDATE public."Users" 
SET preferredworkdays = ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
WHERE preferredworkdays IS NOT NULL 
AND NOT (preferredworkdays <@ ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

UPDATE public."Users" 
SET employmentstatus = 'Inactive'
WHERE email IS NULL OR email = '';

UPDATE public."Users" 
SET email = 'update-required-' || id::text || '@ajryan.temp'
WHERE (email IS NULL OR email = '') 
AND employmentstatus = 'Active';

-- Clean up duplicate emails
WITH duplicate_emails AS (
    SELECT email, 
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY airtable_created_time DESC) as rn,
           id
    FROM public."Users"
    WHERE email IS NOT NULL
)
UPDATE public."Users"
SET email = public."Users".email || '-duplicate-' || public."Users".id::text
FROM duplicate_emails
WHERE duplicate_emails.id = public."Users".id 
AND duplicate_emails.rn > 1;

-- Add constraints only if they don't already exist
DO $$
BEGIN
    -- NOT NULL constraint on email
    PERFORM 1 WHERE EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Users' 
        AND column_name = 'email' 
        AND is_nullable = 'YES'
    );
    IF FOUND THEN
        ALTER TABLE public."Users" ALTER COLUMN email SET NOT NULL;
    END IF;

    -- Unique constraint on email
    PERFORM 1 WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_email'
    );
    IF FOUND THEN
        ALTER TABLE public."Users" ADD CONSTRAINT unique_user_email UNIQUE (email);
    END IF;

    -- Check constraints
    PERFORM 1 WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_email_format'
    );
    IF FOUND THEN
        ALTER TABLE public."Users" ADD CONSTRAINT valid_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;

    PERFORM 1 WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_work_days'
    );
    IF FOUND THEN
        ALTER TABLE public."Users" ADD CONSTRAINT valid_work_days 
        CHECK (preferredworkdays IS NULL OR 
               (array_length(preferredworkdays, 1) > 0 AND
                preferredworkdays <@ ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']));
    END IF;

    PERFORM 1 WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_employment_status'
    );
    IF FOUND THEN
        ALTER TABLE public."Users" ADD CONSTRAINT valid_employment_status 
        CHECK (employmentstatus IN ('Active', 'Inactive', 'Suspended', 'Terminated', 'Apprentice'));
    END IF;

    PERFORM 1 WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_completion_percentage'
    );
    IF FOUND THEN
        ALTER TABLE public."Plots" ADD CONSTRAINT valid_completion_percentage 
        CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    END IF;

    PERFORM 1 WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_performance_rating'
    );
    IF FOUND THEN
        ALTER TABLE public."Users" ADD CONSTRAINT valid_performance_rating 
        CHECK (performance_rating IS NULL OR (performance_rating >= 1 AND performance_rating <= 5));
    END IF;
END $$;