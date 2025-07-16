-- Constraint and Data Type Cleanup (After fixing all functions)
-- Add NOT NULL constraint on email
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_email_not_null' 
        AND table_name = 'Users'
    ) THEN
        -- Clean up NULL emails first
        UPDATE public."Users" 
        SET employmentstatus = 'Inactive'
        WHERE email IS NULL OR email = '';

        UPDATE public."Users" 
        SET email = 'update-required-' || id::text || '@ajryan.temp'
        WHERE (email IS NULL OR email = '') 
        AND employmentstatus = 'Active';

        -- Add NOT NULL constraint
        ALTER TABLE public."Users" ALTER COLUMN email SET NOT NULL;
    END IF;
END $$;

-- Improve data types
DO $$
BEGIN
    -- Convert sync dates to timestamps
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Asite_Sync_Log' 
        AND column_name = 'syncdate' 
        AND data_type = 'date'
    ) THEN
        ALTER TABLE public."Asite_Sync_Log" 
        ALTER COLUMN syncdate TYPE timestamp with time zone USING syncdate::timestamp with time zone;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Asite_Sync_Log' 
        AND column_name = 'nextscheduledsync' 
        AND data_type = 'date'
    ) THEN
        ALTER TABLE public."Asite_Sync_Log" 
        ALTER COLUMN nextscheduledsync TYPE timestamp with time zone USING nextscheduledsync::timestamp with time zone;
    END IF;
END $$;

-- Add unique constraints
DO $$
BEGIN
    -- Email unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_email'
    ) THEN
        -- Clean up duplicate emails first
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
        
        ALTER TABLE public."Users" ADD CONSTRAINT unique_user_email UNIQUE (email);
    END IF;

    -- Drawing number unique index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'unique_drawing_number_idx'
    ) THEN
        CREATE UNIQUE INDEX unique_drawing_number_idx 
        ON public."Drawings" (drawingnumber) 
        WHERE drawingnumber IS NOT NULL AND drawingnumber != '';
    END IF;

    -- Project UID unique index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'unique_project_uid_idx'
    ) THEN
        CREATE UNIQUE INDEX unique_project_uid_idx 
        ON public."Projects" (projectuid) 
        WHERE projectuid IS NOT NULL AND projectuid != '';
    END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
    -- Clean up invalid work days first
    UPDATE public."Users" 
    SET preferredworkdays = ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    WHERE preferredworkdays IS NOT NULL 
    AND NOT (preferredworkdays <@ ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

    -- Add constraints if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_email_format') THEN
        ALTER TABLE public."Users" ADD CONSTRAINT valid_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_work_days') THEN
        ALTER TABLE public."Users" ADD CONSTRAINT valid_work_days 
        CHECK (preferredworkdays IS NULL OR 
               (array_length(preferredworkdays, 1) > 0 AND
                preferredworkdays <@ ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_employment_status') THEN
        ALTER TABLE public."Users" ADD CONSTRAINT valid_employment_status 
        CHECK (employmentstatus IN ('Active', 'Inactive', 'Suspended', 'Terminated', 'Apprentice'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_completion_percentage') THEN
        ALTER TABLE public."Plots" ADD CONSTRAINT valid_completion_percentage 
        CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_performance_rating') THEN
        ALTER TABLE public."Users" ADD CONSTRAINT valid_performance_rating 
        CHECK (performance_rating IS NULL OR (performance_rating >= 1 AND performance_rating <= 5));
    END IF;
END $$;