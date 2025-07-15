-- Create storage bucket for CSCS cards if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cscs-cards', 
  'cscs-cards', 
  false, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
) 
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

-- Create RLS policies for CSCS cards storage
CREATE POLICY "Users can upload their own CSCS cards" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cscs-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own CSCS cards" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'cscs-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own CSCS cards" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'cscs-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own CSCS cards" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'cscs-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);