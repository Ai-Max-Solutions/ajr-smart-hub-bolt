
-- Drop and recreate the user_view with proper column names
DROP VIEW IF EXISTS public.user_view;

CREATE VIEW public.user_view AS
SELECT 
    u.supabase_auth_id as auth_id,
    au.email as auth_email,
    u.firstname,
    u.lastname,
    u.fullname,
    u.role,
    u.system_role,
    u.employmentstatus,
    u.currentproject,
    u.skills,
    u.phone,
    u.primaryskill,
    u.avatar_url,
    u.last_sign_in,
    u.performance_rating,
    u.deactivation_date,
    u.onboarding_completed
FROM public."Users" u
LEFT JOIN auth.users au ON u.supabase_auth_id = au.id
WHERE u.employmentstatus = 'Active';

-- Grant access to the view
GRANT SELECT ON public.user_view TO authenticated;
GRANT SELECT ON public.user_view TO anon;
