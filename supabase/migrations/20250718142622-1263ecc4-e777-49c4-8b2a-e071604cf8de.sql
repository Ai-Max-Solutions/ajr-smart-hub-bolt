
-- Create hire requests table for tracking equipment hire
CREATE TABLE public.hire_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  hire_date DATE NOT NULL,
  hire_time TIME,
  equipment_type TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'delivered', 'completed', 'cancelled')),
  hire_company_contacted BOOLEAN DEFAULT false,
  airtable_record_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operative permissions table for photo upload controls
CREATE TABLE public.operative_permissions (
  user_id UUID REFERENCES public.users(id) PRIMARY KEY,
  can_upload_pod_photo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for hire_requests
ALTER TABLE public.hire_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hire requests they created" 
  ON public.hire_requests 
  FOR SELECT 
  USING (auth.uid() IN (SELECT supabase_auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can create hire requests" 
  ON public.hire_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT supabase_auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their hire requests" 
  ON public.hire_requests 
  FOR UPDATE 
  USING (auth.uid() IN (SELECT supabase_auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Admins can view all hire requests" 
  ON public.hire_requests 
  FOR ALL 
  USING (auth.uid() IN (SELECT supabase_auth_id FROM public.users WHERE role IN ('Admin', 'Project Manager', 'Supervisor')));

-- Add RLS policies for operative_permissions
ALTER TABLE public.operative_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions" 
  ON public.operative_permissions 
  FOR SELECT 
  USING (auth.uid() IN (SELECT supabase_auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "Admins can manage all permissions" 
  ON public.operative_permissions 
  FOR ALL 
  USING (auth.uid() IN (SELECT supabase_auth_id FROM public.users WHERE role IN ('Admin', 'Project Manager')));

-- Add updated_at trigger for hire_requests
CREATE TRIGGER update_hire_requests_updated_at
  BEFORE UPDATE ON public.hire_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for operative_permissions
CREATE TRIGGER update_operative_permissions_updated_at
  BEFORE UPDATE ON public.operative_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create default permissions for existing users
INSERT INTO public.operative_permissions (user_id, can_upload_pod_photo)
SELECT id, CASE WHEN role IN ('Admin', 'Project Manager', 'Supervisor') THEN true ELSE false END
FROM public.users
ON CONFLICT (user_id) DO NOTHING;
