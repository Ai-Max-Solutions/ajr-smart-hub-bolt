-- Phase 3 continued: CSCS Data Propagation and Project Assignment Fixes

-- Create CSCS upload propagation trigger
CREATE OR REPLACE FUNCTION public.sync_cscs_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- When CSCS card is uploaded/updated, sync to Users table
    IF TG_TABLE_NAME = 'cscs_cards' THEN
        UPDATE public."Users" 
        SET 
            cscscardnumber = NEW.card_number,
            cscsexpirydate = NEW.expiry_date,
            cscs_uploaded_at = NEW.created_at,
            cscs_validation_status = CASE 
                WHEN NEW.validation_status IS NOT NULL THEN NEW.validation_status
                ELSE cscs_validation_status
            END
        WHERE supabase_auth_id = NEW.user_id;
    END IF;
    
    -- When CSCS analysis is completed, update validation status
    IF TG_TABLE_NAME = 'cscs_card_analysis' THEN
        UPDATE public."Users" 
        SET 
            cscs_validation_status = CASE 
                WHEN NEW.confidence_score >= 0.8 THEN 'validated'
                WHEN NEW.confidence_score >= 0.6 THEN 'pending_review'
                ELSE 'invalid'
            END,
            cscs_last_validated = NOW()
        WHERE supabase_auth_id = NEW.user_id;
        
        -- Also update qualifications table if entry exists
        UPDATE public.qualifications 
        SET 
            verification_status = CASE 
                WHEN NEW.confidence_score >= 0.8 THEN 'verified'
                WHEN NEW.confidence_score >= 0.6 THEN 'pending'
                ELSE 'rejected'
            END,
            updated_at = NOW()
        WHERE user_id = (SELECT id FROM public."Users" WHERE supabase_auth_id = NEW.user_id)
        AND qualification_type ILIKE '%CSCS%';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create triggers for CSCS data sync
DO $$
BEGIN
    -- CSCS Cards trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cscs_cards' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS sync_cscs_cards_to_users ON public.cscs_cards;
        CREATE TRIGGER sync_cscs_cards_to_users
            AFTER INSERT OR UPDATE ON public.cscs_cards
            FOR EACH ROW EXECUTE PROCEDURE public.sync_cscs_data();
    END IF;
    
    -- CSCS Analysis trigger
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cscs_card_analysis' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS sync_cscs_analysis_to_users ON public.cscs_card_analysis;
        CREATE TRIGGER sync_cscs_analysis_to_users
            AFTER INSERT OR UPDATE ON public.cscs_card_analysis
            FOR EACH ROW EXECUTE PROCEDURE public.sync_cscs_data();
    END IF;
END $$;

-- Create project assignment bi-directional sync function
CREATE OR REPLACE FUNCTION public.sync_project_assignments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- When Users.currentproject is updated, create/update project_team entry
    IF TG_TABLE_NAME = 'Users' AND TG_OP = 'UPDATE' AND OLD.currentproject IS DISTINCT FROM NEW.currentproject THEN
        -- Remove from old project team if exists
        IF OLD.currentproject IS NOT NULL THEN
            DELETE FROM public.project_team 
            WHERE user_id = NEW.id AND project_id = OLD.currentproject;
        END IF;
        
        -- Add to new project team if not null
        IF NEW.currentproject IS NOT NULL THEN
            INSERT INTO public.project_team (project_id, user_id, assigned_date, role)
            VALUES (NEW.currentproject, NEW.id, NOW(), NEW.role)
            ON CONFLICT (project_id, user_id) 
            DO UPDATE SET 
                role = EXCLUDED.role,
                assigned_date = EXCLUDED.assigned_date;
        END IF;
    END IF;
    
    -- When project_team is updated, sync to Users.currentproject
    IF TG_TABLE_NAME = 'project_team' THEN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            UPDATE public."Users" 
            SET currentproject = NEW.project_id
            WHERE id = NEW.user_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE public."Users" 
            SET currentproject = NULL
            WHERE id = OLD.user_id AND currentproject = OLD.project_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for project assignment sync
