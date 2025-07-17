-- Add missing columns to cscs_cards table for AI analysis
ALTER TABLE public.cscs_cards 
ADD COLUMN IF NOT EXISTS card_color TEXT,
ADD COLUMN IF NOT EXISTS qualifications JSONB,
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC,
ADD COLUMN IF NOT EXISTS raw_ai_response JSONB;