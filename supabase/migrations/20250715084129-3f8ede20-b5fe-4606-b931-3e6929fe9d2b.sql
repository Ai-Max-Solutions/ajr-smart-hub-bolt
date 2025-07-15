-- Create training-documents storage bucket for contractor document uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('training-documents', 'training-documents', true);

-- Create storage policies for training documents
CREATE POLICY "Contractors can view own training documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'training-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Contractors can upload own training documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'training-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Contractors can update own training documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'training-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin/Document Controller access to all training documents
CREATE POLICY "Admins can manage all training documents" 
ON storage.objects 
FOR ALL
USING (
  bucket_id = 'training-documents' 
  AND EXISTS (
    SELECT 1 FROM contractor_profiles cp
    JOIN "Users" u ON u.whalesync_postgres_id = auth.uid()
    WHERE u.role IN ('Admin', 'Document Controller', 'Project Manager')
  )
);