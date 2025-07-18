
-- Step 1: Schema Safety & Database Fixes
-- Make CSCS card fields nullable to prevent constraint errors
ALTER TABLE public.cscs_cards 
ALTER COLUMN expiry_date DROP NOT NULL;

ALTER TABLE public.cscs_cards 
ALTER COLUMN front_image_url DROP NOT NULL;

ALTER TABLE public.cscs_cards 
ALTER COLUMN back_image_url DROP NOT NULL;

-- Add default status if not already present
ALTER TABLE public.cscs_cards 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add comment for documentation
COMMENT ON COLUMN public.cscs_cards.expiry_date IS 'Card expiry date - nullable to prevent insert failures during onboarding';
COMMENT ON COLUMN public.cscs_cards.front_image_url IS 'Front image URL - nullable until upload completes';
COMMENT ON COLUMN public.cscs_cards.back_image_url IS 'Back image URL - nullable until upload completes';
