-- Fix work type mapping by updating existing RAMS documents to use frontend work type IDs
UPDATE public.rams_documents 
SET work_types = ARRAY['testing-commissioning', 'electrical-maintenance'] 
WHERE id = '22bb89a9-1f20-451f-965d-8fef12d98de0';

UPDATE public.rams_documents 
SET work_types = ARRAY['electrical-installation', 'general-labour'] 
WHERE id = '77e4401d-3ce5-4689-a2f8-35206be461f9';

UPDATE public.rams_documents 
SET work_types = ARRAY['sprinkler-fire', 'testing-commissioning'] 
WHERE id = '3414ed2f-bf7f-4abd-b28d-11d54956b2f1';