-- Seed sample work categories if the table is empty
INSERT INTO public.work_categories (main_category, sub_task, sequence_order)
SELECT * FROM (VALUES
  ('Electrical', '1st Fix Electrical', 1),
  ('Electrical', '2nd Fix Electrical', 2),
  ('Plumbing', '1st Fix Plumbing', 3),
  ('Plumbing', '2nd Fix Plumbing', 4),
  ('Plastering', 'First Coat', 5),
  ('Plastering', 'Skim Coat', 6),
  ('Flooring', 'Underfloor', 7),
  ('Flooring', 'Final Floor', 8),
  ('Painting', 'Primer', 9),
  ('Painting', 'Top Coat', 10)
) AS t(main_category, sub_task, sequence_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.work_categories 
  WHERE main_category = t.main_category AND sub_task = t.sub_task
);

-- Create sample work assignments for existing plots if they don't already have assignments
DO $$
DECLARE
  plot_record RECORD;
  wc_record RECORD;
  user_record RECORD;
  assignment_count INTEGER;
BEGIN
  -- Get a random active user for assignments
  SELECT id INTO user_record 
  FROM public.users 
  WHERE role IN ('Operative', 'Supervisor') 
  AND employmentstatus = 'Active'
  ORDER BY RANDOM()
  LIMIT 1;
  
  -- Only proceed if we have a user and plots
  IF user_record.id IS NOT NULL THEN
    -- For each plot, create assignments for each work category
    FOR plot_record IN 
      SELECT id FROM public.plots LIMIT 3
    LOOP
      -- Check if this plot already has assignments
      SELECT COUNT(*) INTO assignment_count
      FROM public.unit_work_assignments
      WHERE plot_id = plot_record.id;
      
      -- Only create assignments if none exist
      IF assignment_count = 0 THEN
        -- Create assignments for each work category
        FOR wc_record IN 
          SELECT id, sequence_order FROM public.work_categories ORDER BY sequence_order
        LOOP
          INSERT INTO public.unit_work_assignments (
            plot_id, 
            work_category_id, 
            assigned_user_id, 
            status, 
            estimated_hours,
            due_date,
            created_by
          ) VALUES (
            plot_record.id,
            wc_record.id,
            user_record.id,
            CASE 
              WHEN wc_record.sequence_order <= 2 THEN 'completed'::work_assignment_status
              WHEN wc_record.sequence_order <= 4 THEN 'in_progress'::work_assignment_status
              ELSE 'assigned'::work_assignment_status
            END,
            (RANDOM() * 6 + 2)::numeric, -- 2-8 hours
            CURRENT_DATE + INTERVAL '7 days',
            user_record.id
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;
END $$;