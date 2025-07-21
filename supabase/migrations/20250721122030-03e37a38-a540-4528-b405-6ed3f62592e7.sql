
-- Create document_folders table for organizing documents
CREATE TABLE public.document_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  folder_type TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.document_folders(id) ON DELETE CASCADE,
  sequence_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_registry table for storing document metadata
CREATE TABLE public.document_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  version_number TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'active',
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  is_current_version BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_embeddings table for AI search functionality
CREATE TABLE public.document_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.document_registry(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding_vector VECTOR(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rag_query_history table for tracking AI queries
CREATE TABLE public.rag_query_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  project_id UUID REFERENCES public.projects(id),
  document_id UUID REFERENCES public.document_registry(id),
  query_text TEXT NOT NULL,
  response_text TEXT,
  retrieved_chunks JSONB DEFAULT '[]',
  query_type TEXT DEFAULT 'general',
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false);

-- Enable RLS on all new tables
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_query_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_folders
CREATE POLICY "Users can view project folders" ON public.document_folders
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN project_team_members ptm ON ptm.project_id = p.id
      JOIN users u ON u.id = ptm.user_id
      WHERE u.supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all folders" ON public.document_folders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.supabase_auth_id = auth.uid()
      AND u.role IN ('Admin', 'PM', 'Director')
    )
  );

-- RLS Policies for document_registry
CREATE POLICY "Users can view project documents" ON public.document_registry
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN project_team_members ptm ON ptm.project_id = p.id
      JOIN users u ON u.id = ptm.user_id
      WHERE u.supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents to their projects" ON public.document_registry
  FOR INSERT WITH CHECK (
    uploaded_by IN (
      SELECT u.id FROM users u WHERE u.supabase_auth_id = auth.uid()
    )
    AND project_id IN (
      SELECT p.id FROM projects p
      JOIN project_team_members ptm ON ptm.project_id = p.id
      JOIN users u ON u.id = ptm.user_id
      WHERE u.supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can update their documents" ON public.document_registry
  FOR UPDATE USING (
    uploaded_by IN (
      SELECT u.id FROM users u WHERE u.supabase_auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.supabase_auth_id = auth.uid()
      AND u.role IN ('Admin', 'PM', 'Director')
    )
  );

-- RLS Policies for document_embeddings
CREATE POLICY "Users can view embeddings for accessible documents" ON public.document_embeddings
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM document_registry
      WHERE project_id IN (
        SELECT p.id FROM projects p
        JOIN project_team_members ptm ON ptm.project_id = p.id
        JOIN users u ON u.id = ptm.user_id
        WHERE u.supabase_auth_id = auth.uid()
      )
    )
  );

-- RLS Policies for rag_query_history
CREATE POLICY "Users can view their own query history" ON public.rag_query_history
  FOR SELECT USING (
    user_id IN (
      SELECT u.id FROM users u WHERE u.supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can create query history" ON public.rag_query_history
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT u.id FROM users u WHERE u.supabase_auth_id = auth.uid()
    )
  );

-- Storage policies for project-documents bucket
CREATE POLICY "Users can upload to project documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view project documents they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-documents'
    AND auth.role() = 'authenticated'
  );

-- Create indexes for performance
CREATE INDEX idx_document_registry_project_id ON public.document_registry(project_id);
CREATE INDEX idx_document_registry_folder_id ON public.document_registry(folder_id);
CREATE INDEX idx_document_registry_type ON public.document_registry(document_type);
CREATE INDEX idx_document_embeddings_document_id ON public.document_embeddings(document_id);
CREATE INDEX idx_rag_query_history_user_project ON public.rag_query_history(user_id, project_id);
