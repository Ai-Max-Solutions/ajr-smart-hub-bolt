-- First, check if the cscs-cards bucket exists and create it if not
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cscs-cards', 'cscs-cards', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for CSCS card uploads
-- Users can upload their own CSCS cards
CREATE POLICY "Users can upload own CSCS cards" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cscs-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own CSCS cards
CREATE POLICY "Users can view own CSCS cards" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'cscs-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all CSCS cards
CREATE POLICY "Admins can view all CSCS cards" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'cscs-cards' 
  AND EXISTS (
    SELECT 1 FROM "Users" u
    WHERE u.supabase_auth_id = auth.uid()
    AND u.role IN ('Admin', 'Document Controller', 'Project Manager')
  )
);

-- Create the cscs_card_analysis table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cscs_card_analysis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  image_url text NOT NULL,
  card_number text,
  expiry_date date,
  card_color text,
  card_type text,
  qualifications jsonb,
  confidence_score numeric,
  raw_ai_response jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on cscs_card_analysis
ALTER TABLE public.cscs_card_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cscs_card_analysis
CREATE POLICY "Users can view own CSCS analysis" 
ON public.cscs_card_analysis 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own CSCS analysis" 
ON public.cscs_card_analysis 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Admins can view all CSCS analysis
CREATE POLICY "Admins can view all CSCS analysis" 
ON public.cscs_card_analysis 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "Users" u
    WHERE u.supabase_auth_id = auth.uid()
    AND u.role IN ('Admin', 'Document Controller', 'Project Manager')
  )
);