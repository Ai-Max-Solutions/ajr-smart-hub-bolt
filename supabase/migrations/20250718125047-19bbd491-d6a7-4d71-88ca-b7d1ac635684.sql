-- Force update the user role to Admin immediately
UPDATE public.users 
SET role = 'Admin'
WHERE email = 'mc@ajryan.co.uk';

-- Check if there are any triggers that might be interfering
-- Let's also make sure we drop and recreate the trigger to ensure it's using the latest function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger with the corrected function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();