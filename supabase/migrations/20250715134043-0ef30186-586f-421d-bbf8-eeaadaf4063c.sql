-- Add onboarding tracking field to Users table if it doesn't exist
DO $$
BEGIN
    -- Check if onboarding_completed column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Users' 
        AND column_name = 'onboarding_completed'
    ) THEN
        -- Add the onboarding_completed column
        ALTER TABLE public."Users" 
        ADD COLUMN onboarding_completed boolean DEFAULT false;
        
        -- Set existing users as having completed onboarding if they have names
        UPDATE public."Users" 
        SET onboarding_completed = true
        WHERE (firstname IS NOT NULL AND firstname != '') 
        AND (lastname IS NOT NULL AND lastname != '')
        AND employmentstatus = 'Active';
    END IF;
END $$;