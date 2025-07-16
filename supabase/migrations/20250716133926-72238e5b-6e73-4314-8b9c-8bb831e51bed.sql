-- Fix the trigger function to use 'id' instead of 'whalesync_postgres_id'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Insert into profiles table when new user signs up
    INSERT INTO public.profiles (id, system_role, created_at)
    VALUES (NEW.id, 'Worker', now())
    ON CONFLICT (id) DO NOTHING;
    
    -- Check if user already exists by supabase_auth_id first
    IF EXISTS (SELECT 1 FROM public."Users" WHERE supabase_auth_id = NEW.id) THEN
        -- Update existing user
        UPDATE public."Users" 
        SET 
            last_sign_in = NOW(),
            email = NEW.email,
            firstname = COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', firstname),
            lastname = COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', lastname),
            fullname = COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name', 
                       TRIM(COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                            COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', '')),
                       fullname)
        WHERE supabase_auth_id = NEW.id;
    ELSE
        -- Insert new user into Users table (using correct column name 'id')
        INSERT INTO public."Users" (
            id,
            supabase_auth_id,
            email,
            firstname,
            lastname,
            fullname,
            role,
            system_role,
            employmentstatus,
            auth_provider,
            last_sign_in,
            airtable_created_time
        )
        VALUES (
            gen_random_uuid(),
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name', 
                     TRIM(COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                          COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name', '')),
                     split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'role', 'Operative'),
            COALESCE(NEW.raw_user_meta_data->>'system_role', 'Worker'),
            'Active',
            'supabase',
            NOW(),
            CURRENT_DATE
        );
    END IF;
    
    RETURN NEW;
END;
$$;