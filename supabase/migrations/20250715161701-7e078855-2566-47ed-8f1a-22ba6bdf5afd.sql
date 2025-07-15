-- Update the CSCS card analyzer function to work with the existing cscs_cards table
-- and fix the recursive error by removing the problematic table reference

-- First, let's update the existing cscs_cards table to include the analysis fields
ALTER TABLE public.cscs_cards 
ADD COLUMN IF NOT EXISTS card_number TEXT,
ADD COLUMN IF NOT EXISTS card_color TEXT,
ADD COLUMN IF NOT EXISTS qualifications JSONB,
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC,
ADD COLUMN IF NOT EXISTS raw_ai_response JSONB;

-- Update the cscs-card-analyzer function to use the correct table and avoid recursion
-- The edge function will be updated to store directly in cscs_cards table instead of cscs_card_analysis