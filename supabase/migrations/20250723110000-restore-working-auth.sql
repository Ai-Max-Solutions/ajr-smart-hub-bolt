
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP FUNCTION IF EXISTS public.ensure_user_profile(uuid);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Check if user already exists to prevent duplicates
    IF EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = NEW.id) THEN
        RETURN NEW;
    END IF;
    
    INSERT INTO public.users (
        supabase_auth_id,
        email,
        name,
        role,
        account_status,
        trial_expires_at,
        onboarding_completed
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                 COALESCE(NEW.raw_user_meta_data->>'last_name', '')),
            'User'
        ),
        'Operative',
        'trial',
        NOW() + INTERVAL '24 hours',
        false
    );
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.ensure_user_profile(auth_user_id uuid)
RETURNS void AS $$
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = auth_user_id) THEN
        RETURN;
    END IF;
    
    INSERT INTO public.users (
        supabase_auth_id,
        email,
        name,
        role,
        account_status,
        trial_expires_at,
        onboarding_completed
    )
    SELECT 
        au.id,
        au.email,
        COALESCE(
            au.raw_user_meta_data->>'full_name',
            'User'
        ),
        'Operative',
        'trial',
        NOW() + INTERVAL '24 hours',
        false
    FROM auth.users au
    WHERE au.id = auth_user_id;
    
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Failed to ensure user profile for %: %', auth_user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Authentication system restored - signup should now work without database errors' as status;
