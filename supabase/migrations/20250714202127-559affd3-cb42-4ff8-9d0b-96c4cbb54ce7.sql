-- Fix the migration to work with existing schema
-- First update existing records to have proper notice_type values
UPDATE public.site_notices 
SET notice_type = 'General'
WHERE notice_type IS NULL;

-- Add DABS functionality to site_notices table
ALTER TABLE public.site_notices 
ADD COLUMN IF NOT EXISTS notice_category text DEFAULT 'general' CHECK (notice_category IN ('general', 'dabs', 'safety_alert', 'toolbox_talk')),
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS auto_archive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'read', 'signed', 'archived', 'expired')),
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Update priority column to use our values
ALTER TABLE public.site_notices ALTER COLUMN priority DROP DEFAULT;
ALTER TABLE public.site_notices DROP CONSTRAINT IF EXISTS site_notices_priority_check;
ALTER TABLE public.site_notices ADD CONSTRAINT site_notices_priority_check CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'));
ALTER TABLE public.site_notices ALTER COLUMN priority SET DEFAULT 'Medium';

-- Map existing notice_type to notice_category
UPDATE public.site_notices 
SET notice_category = CASE 
  WHEN notice_type ILIKE '%safety%' OR notice_type ILIKE '%alert%' THEN 'safety_alert'
  WHEN notice_type ILIKE '%toolbox%' OR notice_type ILIKE '%talk%' THEN 'toolbox_talk'
  WHEN notice_type ILIKE '%dabs%' THEN 'dabs'
  ELSE 'general'
END;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_notices_category ON public.site_notices(notice_category);
CREATE INDEX IF NOT EXISTS idx_site_notices_expires_at ON public.site_notices(expires_at);
CREATE INDEX IF NOT EXISTS idx_site_notices_status ON public.site_notices(status);

-- Enable RLS if not already enabled
ALTER TABLE public.site_notices ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
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
  notice_type,
  notice_category, 
  priority, 
  expires_at, 
  auto_archive, 
  requires_signature,
  project_id,
  created_by
) VALUES 
(
  'Weekly DABS - Block D Access Restricted',
  'Access to Block D scaffolding area is restricted until further notice due to ongoing structural assessment. Use alternative routes via Block C. Emergency access only with supervisor approval.',
  'DABS Weekly Update',
  'dabs',
  'High',
  now() + interval '7 days',
  true,
  true,
  (SELECT whalesync_postgres_id FROM public."Projects" LIMIT 1),
  (SELECT whalesync_postgres_id FROM public."Users" WHERE role IN ('Project Manager', 'Admin') LIMIT 1)
),
(
  'DABS Update - New Delivery Area',
  'New delivery area established in the east compound. All material deliveries must now use Gate 3 entrance. Updated site plan available at site office.',
  'DABS Weekly Update',
  'dabs',
  'Medium',
  now() + interval '6 days',
  true,
  false,
  (SELECT whalesync_postgres_id FROM public."Projects" LIMIT 1),
  (SELECT whalesync_postgres_id FROM public."Users" WHERE role IN ('Project Manager', 'Admin') LIMIT 1)
);