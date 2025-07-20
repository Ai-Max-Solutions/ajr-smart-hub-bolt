-- Critical Security Fix: Harden all database functions with secure search_path
-- This prevents potential privilege escalation through search_path manipulation

-- Fix generate_plot_composite_code function
CREATE OR REPLACE FUNCTION public.generate_plot_composite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    block_code TEXT;
    level_code TEXT;
BEGIN
    -- Get block and level codes
    SELECT pb.code INTO block_code 
    FROM project_blocks pb 
    WHERE pb.id = NEW.block_id;
    
    SELECT pl.code INTO level_code 
    FROM project_levels pl 
    WHERE pl.id = NEW.level_id;
    
    -- Generate composite code: BLOCK-LEVEL-PLOT (e.g., B1-GF-05)
    NEW.composite_code := COALESCE(block_code, '') || '-' || COALESCE(level_code, '') || '-' || COALESCE(NEW.code, '');
    
    RETURN NEW;
END;
$function$;

-- Fix update_plot_task_progress function
CREATE OR REPLACE FUNCTION public.update_plot_task_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Update the plot_tasks table when timesheet entries are added
    UPDATE public.plot_tasks
    SET 
        actual_hours = COALESCE(actual_hours, 0) + NEW.hours,
        status = CASE 
            WHEN status = 'Not Started' THEN 'In Progress'
            ELSE status
        END,
        updated_at = now()
    WHERE plot_id = NEW.plot_id 
    AND task_catalog_id IN (
        SELECT tc.id FROM task_catalog tc 
        JOIN work_categories wc ON wc.main_category = tc.category 
        WHERE wc.id = NEW.work_category_id
    );
    
    RETURN NEW;
END;
$function$;

-- Fix update_plot_order function
CREATE OR REPLACE FUNCTION public.update_plot_order(plot_ids uuid[], project_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  FOR i IN 1..array_length(plot_ids, 1) LOOP
    UPDATE public.plots 
    SET plot_sequence_order = i, updated_at = now()
    WHERE id = plot_ids[i] AND project_id = project_id_param;
  END LOOP;
END;
$function$;

-- Fix update_work_category_order function
CREATE OR REPLACE FUNCTION public.update_work_category_order(category_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  FOR i IN 1..array_length(category_ids, 1) LOOP
    UPDATE public.work_categories 
    SET sequence_order = i, updated_at = now()
    WHERE id = category_ids[i];
  END LOOP;
END;
$function$;

-- Fix get_project_progress function
CREATE OR REPLACE FUNCTION public.get_project_progress(project_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  total_plots INTEGER;
  handed_over_plots INTEGER;
  progress_percentage NUMERIC;
  result JSON;
BEGIN
  SELECT COUNT(*) INTO total_plots 
  FROM public.plots 
  WHERE project_id = project_id_param;
  
  SELECT COUNT(*) INTO handed_over_plots 
  FROM public.plots 
  WHERE project_id = project_id_param AND handed_over = true;
  
  IF total_plots > 0 THEN
    progress_percentage := ROUND((handed_over_plots::NUMERIC / total_plots::NUMERIC) * 100, 2);
  ELSE
    progress_percentage := 0;
  END IF;
  
  result := json_build_object(
    'total_plots', total_plots,
    'handed_over_plots', handed_over_plots,
    'progress_percentage', progress_percentage
  );
  
  RETURN result;
END;
$function$;

-- Fix detect_suspicious_activity function
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    result JSON;
BEGIN
    -- Simple suspicious activity detection
    -- This is a placeholder function that returns a basic risk assessment
    result := json_build_object(
        'risk_level', 'LOW',
        'message', 'No suspicious activity detected',
        'timestamp', now()
    );
    
    RETURN result;
END;
$function$;

-- Fix update_last_sign_in function
CREATE OR REPLACE FUNCTION public.update_last_sign_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Update last_sign_in when a user accesses their profile
    UPDATE public.users 
    SET last_sign_in = now()
    WHERE supabase_auth_id = NEW.id;
    
    RETURN NEW;
END;
$function$;

-- Fix invalidate_old_rams_signatures function
CREATE OR REPLACE FUNCTION public.invalidate_old_rams_signatures()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Mark existing signatures as not current for the same contractor and document
  UPDATE public.contractor_rams_signatures 
  SET is_current = false, updated_at = now()
  WHERE contractor_id = NEW.contractor_id 
    AND rams_document_id = NEW.rams_document_id 
    AND id != NEW.id;
  
  RETURN NEW;
END;
$function$;

-- Fix get_contractor_rams_compliance function
CREATE OR REPLACE FUNCTION public.get_contractor_rams_compliance(p_contractor_id uuid, p_project_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_required_docs INTEGER;
  v_signed_docs INTEGER;
  v_expired_docs INTEGER;
  v_compliance_percentage NUMERIC;
  v_compliance_status TEXT;
  v_result JSONB;
BEGIN
  -- Get required documents count
  SELECT COUNT(DISTINCT pr.rams_document_id)
  INTO v_required_docs
  FROM public.project_rams_requirements pr
  JOIN public.rams_documents rd ON pr.rams_document_id = rd.id
  WHERE (p_project_id IS NULL OR pr.project_id = p_project_id)
    AND pr.is_mandatory = true
    AND rd.is_active = true;

  -- Get signed documents count (current signatures)
  SELECT COUNT(DISTINCT cs.rams_document_id)
  INTO v_signed_docs
  FROM public.contractor_rams_signatures cs
  JOIN public.project_rams_requirements pr ON cs.rams_document_id = pr.rams_document_id
  WHERE cs.contractor_id = p_contractor_id
    AND (p_project_id IS NULL OR pr.project_id = p_project_id)
    AND cs.is_current = true
    AND (cs.expires_at IS NULL OR cs.expires_at > now());

  -- Get expired signatures count
  SELECT COUNT(DISTINCT cs.rams_document_id)
  INTO v_expired_docs
  FROM public.contractor_rams_signatures cs
  JOIN public.project_rams_requirements pr ON cs.rams_document_id = pr.rams_document_id
  WHERE cs.contractor_id = p_contractor_id
    AND (p_project_id IS NULL OR pr.project_id = p_project_id)
    AND cs.is_current = true
    AND cs.expires_at IS NOT NULL 
    AND cs.expires_at <= now();

  -- Calculate compliance percentage
  IF v_required_docs > 0 THEN
    v_compliance_percentage := ROUND((v_signed_docs::NUMERIC / v_required_docs::NUMERIC) * 100, 2);
  ELSE
    v_compliance_percentage := 100;
  END IF;

  -- Determine compliance status
  IF v_compliance_percentage = 100 THEN
    v_compliance_status := 'COMPLIANT';
  ELSIF v_compliance_percentage >= 80 THEN
    v_compliance_status := 'MOSTLY_COMPLIANT';
  ELSIF v_compliance_percentage >= 50 THEN
    v_compliance_status := 'PARTIALLY_COMPLIANT';
  ELSE
    v_compliance_status := 'NON_COMPLIANT';
  END IF;

  -- Build result JSON
  v_result := jsonb_build_object(
    'contractor_id', p_contractor_id,
    'project_id', p_project_id,
    'required_documents', v_required_docs,
    'signed_documents', v_signed_docs,
    'expired_signatures', v_expired_docs,
    'outstanding_documents', v_required_docs - v_signed_docs,
    'compliance_percentage', v_compliance_percentage,
    'compliance_status', v_compliance_status,
    'is_compliant', v_compliance_percentage = 100,
    'checked_at', now()
  );

  RETURN v_result;
END;
$function$;