DO $$
BEGIN
    -- Users table trigger
    DROP TRIGGER IF EXISTS sync_user_project_to_team ON public."Users";
    CREATE TRIGGER sync_user_project_to_team
        AFTER UPDATE ON public."Users"
        FOR EACH ROW EXECUTE PROCEDURE public.sync_project_assignments();
    
    -- Project team trigger (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_team' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS sync_team_to_user_project ON public.project_team;
        CREATE TRIGGER sync_team_to_user_project
            AFTER INSERT OR UPDATE OR DELETE ON public.project_team
            FOR EACH ROW EXECUTE PROCEDURE public.sync_project_assignments();
    END IF;
END $$;

-- Create work tracking completion sync function
CREATE OR REPLACE FUNCTION public.update_user_plot_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Update user's total completed plots when work is tracked
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public."Users" 
        SET 
            total_plots_completed = (
                SELECT COUNT(DISTINCT plot_id) 
                FROM public."Work_Tracking_History" 
                WHERE user_id = NEW.user_id
            ),
            performance_rating = LEAST(5.0, 
                1.0 + (
                    SELECT COUNT(DISTINCT plot_id) * 0.1 
                    FROM public."Work_Tracking_History" 
                    WHERE user_id = NEW.user_id
                )
            )
        WHERE id = NEW.user_id;
        
        -- Update plot completion percentage
        UPDATE public."Plots" 
        SET completion_percentage = LEAST(100, 
            (SELECT COUNT(*) * 20 FROM public."Work_Tracking_History" WHERE plot_id = NEW.plot_id)
        )
        WHERE id = NEW.plot_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for work tracking completion
DROP TRIGGER IF EXISTS update_completion_stats ON public."Work_Tracking_History";
CREATE TRIGGER update_completion_stats
    AFTER INSERT OR UPDATE ON public."Work_Tracking_History"
    FOR EACH ROW EXECUTE PROCEDURE public.update_user_plot_completion();

-- Create comprehensive health check function
CREATE OR REPLACE FUNCTION public.health_check_data_integrity()
RETURNS TABLE(
    check_name text,
    status text,
    issue_count bigint,
    details text,
    fix_sql text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Auth-Profile sync check
    RETURN QUERY
    SELECT 
        'auth_profile_sync'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        COUNT(*)::bigint,
        'Auth users without corresponding profiles'::text,
        'INSERT INTO public.profiles (id, system_role, created_at) SELECT id, ''Worker'', now() FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles);'::text
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL;
    
    -- Profile-Users sync check
    RETURN QUERY
    SELECT 
        'profile_users_sync'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        COUNT(*)::bigint,
        'Profiles without corresponding Users entries'::text,
        'Fix requires manual intervention - review orphaned profiles'::text
    FROM public.profiles p
    LEFT JOIN public."Users" u ON u.supabase_auth_id = p.id
    WHERE u.supabase_auth_id IS NULL;
    
    -- Email consistency check
    RETURN QUERY
    SELECT 
        'email_consistency'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END::text,
        COUNT(*)::bigint,
        'Email mismatches between auth.users and Users table'::text,
        'UPDATE public."Users" SET email = au.email FROM auth.users au WHERE "Users".supabase_auth_id = au.id AND "Users".email != au.email;'::text
    FROM auth.users au
    JOIN public."Users" u ON u.supabase_auth_id = au.id
    WHERE au.email != u.email;
    
    -- Orphaned foreign keys check
    RETURN QUERY
    SELECT 
        'orphaned_plot_assignments'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        COUNT(*)::bigint,
        'Plot assignments with invalid user references'::text,
        'DELETE FROM public."Plot_Assignments" WHERE user_id NOT IN (SELECT id FROM auth.users);'::text
    FROM public."Plot_Assignments" pa
    LEFT JOIN auth.users au ON au.id = pa.user_id
    WHERE au.id IS NULL;
    
    -- Project consistency check
    RETURN QUERY
    SELECT 
        'project_assignments'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END::text,
        COUNT(*)::bigint,
        'Users assigned to non-existent projects'::text,
        'UPDATE public."Users" SET currentproject = NULL WHERE currentproject NOT IN (SELECT id FROM public."Projects");'::text
    FROM public."Users" u
    LEFT JOIN public."Projects" p ON p.id = u.currentproject
    WHERE u.currentproject IS NOT NULL AND p.id IS NULL;
    
END;
$$;