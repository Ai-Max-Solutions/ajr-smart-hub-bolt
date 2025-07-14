-- First, let's ensure we have proper storage setup for CSCS card images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cscs-cards', 'cscs-cards', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create policies for CSCS card storage
CREATE POLICY "Users can upload their own CSCS cards" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cscs-cards' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own CSCS cards" ON storage.objects
FOR SELECT USING (
  bucket_id = 'cscs-cards' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own CSCS cards" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'cscs-cards' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table for CSCS card analysis results
CREATE TABLE IF NOT EXISTS public.cscs_card_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  card_number TEXT,
  expiry_date DATE,
  card_color TEXT,
  card_type TEXT,
  qualifications JSONB,
  confidence_score NUMERIC(3,2),
  raw_ai_response JSONB,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cscs_card_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own CSCS analysis" ON public.cscs_card_analysis
FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cscs_card_analysis_updated_at
    BEFORE UPDATE ON public.cscs_card_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();