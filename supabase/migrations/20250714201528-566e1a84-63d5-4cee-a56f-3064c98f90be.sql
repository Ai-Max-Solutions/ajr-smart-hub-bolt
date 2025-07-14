-- Add DABS functionality to site_notices table
ALTER TABLE public.site_notices 
ADD COLUMN IF NOT EXISTS notice_category text DEFAULT 'general' CHECK (notice_category IN ('general', 'dabs', 'safety_alert', 'toolbox_talk')),
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS auto_archive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS signature_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'read', 'signed', 'archived', 'expired')),
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public."Users"(whalesync_postgres_id),
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_notices_category ON public.site_notices(notice_category);
CREATE INDEX IF NOT EXISTS idx_site_notices_expires_at ON public.site_notices(expires_at);
CREATE INDEX IF NOT EXISTS idx_site_notices_status ON public.site_notices(status);
CREATE INDEX IF NOT EXISTS idx_site_notices_created_at ON public.site_notices(created_at);

-- Enable RLS
ALTER TABLE public.site_notices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view site notices" ON public.site_notices;
CREATE POLICY "Users can view site notices" 
ON public.site_notices FOR SELECT 
USING (
  status != 'archived' AND 
  (expires_at IS NULL OR expires_at > now())
);

DROP POLICY IF EXISTS "Managers can create notices" ON public.site_notices;
CREATE POLICY "Managers can create notices" 
ON public.site_notices FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE whalesync_postgres_id = auth.uid() 
    AND role IN ('Admin', 'Project Manager', 'Document Controller', 'Supervisor')
  )
);

DROP POLICY IF EXISTS "Managers can update notices" ON public.site_notices;
CREATE POLICY "Managers can update notices" 
ON public.site_notices FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE whalesync_postgres_id = auth.uid() 
    AND role IN ('Admin', 'Project Manager', 'Document Controller', 'Supervisor')
  )
);

-- Function to auto-archive expired DABS notices
CREATE OR REPLACE FUNCTION auto_archive_expired_dabs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.site_notices 
  SET status = 'expired'
  WHERE notice_category = 'dabs' 
    AND expires_at <= now() 
    AND status = 'active'
    AND auto_archive = true;
END;
$$;

-- Create sample DABS notices for testing
INSERT INTO public.site_notices (
  title, 
  content, 
  notice_category, 
  priority, 
  expires_at, 
  auto_archive, 
  signature_required,
  project_id,
  created_by
) VALUES 
(
  'Weekly DABS - Block D Access Restricted',
  'Access to Block D scaffolding area is restricted until further notice due to ongoing structural assessment. Use alternative routes via Block C. Emergency access only with supervisor approval.',
  'dabs',
  'high',
  now() + interval '7 days',
  true,
  true,
  (SELECT whalesync_postgres_id FROM public."Projects" LIMIT 1),
  (SELECT whalesync_postgres_id FROM public."Users" WHERE role IN ('Project Manager', 'Admin') LIMIT 1)
),
(
  'DABS Update - New Delivery Area',
  'New delivery area established in the east compound. All material deliveries must now use Gate 3 entrance. Updated site plan available at site office.',
  'dabs',
  'normal',
  now() + interval '6 days',
  true,
  false,
  (SELECT whalesync_postgres_id FROM public."Projects" LIMIT 1),
  (SELECT whalesync_postgres_id FROM public."Users" WHERE role IN ('Project Manager', 'Admin') LIMIT 1)
);