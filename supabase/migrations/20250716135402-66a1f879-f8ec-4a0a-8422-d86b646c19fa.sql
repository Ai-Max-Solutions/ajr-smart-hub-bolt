-- Phase 1: Fix Critical Database Functions - Replace whalesync_postgres_id with id

-- Fix complete_user_profile function
CREATE OR REPLACE FUNCTION public.complete_user_profile(p_first_name text DEFAULT NULL::text, p_last_name text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id uuid;
    user_record record;
    is_admin boolean := false;
BEGIN
    -- Determine which user to update
    IF p_user_id IS NOT NULL THEN
        -- Check if current user is admin
        SELECT EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Document Controller', 'Project Manager')
        ) INTO is_admin;
        
        IF NOT is_admin THEN
            RAISE EXCEPTION 'Only admins can update other users';
        END IF;
        
        target_user_id := p_user_id;
    ELSE
        -- Update current user
        SELECT id INTO target_user_id
        FROM public."Users"
        WHERE supabase_auth_id = auth.uid();
    END IF;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Update the user's name fields
    UPDATE public."Users"
    SET 
        firstname = COALESCE(p_first_name, firstname),
        lastname = COALESCE(p_last_name, lastname),
        fullname = CASE 
            WHEN p_first_name IS NOT NULL OR p_last_name IS NOT NULL
            THEN TRIM(COALESCE(p_first_name, firstname, '') || ' ' || COALESCE(p_last_name, lastname, ''))
            ELSE fullname
        END,
        internalnotes = COALESCE(internalnotes, '') || E'\n' || 
            'Names updated on ' || now()::date || 
            CASE WHEN p_user_id IS NOT NULL THEN ' by admin' ELSE ' by user' END
    WHERE id = target_user_id
    RETURNING * INTO user_record;
    
    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', user_record.id,
            'email', user_record.email,
            'first_name', user_record.firstname,
            'last_name', user_record.lastname,
            'full_name', user_record.fullname,
            'role', user_record.role
        )
    );
END;
$$;

-- Fix get_user_profile function
CREATE OR REPLACE FUNCTION public.get_user_profile(p_auth_id uuid)
RETURNS TABLE(user_id uuid, full_name text, email text, role text, current_project_id uuid, current_project_name text, permissions jsonb)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.fullname,
        u.email,
        u.role,
        u.currentproject,
        p.projectname,
        jsonb_build_object(
            'can_approve_timesheets', u.role IN ('Manager', 'Admin', 'Director', 'PM'),
            'can_manage_users', u.role IN ('Admin', 'Director'),
            'can_view_all_projects', u.role IN ('Manager', 'Admin', 'Director', 'PM'),
            'is_elevated', user_has_elevated_permissions(u.id)
        ) as permissions
    FROM "Users" u
    LEFT JOIN "Projects" p ON u.currentproject = p.id
    WHERE u.supabase_auth_id = p_auth_id
    OR u.id = p_auth_id;
END;
$$;

