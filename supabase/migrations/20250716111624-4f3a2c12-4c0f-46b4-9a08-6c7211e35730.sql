-- Phase 1: Data Cleanup for Constraints
-- Clean up invalid data before adding constraints

-- 1. Clean up NULL emails (deactivate users with no email)
UPDATE public."Users" 
SET employmentstatus = 'Inactive'
WHERE email IS NULL OR email = '';

-- 2. Add missing emails for active users (use a placeholder that admins can fix)
UPDATE public."Users" 
SET email = 'update-required-' || id::text || '@ajryan.temp'
WHERE (email IS NULL OR email = '') 
AND employmentstatus = 'Active';

-- 3. Clean up duplicate emails by making them unique
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

-- 4. Clean up invalid preferred work days
UPDATE public."Users" 
SET preferredworkdays = ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
WHERE preferredworkdays IS NOT NULL 
AND NOT (preferredworkdays <@ ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

-- 5. Clean up duplicate drawing numbers
WITH duplicate_drawings AS (
    SELECT drawingnumber,
           ROW_NUMBER() OVER (PARTITION BY drawingnumber ORDER BY airtable_created_time DESC) as rn,
           id
    FROM public."Drawings"
    WHERE drawingnumber IS NOT NULL AND drawingnumber != ''
)
UPDATE public."Drawings"
SET drawingnumber = public."Drawings".drawingnumber || '-v' || duplicate_drawings.rn::text
FROM duplicate_drawings
WHERE duplicate_drawings.id = public."Drawings".id
AND duplicate_drawings.rn > 1;

-- 6. Clean up duplicate project UIDs
WITH duplicate_projects AS (
    SELECT projectuid,
           ROW_NUMBER() OVER (PARTITION BY projectuid ORDER BY airtable_created_time DESC) as rn,
           id
    FROM public."Projects"
    WHERE projectuid IS NOT NULL AND projectuid != ''
)
UPDATE public."Projects"
SET projectuid = public."Projects".projectuid || '-v' || duplicate_projects.rn::text
FROM duplicate_projects
WHERE duplicate_projects.id = public."Projects".id
AND duplicate_projects.rn > 1;

-- Phase 2: Add NOT NULL Constraints on Critical Fields
ALTER TABLE public."Users" 
ALTER COLUMN email SET NOT NULL;

-- Phase 3: Data Type Improvements - Convert date to timestamp for better precision
ALTER TABLE public."Asite_Sync_Log" 
ALTER COLUMN syncdate TYPE timestamp with time zone USING syncdate::timestamp with time zone;

ALTER TABLE public."Asite_Sync_Log" 
ALTER COLUMN nextscheduledsync TYPE timestamp with time zone USING nextscheduledsync::timestamp with time zone;

-- Phase 4: Add Unique Constraints on Natural Keys
-- Users email should be unique
ALTER TABLE public."Users" 
ADD CONSTRAINT unique_user_email UNIQUE (email);

-- Drawing numbers should be unique (only for non-null values)
CREATE UNIQUE INDEX unique_drawing_number_idx 
ON public."Drawings" (drawingnumber) 
WHERE drawingnumber IS NOT NULL AND drawingnumber != '';

-- Project UIDs should be unique (only for non-null values)  
CREATE UNIQUE INDEX unique_project_uid_idx 
ON public."Projects" (projectuid) 
WHERE projectuid IS NOT NULL AND projectuid != '';

-- Phase 5: Add Check Constraints for Data Validation

-- Email format validation
ALTER TABLE public."Users" 
ADD CONSTRAINT valid_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Phone format validation (allow various formats but ensure not empty if provided)
ALTER TABLE public."Users" 
ADD CONSTRAINT valid_phone_format 
CHECK (phone IS NULL OR (phone != '' AND length(phone) >= 10));

-- Skills array validation - if not null, should have at least one skill
ALTER TABLE public."Users" 
ADD CONSTRAINT valid_skills_array 
CHECK (skills IS NULL OR array_length(skills, 1) > 0);

-- Preferred work days validation - must be valid day names (now with cleaned data)
ALTER TABLE public."Users" 
ADD CONSTRAINT valid_work_days 
CHECK (preferredworkdays IS NULL OR 
       (array_length(preferredworkdays, 1) > 0 AND
        preferredworkdays <@ ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']));

-- Employment status validation
ALTER TABLE public."Users" 
ADD CONSTRAINT valid_employment_status 
CHECK (employmentstatus IN ('Active', 'Inactive', 'Suspended', 'Terminated', 'Apprentice'));

-- Date range validations
ALTER TABLE public."Projects" 
ADD CONSTRAINT valid_project_dates 
CHECK (startdate IS NULL OR plannedenddate IS NULL OR startdate <= plannedenddate);

ALTER TABLE public."Projects" 
ADD CONSTRAINT valid_actual_end_date 
CHECK (actualenddate IS NULL OR startdate IS NULL OR startdate <= actualenddate);

-- Plot completion percentage validation
ALTER TABLE public."Plots" 
ADD CONSTRAINT valid_completion_percentage 
CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

-- Drawing status validation
ALTER TABLE public."Drawings" 
ADD CONSTRAINT valid_drawing_status 
CHECK (drawingstatus IN ('Draft', 'For Review', 'Approved', 'Superseded', 'Cancelled', 'Current', 'Archived'));

-- Project status validation  
ALTER TABLE public."Projects" 
ADD CONSTRAINT valid_project_status 
CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled', 'Archived'));

-- Plot status validation
ALTER TABLE public."Plots" 
ADD CONSTRAINT valid_plot_status 
CHECK (plotstatus IN ('Not Started', 'First Fix', 'Second Fix', 'Snagging', 'Complete', 'Handed Over', 'On Hold'));

-- Performance rating validation
ALTER TABLE public."Users" 
ADD CONSTRAINT valid_performance_rating 
CHECK (performance_rating IS NULL OR (performance_rating >= 1 AND performance_rating <= 5));