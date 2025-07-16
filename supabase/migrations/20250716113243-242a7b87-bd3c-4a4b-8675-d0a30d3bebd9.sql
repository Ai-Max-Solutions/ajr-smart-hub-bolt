-- Constraint and data type cleanup - essential constraints only
-- Add constraints that don't require data updates to avoid triggering functions

-- Improve data types for better precision
ALTER TABLE public."Asite_Sync_Log" 
ALTER COLUMN syncdate TYPE timestamp with time zone USING syncdate::timestamp with time zone;

ALTER TABLE public."Asite_Sync_Log" 
ALTER COLUMN nextscheduledsync TYPE timestamp with time zone USING nextscheduledsync::timestamp with time zone;

-- Add unique indexes for natural keys (using partial indexes to handle nulls)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'unique_drawing_number_idx') THEN
        CREATE UNIQUE INDEX unique_drawing_number_idx 
        ON public."Drawings" (drawingnumber) 
        WHERE drawingnumber IS NOT NULL AND drawingnumber != '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'unique_project_uid_idx') THEN
        CREATE UNIQUE INDEX unique_project_uid_idx 
        ON public."Projects" (projectuid) 
        WHERE projectuid IS NOT NULL AND projectuid != '';
    END IF;
END $$;

-- Add essential check constraints that enforce data integrity
DO $$
BEGIN
    -- Plot completion percentage validation
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_completion_percentage') THEN
        ALTER TABLE public."Plots" ADD CONSTRAINT valid_completion_percentage 
        CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
    END IF;

    -- Performance rating validation  
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_performance_rating') THEN
        ALTER TABLE public."Users" ADD CONSTRAINT valid_performance_rating 
        CHECK (performance_rating IS NULL OR (performance_rating >= 1 AND performance_rating <= 5));
    END IF;

    -- Date range validations for projects
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_project_dates') THEN
        ALTER TABLE public."Projects" ADD CONSTRAINT valid_project_dates 
        CHECK (startdate IS NULL OR plannedenddate IS NULL OR startdate <= plannedenddate);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_actual_end_date') THEN
        ALTER TABLE public."Projects" ADD CONSTRAINT valid_actual_end_date 
        CHECK (actualenddate IS NULL OR startdate IS NULL OR startdate <= actualenddate);
    END IF;

    -- Drawing and project status validations
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_drawing_status') THEN
        ALTER TABLE public."Drawings" ADD CONSTRAINT valid_drawing_status 
        CHECK (drawingstatus IN ('Draft', 'For Review', 'Approved', 'Superseded', 'Cancelled', 'Current', 'Archived'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_project_status') THEN
        ALTER TABLE public."Projects" ADD CONSTRAINT valid_project_status 
        CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled', 'Archived'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_plot_status') THEN
        ALTER TABLE public."Plots" ADD CONSTRAINT valid_plot_status 
        CHECK (plotstatus IN ('Not Started', 'First Fix', 'Second Fix', 'Snagging', 'Complete', 'Handed Over', 'On Hold'));
    END IF;
END $$;