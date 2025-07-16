-- Create storage bucket for CSCS card uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cards', 'cards', false);

-- Create RLS policies for the cards bucket to allow authenticated users to upload their own cards
CREATE POLICY "Authenticated users can upload their own cards" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own uploaded cards" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own cards" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own cards" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);