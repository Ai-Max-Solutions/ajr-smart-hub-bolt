
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Strict check: If user exists (by auth ID), do NOTHING
    IF EXISTS (SELECT 1 FROM public.users WHERE supabase_auth_id = NEW.id) THEN
        RETURN NEW;
    END IF;
    
    INSERT INTO public.users (
        supabase_auth_id,
        email,
        name,
        role,
        created_at,
        updated_at,
        is_verified
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 
            TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                 COALESCE(NEW.raw_user_meta_data->>'last_name', '')), 
            'Unknown'),
        'Operative',
        NOW(),
        NOW(),
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'handle_new_user trigger function updated successfully' as status;
