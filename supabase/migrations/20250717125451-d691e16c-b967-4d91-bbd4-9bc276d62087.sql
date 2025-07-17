-- Make CSCS card fields more flexible to prevent insert failures
-- Allow expiry_date to be nullable temporarily (can be enforced via frontend validation)
ALTER TABLE public.cscs_cards 
ALTER COLUMN expiry_date DROP NOT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.cscs_cards.expiry_date IS 'Card expiry date - can be null if not provided during upload, should be validated on frontend';