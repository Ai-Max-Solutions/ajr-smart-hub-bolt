-- Create storage bucket for CSCS cards
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cards', 'cards', false);

-- Create storage policies for cards bucket
CREATE POLICY "Users can upload own cards" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own cards" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own cards" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own cards" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'cards' AND auth.uid()::text = (storage.foldername(name))[1]);