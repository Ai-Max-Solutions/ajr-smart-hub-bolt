-- Add enhanced fields to pod_register table for dual POD workflows
ALTER TABLE public.pod_register 
ADD COLUMN pod_category text CHECK (pod_category IN ('DELIVERY', 'HIRE_RETURN')),
ADD COLUMN plot_location text,
ADD COLUMN order_reference text,
ADD COLUMN hire_item_id uuid,
ADD COLUMN quantity_expected numeric,
ADD COLUMN quantity_received numeric,
ADD COLUMN condition_on_arrival text CHECK (condition_on_arrival IN ('good', 'damaged', 'incomplete')) DEFAULT 'good',
ADD COLUMN discrepancy_value numeric DEFAULT 0,
ADD COLUMN supplier_contact text,
ADD COLUMN delivery_method text;

-- Update existing records to have a category based on pod_type
UPDATE public.pod_register 
SET pod_category = CASE 
  WHEN pod_type IN ('material_delivery', 'site_delivery', 'welfare_delivery', 'tool_delivery') THEN 'DELIVERY'
  WHEN pod_type IN ('collection', 'off_hire', 'equipment_return') THEN 'HIRE_RETURN'
  ELSE 'DELIVERY'
END;

-- Make pod_category required after updating existing records
ALTER TABLE public.pod_register ALTER COLUMN pod_category SET NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_pod_register_category ON public.pod_register(pod_category);
CREATE INDEX idx_pod_register_hire_item ON public.pod_register(hire_item_id) WHERE hire_item_id IS NOT NULL;

-- Update the pod summary function to include category breakdown
CREATE OR REPLACE FUNCTION public.get_pod_summary(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_pods', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'flagged', COUNT(*) FILTER (WHERE status = 'flagged'),
        'delivery_pods', COUNT(*) FILTER (WHERE pod_category = 'DELIVERY'),
        'hire_pods', COUNT(*) FILTER (WHERE pod_category = 'HIRE_RETURN'),
        'discrepancy_value', COALESCE(SUM(discrepancy_value) FILTER (WHERE discrepancy_value > 0), 0),
        'recent_pods', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'pod_type', pod_type,
                    'pod_category', pod_category,
                    'supplier_name', supplier_name,
                    'description', description,
                    'status', status,
                    'plot_location', plot_location,
                    'quantity_expected', quantity_expected,
                    'quantity_received', quantity_received,
                    'condition_on_arrival', condition_on_arrival,
                    'discrepancy_value', discrepancy_value,
                    'created_at', created_at
                ) ORDER BY created_at DESC
            ) FROM (
                SELECT * FROM public.pod_register 
                WHERE project_id = p_project_id 
                ORDER BY created_at DESC 
                LIMIT 5
            ) recent
        )
    ) INTO result
    FROM public.pod_register
    WHERE project_id = p_project_id;
    
    RETURN COALESCE(result, '{"total_pods": 0, "pending": 0, "approved": 0, "flagged": 0, "delivery_pods": 0, "hire_pods": 0, "discrepancy_value": 0, "recent_pods": []}'::jsonb);
END;
$function$;