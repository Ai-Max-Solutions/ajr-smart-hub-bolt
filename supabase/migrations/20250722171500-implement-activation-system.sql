
CREATE TYPE public.activation_status_enum AS ENUM ('provisional', 'active', 'pending', 'inactive');

ALTER TABLE public.users 
ADD COLUMN activation_status public.activation_status_enum DEFAULT 'provisional',
ADD COLUMN activation_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN signup_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now();

UPDATE public.users 
SET activation_status = CASE 
  WHEN onboarding_completed = true THEN 'active'::activation_status_enum
  ELSE 'provisional'::activation_status_enum
END,
signup_timestamp = COALESCE(created_at, now()),
activation_expiry = CASE 
  WHEN onboarding_completed = false THEN created_at + INTERVAL '24 hours'
  ELSE NULL
END
WHERE activation_status IS NULL;

CREATE INDEX idx_users_activation_status ON public.users(activation_status);
CREATE INDEX idx_users_activation_expiry ON public.users(activation_expiry) WHERE activation_expiry IS NOT NULL;


CREATE OR REPLACE FUNCTION update_expired_provisional_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users 
  SET activation_status = 'pending'::activation_status_enum
  WHERE activation_status = 'provisional'::activation_status_enum 
    AND activation_expiry IS NOT NULL 
    AND activation_expiry < now()
    AND onboarding_completed = true;
END;
$$;

CREATE OR REPLACE FUNCTION check_user_activation_on_signin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users 
    SET last_sign_in = now()
    WHERE supabase_auth_id = NEW.id;
    
    PERFORM update_expired_provisional_users();
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE PROCEDURE check_user_activation_on_signin();
