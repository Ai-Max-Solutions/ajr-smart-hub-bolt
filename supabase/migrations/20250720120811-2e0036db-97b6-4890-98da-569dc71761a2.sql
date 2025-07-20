
-- Add project team members table
CREATE TABLE public.project_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'Member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Add sequence_order to work_categories if not exists
ALTER TABLE public.work_categories 
ADD COLUMN IF NOT EXISTS sequence_order INTEGER DEFAULT 1;

-- Add handed_over to plots if not exists
ALTER TABLE public.plots 
ADD COLUMN IF NOT EXISTS handed_over BOOLEAN DEFAULT false;

-- Add sequence_order to plots for proper ordering
ALTER TABLE public.plots 
ADD COLUMN IF NOT EXISTS plot_sequence_order INTEGER DEFAULT 1;

-- Enable RLS on project_team_members
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_team_members
CREATE POLICY "Project team members viewable by authenticated users" 
  ON public.project_team_members 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage project team members" 
  ON public.project_team_members 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.supabase_auth_id = auth.uid() 
    AND users.role = ANY(ARRAY['Admin'::user_role_enum, 'PM'::user_role_enum, 'Director'::user_role_enum])
  ));

-- RPC function to update plot order
CREATE OR REPLACE FUNCTION public.update_plot_order(plot_ids UUID[], project_id_param UUID)
RETURNS VOID AS $$
BEGIN
  FOR i IN 1..array_length(plot_ids, 1) LOOP
    UPDATE public.plots 
    SET plot_sequence_order = i, updated_at = now()
    WHERE id = plot_ids[i] AND project_id = project_id_param;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to update work category order
CREATE OR REPLACE FUNCTION public.update_work_category_order(category_ids UUID[])
RETURNS VOID AS $$
BEGIN
  FOR i IN 1..array_length(category_ids, 1) LOOP
    UPDATE public.work_categories 
    SET sequence_order = i, updated_at = now()
    WHERE id = category_ids[i];
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to calculate project progress
CREATE OR REPLACE FUNCTION public.get_project_progress(project_id_param UUID)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON public.project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_user_id ON public.project_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_plots_project_id_sequence ON public.plots(project_id, plot_sequence_order);
CREATE INDEX IF NOT EXISTS idx_work_categories_sequence ON public.work_categories(sequence_order);
