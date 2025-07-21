
-- Phase 1: Database Schema Extensions (Non-Destructive)

-- 1. Extend User Roles to include Engineer and DocumentController
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'Engineer';
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'DocumentController';

-- 2. Create Fieldwire Projects table
CREATE TABLE public.fieldwire_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  fieldwire_project_id TEXT NOT NULL,
  fieldwire_project_name TEXT NOT NULL,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, fieldwire_project_id)
);

-- 3. Create Drawing Register table
CREATE TABLE public.drawing_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  drawing_name TEXT NOT NULL,
  drawing_number TEXT NOT NULL,
  revision TEXT NOT NULL DEFAULT 'A',
  file_path TEXT,
  fieldwire_sheet_id TEXT,
  drawing_type TEXT NOT NULL DEFAULT 'Plan',
  uploaded_by UUID REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create RFI Tracker table
CREATE TABLE public.rfi_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  rfi_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES public.users(id),
  assigned_to UUID REFERENCES public.users(id),
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Open',
  due_date DATE,
  response TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  voice_note_url TEXT,
  attachment_urls TEXT[],
  fieldwire_form_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create Snag Log table
CREATE TABLE public.snag_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  snag_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_by UUID NOT NULL REFERENCES public.users(id),
  assigned_to UUID REFERENCES public.users(id),
  severity TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Open',
  location_notes TEXT,
  photo_urls TEXT[],
  video_urls TEXT[],
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  fieldwire_task_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create Engineer Badges table
CREATE TABLE public.engineer_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create Fieldwire Sync Log table
CREATE TABLE public.fieldwire_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  operation TEXT NOT NULL,
  fieldwire_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  request_data JSONB,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Create Voice Notes table
CREATE TABLE public.voice_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  transcript TEXT,
  audio_url TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.fieldwire_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawing_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfi_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snag_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineer_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fieldwire_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Fieldwire Projects
CREATE POLICY "Engineers and Admins can view fieldwire projects" 
  ON public.fieldwire_projects 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Engineer', 'DocumentController', 'Admin', 'PM', 'Director')
  ));

CREATE POLICY "Admins can manage fieldwire projects" 
  ON public.fieldwire_projects 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'PM', 'Director')
  ));

-- RLS Policies for Drawing Register
CREATE POLICY "Engineers and Admins can view drawings" 
  ON public.drawing_register 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Engineer', 'DocumentController', 'Admin', 'PM', 'Director')
  ));

CREATE POLICY "Document Controllers can manage drawings" 
  ON public.drawing_register 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('DocumentController', 'Admin', 'Director')
  ));

-- RLS Policies for RFI Tracker
CREATE POLICY "Engineers can view RFIs" 
  ON public.rfi_tracker 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Engineer', 'DocumentController', 'Admin', 'PM', 'Director')
  ));

CREATE POLICY "Engineers can create RFIs" 
  ON public.rfi_tracker 
  FOR INSERT 
  WITH CHECK (submitted_by IN (
    SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
  ));

CREATE POLICY "Engineers can update their RFIs" 
  ON public.rfi_tracker 
  FOR UPDATE 
  USING (submitted_by IN (
    SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('DocumentController', 'Admin', 'PM', 'Director')
  ));

-- RLS Policies for Snag Log
CREATE POLICY "Engineers can view snags" 
  ON public.snag_log 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Engineer', 'DocumentController', 'Admin', 'PM', 'Director', 'Supervisor')
  ));

CREATE POLICY "Engineers can create snags" 
  ON public.snag_log 
  FOR INSERT 
  WITH CHECK (reported_by IN (
    SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
  ));

CREATE POLICY "Engineers can update their snags" 
  ON public.snag_log 
  FOR UPDATE 
  USING (reported_by IN (
    SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
  ) OR assigned_to IN (
    SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'PM', 'Director', 'Supervisor')
  ));

-- RLS Policies for Engineer Badges
CREATE POLICY "Users can view their own badges" 
  ON public.engineer_badges 
  FOR SELECT 
  USING (user_id IN (
    SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
  ));

CREATE POLICY "System can create badges" 
  ON public.engineer_badges 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view all badges" 
  ON public.engineer_badges 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'PM', 'Director')
  ));

-- RLS Policies for Fieldwire Sync Log
CREATE POLICY "Admins can view sync logs" 
  ON public.fieldwire_sync_log 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Director')
  ));

CREATE POLICY "System can create sync logs" 
  ON public.fieldwire_sync_log 
  FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for Voice Notes
CREATE POLICY "Users can manage their own voice notes" 
  ON public.voice_notes 
  FOR ALL 
  USING (user_id IN (
    SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
  ));

CREATE POLICY "Admins can view all voice notes" 
  ON public.voice_notes 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'PM', 'Director')
  ));

-- Create storage buckets for new file types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('drawings', 'drawings', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'application/dwg']),
  ('rfi-attachments', 'rfi-attachments', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'video/mp4', 'video/mov']),
  ('snag-photos', 'snag-photos', false, 20971520, ARRAY['image/jpeg', 'image/png', 'video/mp4', 'video/mov']),
  ('voice-notes', 'voice-notes', false, 10485760, ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for drawings
CREATE POLICY "Engineers can view drawings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'drawings' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Engineer', 'DocumentController', 'Admin', 'PM', 'Director')
  )
);

CREATE POLICY "Document Controllers can upload drawings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'drawings' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('DocumentController', 'Admin', 'Director')
  )
);

-- Storage policies for RFI attachments
CREATE POLICY "Engineers can manage RFI attachments"
ON storage.objects FOR ALL
USING (
  bucket_id = 'rfi-attachments' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Engineer', 'DocumentController', 'Admin', 'PM', 'Director')
  )
);

-- Storage policies for snag photos
CREATE POLICY "Engineers can manage snag photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'snag-photos' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Engineer', 'DocumentController', 'Admin', 'PM', 'Director', 'Supervisor')
  )
);

-- Storage policies for voice notes
CREATE POLICY "Users can manage their own voice notes"
ON storage.objects FOR ALL
USING (
  bucket_id = 'voice-notes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add indexes for performance
CREATE INDEX idx_fieldwire_projects_project_id ON public.fieldwire_projects(project_id);
CREATE INDEX idx_drawing_register_project_id ON public.drawing_register(project_id);
CREATE INDEX idx_drawing_register_plot_id ON public.drawing_register(plot_id);
CREATE INDEX idx_rfi_tracker_project_id ON public.rfi_tracker(project_id);
CREATE INDEX idx_rfi_tracker_status ON public.rfi_tracker(status);
CREATE INDEX idx_snag_log_project_id ON public.snag_log(project_id);
CREATE INDEX idx_snag_log_status ON public.snag_log(status);
CREATE INDEX idx_engineer_badges_user_id ON public.engineer_badges(user_id);
CREATE INDEX idx_fieldwire_sync_log_project_id ON public.fieldwire_sync_log(project_id);
CREATE INDEX idx_voice_notes_user_id ON public.voice_notes(user_id);
CREATE INDEX idx_voice_notes_project_id ON public.voice_notes(project_id);
