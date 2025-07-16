-- Fix user_view to use new column names
DROP VIEW IF EXISTS public.user_view;

CREATE VIEW public.user_view AS
SELECT 
  u.supabase_auth_id as auth_id,
  u.id,
  u.firstname,
  u.lastname,
  u.fullname,
  u.email,
  u.role,
  u.system_role,
  u.employmentstatus,
  u.currentproject,
  u.skills,
  u.phone,
  u.address,
  u.avatar_url,
  u.last_sign_in,
  u.deactivation_date,
  u.cscs_validation_status,
  u.cscs_upload_required,
  u.onboarding_completed,
  u.airtable_created_time as created_at
FROM public."Users" u
WHERE u.supabase_auth_id IS NOT NULL;