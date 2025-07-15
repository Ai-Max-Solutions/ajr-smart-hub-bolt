-- Add onboarding completion tracking to Users table
ALTER TABLE public."Users" 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;