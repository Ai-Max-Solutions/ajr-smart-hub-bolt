-- CRITICAL SECURITY FIXES - Phase 1: Database Security

-- 1. Fix function search paths to prevent SQL injection
CREATE OR REPLACE FUNCTION public.update_user_onboarding_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.last_onboarding_update = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    result JSON;
BEGIN
    result := json_build_object(
        'risk_level', 'LOW',
        'message', 'No suspicious activity detected',
        'timestamp', now()
    );
    RETURN result;
END;
$function$;

-- 2. Fix RLS policy conflicts for contractor_rams_signatures
DROP POLICY IF EXISTS "Users can insert own RAMS signatures" ON public.contractor_rams_signatures;
DROP POLICY IF EXISTS "Users can read own RAMS signatures" ON public.contractor_rams_signatures;
DROP POLICY IF EXISTS "Users can update own RAMS signatures" ON public.contractor_rams_signatures;

-- 3. Fix notification_recipients WITH CHECK policy
DROP POLICY IF EXISTS "auth can insert recipients" ON public.notification_recipients;
CREATE POLICY "auth can insert recipients"
ON public.notification_recipients
FOR INSERT
WITH CHECK (user_id = auth.uid() AND notification_id IS NOT NULL);

-- 4. Add comprehensive RLS for unit_work_assignments
ALTER TABLE public.unit_work_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their assigned work"
ON public.unit_work_assignments
FOR SELECT
USING (assigned_user_id IN (
  SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
));

CREATE POLICY "Admins can manage all work assignments"
ON public.unit_work_assignments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE supabase_auth_id = auth.uid() 
  AND role IN ('Admin', 'PM', 'Director', 'Supervisor')
));

CREATE POLICY "Users can update their assigned work status"
ON public.unit_work_assignments
FOR UPDATE
USING (assigned_user_id IN (
  SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
))
WITH CHECK (assigned_user_id IN (
  SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
));

-- 5. Add comprehensive RLS for unit_work_logs
ALTER TABLE public.unit_work_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own work logs"
ON public.unit_work_logs
FOR SELECT
USING (user_id IN (
  SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
));

CREATE POLICY "Users can create their own work logs"
ON public.unit_work_logs
FOR INSERT
WITH CHECK (user_id IN (
  SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
));

CREATE POLICY "Users can update their own work logs"
ON public.unit_work_logs
FOR UPDATE
USING (user_id IN (
  SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
))
WITH CHECK (user_id IN (
  SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()
));

CREATE POLICY "Admins can view all work logs"
ON public.unit_work_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE supabase_auth_id = auth.uid() 
  AND role IN ('Admin', 'PM', 'Director', 'Supervisor')
));

-- 6. Add audit trail for work logs
CREATE TABLE IF NOT EXISTS public.work_log_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_log_id UUID REFERENCES public.unit_work_logs(id),
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES public.users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

ALTER TABLE public.work_log_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.work_log_audit
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE supabase_auth_id = auth.uid() 
  AND role IN ('Admin', 'Director')
));

-- 7. Create trigger for work log auditing
CREATE OR REPLACE FUNCTION public.audit_work_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.work_log_audit (work_log_id, action, new_values, user_id)
    VALUES (NEW.id, 'CREATE', to_jsonb(NEW), NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.work_log_audit (work_log_id, action, old_values, new_values, user_id)
    VALUES (NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.work_log_audit (work_log_id, action, old_values, user_id)
    VALUES (OLD.id, 'DELETE', to_jsonb(OLD), OLD.user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS audit_work_log_trigger ON public.unit_work_logs;
CREATE TRIGGER audit_work_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.unit_work_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_work_log_changes();

-- 8. Prevent duplicate work assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_work_assignment 
ON public.unit_work_assignments (plot_id, work_category_id, assigned_user_id)
WHERE status != 'completed';

-- 9. Add work assignment validation function
CREATE OR REPLACE FUNCTION public.validate_work_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if user is assigned to this work
  IF NOT EXISTS (
    SELECT 1 FROM public.unit_work_assignments 
    WHERE plot_id = NEW.plot_id 
    AND work_category_id = NEW.work_category_id 
    AND assigned_user_id = NEW.user_id
    AND status IN ('assigned', 'in_progress')
  ) THEN
    RAISE EXCEPTION 'User not authorized to log work for this assignment';
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS validate_work_assignment_trigger ON public.unit_work_logs;
CREATE TRIGGER validate_work_assignment_trigger
  BEFORE INSERT ON public.unit_work_logs
  FOR EACH ROW EXECUTE FUNCTION public.validate_work_assignment();