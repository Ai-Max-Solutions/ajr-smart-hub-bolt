-- Fix the handle_new_user function to use the correct table name
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Insert into users table on signup using NEW.id as supabase_auth_id
    INSERT INTO public.users (
        supabase_auth_id,
        email,
        name,
        role
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 
            TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
                 COALESCE(NEW.raw_user_meta_data->>'last_name', ''))),
        'Operative'
    );
    RETURN NEW;
END;
$function$;