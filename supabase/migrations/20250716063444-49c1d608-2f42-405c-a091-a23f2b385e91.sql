-- Add cscs_required column to Users table
ALTER TABLE public."Users" 
ADD COLUMN cscs_required boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public."Users".cscs_required IS 'Indicates if CSCS card validation is required for this user. Set to true after first CSCS card upload.';