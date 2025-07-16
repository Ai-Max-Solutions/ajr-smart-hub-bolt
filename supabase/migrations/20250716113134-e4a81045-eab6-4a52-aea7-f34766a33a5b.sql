-- Disable all triggers on Users table and apply constraints
-- Disable all triggers on Users table
ALTER TABLE public."Users" DISABLE TRIGGER ALL;

-- Apply constraints and data type improvements
-- Clean up invalid data first
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

-- Add NOT NULL constraint
ALTER TABLE public."Users" ALTER COLUMN email SET NOT NULL;

-- Improve data types
ALTER TABLE public."Asite_Sync_Log" 
ALTER COLUMN syncdate TYPE timestamp with time zone USING syncdate::timestamp with time zone;

ALTER TABLE public."Asite_Sync_Log" 
ALTER COLUMN nextscheduledsync TYPE timestamp with time zone USING nextscheduledsync::timestamp with time zone;

-- Add unique constraints
ALTER TABLE public."Users" ADD CONSTRAINT unique_user_email UNIQUE (email);

CREATE UNIQUE INDEX unique_drawing_number_idx 
ON public."Drawings" (drawingnumber) 
WHERE drawingnumber IS NOT NULL AND drawingnumber != '';

CREATE UNIQUE INDEX unique_project_uid_idx 
ON public."Projects" (projectuid) 
WHERE projectuid IS NOT NULL AND projectuid != '';

-- Add check constraints for data validation
ALTER TABLE public."Users" ADD CONSTRAINT valid_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public."Users" ADD CONSTRAINT valid_work_days 
CHECK (preferredworkdays IS NULL OR 
       (array_length(preferredworkdays, 1) > 0 AND
        preferredworkdays <@ ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']));

ALTER TABLE public."Users" ADD CONSTRAINT valid_employment_status 
CHECK (employmentstatus IN ('Active', 'Inactive', 'Suspended', 'Terminated', 'Apprentice'));

ALTER TABLE public."Plots" ADD CONSTRAINT valid_completion_percentage 
CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE public."Users" ADD CONSTRAINT valid_performance_rating 
CHECK (performance_rating IS NULL OR (performance_rating >= 1 AND performance_rating <= 5));

-- Re-enable triggers
ALTER TABLE public."Users" ENABLE TRIGGER ALL;