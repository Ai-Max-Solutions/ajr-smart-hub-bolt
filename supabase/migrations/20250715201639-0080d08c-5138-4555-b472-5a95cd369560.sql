-- Fix onboarding_completed flag for users who clearly have completed onboarding
-- This addresses users stuck in redirect loops despite having valid CSCS cards and complete profiles

UPDATE public."Users" 
SET onboarding_completed = true 
WHERE onboarding_completed = false 
  AND employmentstatus = 'Active'
  AND firstname IS NOT NULL 
  AND lastname IS NOT NULL 
  AND firstname != ''
  AND lastname != ''
  AND EXISTS (
    SELECT 1 FROM public.cscs_cards cc 
    WHERE (cc.user_id = "Users".supabase_auth_id OR cc.user_id = "Users".whalesync_postgres_id)
    AND cc.status = 'valid'
    AND cc.expiry_date > CURRENT_DATE
  );