-- Fix user_has_elevated_permissions function
CREATE OR REPLACE FUNCTION public.user_has_elevated_permissions(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
    user_role TEXT;
    is_elevated BOOLEAN;
BEGIN
    -- Cache the result in a temporary table for the transaction
    SELECT role INTO user_role
    FROM "Users"
    WHERE id = user_uuid;
    
    is_elevated := user_role IN ('Manager', 'Admin', 'Director', 'Supervisor', 'PM');
    
    RETURN COALESCE(is_elevated, FALSE);
END;
$$;

-- Fix get_app_init_data function
CREATE OR REPLACE FUNCTION public.get_app_init_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_data jsonb;
    pending_actions_count int DEFAULT 0;
    user_role text;
    user_deactivation date;
    days_until_deactivation integer;
BEGIN
    -- Get user profile with deactivation info
    SELECT jsonb_build_object(
        'user_id', id,
        'email', email,
        'full_name', fullname,
        'first_name', firstname,
        'last_name', lastname,
        'role', role,
        'current_project', currentproject,
        'employment_status', employmentstatus,
        'skills', skills,
        'deactivation_date', deactivation_date,
        'days_until_deactivation', CASE 
            WHEN deactivation_date IS NOT NULL 
            THEN (deactivation_date - CURRENT_DATE)::integer 
            ELSE NULL 
        END,
        'is_temporary', CASE 
            WHEN deactivation_date IS NOT NULL THEN true 
            ELSE false 
        END
    ) INTO user_data
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    -- Get user role and deactivation for conditional data
    SELECT role, deactivation_date, 
           (deactivation_date - CURRENT_DATE)::integer 
    INTO user_role, user_deactivation, days_until_deactivation
    FROM public."Users" 
    WHERE supabase_auth_id = auth.uid();
    
    -- Count pending actions if admin
    IF user_role IN ('Admin', 'Document Controller', 'Project Manager') THEN
        SELECT COUNT(*) INTO pending_actions_count
        FROM (
            SELECT id FROM public.role_requests WHERE status = 'pending'
            UNION ALL
            SELECT id FROM public."Users" 
            WHERE role = 'Operative' 
            AND airtable_created_time > now() - interval '24 hours'
            UNION ALL
            -- Add expiring users count
            SELECT id FROM public."Users"
            WHERE deactivation_date IS NOT NULL
            AND employmentstatus = 'Active'
            AND deactivation_date <= CURRENT_DATE + 7
        ) pending;
    END IF;
    
    -- Return comprehensive init data
    RETURN jsonb_build_object(
        'user', user_data,
        'is_admin', user_role IN ('Admin', 'Document Controller', 'Project Manager'),
        'is_supervisor', user_role IN ('Supervisor', 'Foreman'),
        'is_staff', user_role = 'Staff',
        'is_temporary', user_deactivation IS NOT NULL,
        'pending_actions_count', pending_actions_count,
        'can_approve_requests', user_role IN ('Admin', 'Document Controller'),
        'can_send_invitations', user_role IN ('Admin', 'Document Controller', 'Project Manager'),
        'account_warning', CASE 
            WHEN days_until_deactivation <= 7 AND days_until_deactivation > 0 
            THEN 'Your account expires in ' || days_until_deactivation || ' days'
            ELSE NULL
        END
    );
END;
$$;

-- Fix send_role_invitation function
CREATE OR REPLACE FUNCTION public.send_role_invitation(p_email text, p_role text, p_project_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_id uuid;
    current_user_id uuid;
BEGIN
    -- Get current user's ID
    SELECT id INTO current_user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid()
    AND role IN ('Admin', 'Project Manager', 'Document Controller');
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can send invitations';
    END IF;
    
    -- Create or update invitation
    INSERT INTO public.role_invitations (
        email, 
        invited_role, 
        invited_by, 
        project_id,
        expires_at
    )
    VALUES (
        p_email, 
        p_role, 
        current_user_id, 
        p_project_id,
        now() + interval '7 days'
    )
    ON CONFLICT (email) 
    DO UPDATE SET
        invited_role = EXCLUDED.invited_role,
        invited_by = EXCLUDED.invited_by,
        project_id = EXCLUDED.project_id,
        expires_at = EXCLUDED.expires_at,
        used = false
    RETURNING id INTO invitation_id;
    
    RETURN invitation_id;
END;
$$;

-- Fix request_role_upgrade function
CREATE OR REPLACE FUNCTION public.request_role_upgrade(p_requested_role text, p_justification text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_id uuid;
    user_id uuid;
BEGIN
    -- Get current user's ID
    SELECT id INTO user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    
    -- Create role request
    INSERT INTO public.role_requests (
        user_id,
        requested_role,
        justification
    )
    VALUES (
        user_id,
        p_requested_role,
        p_justification
    )
    RETURNING id INTO request_id;
    
    -- Notify admins
    INSERT INTO public.notifications (
        recipient_id,
        type,
        title,
        message,
        priority,
        metadata
    )
    SELECT 
        id,
        'role_request',
        'New Role Request',
        'User requested upgrade to ' || p_requested_role,
        'medium',
        jsonb_build_object('request_id', request_id)
    FROM public."Users"
    WHERE role IN ('Admin', 'Document Controller')
    LIMIT 3;
    
    RETURN request_id;
END;
$$;

-- Fix approve_role_request function
CREATE OR REPLACE FUNCTION public.approve_role_request(p_request_id uuid, p_notes text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_requested_role text;
    v_approver_id uuid;
BEGIN
    -- Get approver ID
    SELECT id INTO v_approver_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid()
    AND role IN ('Admin', 'Document Controller');
    
    IF v_approver_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    -- Get request details
    SELECT user_id, requested_role INTO v_user_id, v_requested_role
    FROM public.role_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update user role
    UPDATE public."Users"
    SET role = v_requested_role,
        internalnotes = COALESCE(internalnotes || E'\n', '') || 
                       'Role upgraded to ' || v_requested_role || ' on ' || 
                       now()::date || COALESCE(' - ' || p_notes, '')
    WHERE id = v_user_id;
    
    -- Update request status
    UPDATE public.role_requests
    SET status = 'approved',
        reviewed_by = v_approver_id,
        reviewed_at = now()
    WHERE id = p_request_id;
    
    RETURN true;
END;
$$;

-- Fix get_admin_pending_actions function
CREATE OR REPLACE FUNCTION public.get_admin_pending_actions()
RETURNS TABLE(action_type text, action_id uuid, user_name text, user_email text, details text, created_at timestamp with time zone, priority text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    RETURN QUERY
    -- Pending role requests
    SELECT 
        'role_request'::text,
        rr.id,
        u.fullname,
        u.email,
        'Requesting ' || rr.requested_role || ': ' || COALESCE(rr.justification, 'No justification provided'),
        rr.created_at,
        'medium'::text
    FROM public.role_requests rr
    JOIN public."Users" u ON u.id = rr.user_id
    WHERE rr.status = 'pending'
    
    UNION ALL
    
    -- New users needing review (joined in last 24 hours as Operative)
    SELECT 
        'new_user_review'::text,
        u.id,
        u.fullname,
        u.email,
        'New ' || u.role || ' - Review if role upgrade needed',
        u.airtable_created_time,
        'low'::text
    FROM public."Users" u
    WHERE u.role = 'Operative'
    AND u.airtable_created_time > now() - interval '24 hours'
    
    ORDER BY priority DESC, created_at DESC;
END;
$$;

-- Fix get_users_missing_names function
CREATE OR REPLACE FUNCTION public.get_users_missing_names()
RETURNS TABLE(user_id uuid, email text, role text, created_date date, days_since_creation integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM public."Users"
        WHERE supabase_auth_id = auth.uid()
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    RETURN QUERY
    SELECT 
        id,
        u.email,
        u.role,
        u.airtable_created_time,
        (CURRENT_DATE - u.airtable_created_time)::integer
    FROM public."Users" u
    WHERE (u.firstname IS NULL OR u.firstname = '' 
           OR u.lastname IS NULL OR u.lastname = '')
    AND u.employmentstatus = 'Active'
    ORDER BY u.airtable_created_time DESC;
END;
$$;

-- Fix reactivate_user function
CREATE OR REPLACE FUNCTION public.reactivate_user(p_user_id uuid, p_extension_days integer DEFAULT 45, p_notes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_user record;
    admin_id uuid;
BEGIN
    -- Check admin permissions
    SELECT id INTO admin_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid()
    AND role IN ('Admin', 'Project Manager', 'Document Controller');
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can reactivate users';
    END IF;
    
    -- Reactivate user
    UPDATE public."Users"
    SET employmentstatus = 'Active',
        deactivation_date = CASE 
            WHEN deactivation_date IS NOT NULL 
            THEN CURRENT_DATE + p_extension_days 
            ELSE NULL 
        END,
        deactivation_warning_sent = false,
        reactivated_count = reactivated_count + 1,
        last_reactivation_date = now(),
        internalnotes = COALESCE(internalnotes || E'\n', '') || 
                       'Reactivated by ' || admin_id::text || ' on ' || CURRENT_DATE ||
                       COALESCE(' - ' || p_notes, '')
    WHERE id = p_user_id
    RETURNING * INTO updated_user;
    
    IF updated_user IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', updated_user.id,
        'new_deactivation_date', updated_user.deactivation_date,
        'reactivation_count', updated_user.reactivated_count
    );
END;
$$;