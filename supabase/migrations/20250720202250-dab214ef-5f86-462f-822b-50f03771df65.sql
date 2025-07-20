-- Seed sample work assignments and logs for demonstration
-- First, insert some work categories if they don't exist
INSERT INTO public.work_categories (main_category, sub_task, sequence_order) VALUES
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
ON CONFLICT (main_category, sub_task) DO NOTHING;

-- Create sample work assignments for the first 3 plots in any existing project
INSERT INTO public.unit_work_assignments (
  plot_id, 
  work_category_id, 
  assigned_user_id, 
  status, 
  estimated_hours,
  due_date,
  created_by
)
SELECT 
  p.id as plot_id,
  wc.id as work_category_id,
  u.id as assigned_user_id,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY wc.sequence_order) <= 2 THEN 'completed'::work_assignment_status
    WHEN ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY wc.sequence_order) <= 4 THEN 'in_progress'::work_assignment_status
    ELSE 'assigned'::work_assignment_status
  END as status,
  (RANDOM() * 8 + 2)::numeric as estimated_hours,
  CURRENT_DATE + INTERVAL '7 days' as due_date,
  u.id as created_by
FROM (
  SELECT DISTINCT p.* 
  FROM public.plots p 
  LIMIT 3
) p
CROSS JOIN public.work_categories wc
JOIN (
  SELECT * FROM public.users 
  WHERE role IN ('Operative', 'Supervisor') 
  AND employmentstatus = 'Active'
  ORDER BY RANDOM()
  LIMIT 1
) u ON true
WHERE NOT EXISTS (
  SELECT 1 FROM public.unit_work_assignments uwa 
  WHERE uwa.plot_id = p.id AND uwa.work_category_id = wc.id
)
LIMIT 30;

-- Create some completed work logs for the completed assignments
INSERT INTO public.unit_work_logs (
  plot_id,
  work_category_id,
  user_id,
  assignment_id,
  hours,
  status,
  started_at,
  completed_at,
  notes
)
SELECT 
  uwa.plot_id,
  uwa.work_category_id,
  uwa.assigned_user_id,
  uwa.id,
  (uwa.estimated_hours * (0.8 + RANDOM() * 0.4))::numeric as hours,
  'completed'::work_log_status,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day',
  'Sample completed work log'
FROM public.unit_work_assignments uwa
WHERE uwa.status = 'completed'
AND NOT EXISTS (
  SELECT 1 FROM public.unit_work_logs uwl 
  WHERE uwl.assignment_id = uwa.id
);

-- Create some user job rates for bonus calculations
INSERT INTO public.user_job_rates (
  user_id,
  role,
  hourly_rate,
  bonus_rate,
  effective_from
)
SELECT 
  u.id,
  u.role::user_role_enum,
  CASE 
    WHEN u.role = 'Supervisor' THEN 25.0
    WHEN u.role = 'Operative' THEN 18.0
    ELSE 15.0
  END as hourly_rate,
  CASE 
    WHEN u.role = 'Supervisor' THEN 12.0
    WHEN u.role = 'Operative' THEN 9.0
    ELSE 7.0
  END as bonus_rate,
  CURRENT_DATE
FROM public.users u
WHERE u.role IN ('Operative', 'Supervisor')
AND NOT EXISTS (
  SELECT 1 FROM public.user_job_rates ujr 
  WHERE ujr.user_id = u.id
);