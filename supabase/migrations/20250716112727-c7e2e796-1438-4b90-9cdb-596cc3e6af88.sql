-- Fix the cleanup function with correct syntax
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_records()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    DELETE FROM public.activity_metrics 
    WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM public."Users");
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    cleanup_count := cleanup_count + temp_count;
    
    DELETE FROM public."Plot_Assignments" 
    WHERE user_id NOT IN (SELECT id FROM public."Users")
    OR plot_id NOT IN (SELECT id FROM public."Plots");
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    cleanup_count := cleanup_count + temp_count;
    
    DELETE FROM public."Work_Tracking_History" 
    WHERE user_id NOT IN (SELECT id FROM public."Users")
    OR plot_id NOT IN (SELECT id FROM public."Plots");
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    cleanup_count := cleanup_count + temp_count;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;