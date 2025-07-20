-- Create status enum for work assignments
CREATE TYPE work_assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'disputed');

-- Create work log status enum  
CREATE TYPE work_log_status AS ENUM ('pending', 'in_progress', 'completed', 'verified');

-- Create unit_work_assignments table
CREATE TABLE public.unit_work_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    plot_id UUID NOT NULL REFERENCES public.plots(id),
    work_category_id UUID NOT NULL REFERENCES public.work_categories(id),
    assigned_user_id UUID NOT NULL REFERENCES public.users(id),
    due_date DATE,
    ai_suggested BOOLEAN NOT NULL DEFAULT false,
    status work_assignment_status NOT NULL DEFAULT 'assigned',
    estimated_hours NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.users(id),
    notes TEXT
);

-- Create unit_work_logs table
CREATE TABLE public.unit_work_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.unit_work_assignments(id),
    user_id UUID NOT NULL REFERENCES public.users(id),
    plot_id UUID NOT NULL REFERENCES public.plots(id),
    work_category_id UUID NOT NULL REFERENCES public.work_categories(id),
    status work_log_status NOT NULL DEFAULT 'pending',
    hours NUMERIC NOT NULL,
    voice_transcript TEXT,
    notes TEXT,
    completion_photos TEXT[], -- URLs to uploaded photos
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add bonus_rate column to user_job_rates
ALTER TABLE public.user_job_rates 
ADD COLUMN bonus_rate NUMERIC DEFAULT 0;

-- Create plot_qr_codes table
CREATE TABLE public.plot_qr_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    plot_id UUID NOT NULL REFERENCES public.plots(id) UNIQUE,
    qr_code_data TEXT NOT NULL,
    qr_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.unit_work_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for unit_work_assignments
CREATE POLICY "Admins can manage work assignments" 
ON public.unit_work_assignments 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'PM', 'Director', 'Supervisor')
    )
);

CREATE POLICY "Users can view their assigned work" 
ON public.unit_work_assignments 
FOR SELECT 
USING (
    assigned_user_id IN (
        SELECT id FROM public.users 
        WHERE supabase_auth_id = auth.uid()
    )
);

-- RLS Policies for unit_work_logs
CREATE POLICY "Admins can view all work logs" 
ON public.unit_work_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'PM', 'Director', 'Supervisor')
    )
);

CREATE POLICY "Users can manage their own work logs" 
ON public.unit_work_logs 
FOR ALL 
USING (
    user_id IN (
        SELECT id FROM public.users 
        WHERE supabase_auth_id = auth.uid()
    )
);

-- RLS Policies for plot_qr_codes
CREATE POLICY "QR codes viewable by authenticated users" 
ON public.plot_qr_codes 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage QR codes" 
ON public.plot_qr_codes 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'PM', 'Director', 'Supervisor')
    )
);

-- Create indexes for performance
CREATE INDEX idx_unit_work_assignments_plot_id ON public.unit_work_assignments(plot_id);
CREATE INDEX idx_unit_work_assignments_user_id ON public.unit_work_assignments(assigned_user_id);
CREATE INDEX idx_unit_work_assignments_status ON public.unit_work_assignments(status);

CREATE INDEX idx_unit_work_logs_assignment_id ON public.unit_work_logs(assignment_id);
CREATE INDEX idx_unit_work_logs_user_id ON public.unit_work_logs(user_id);
CREATE INDEX idx_unit_work_logs_plot_id ON public.unit_work_logs(plot_id);

-- Create trigger to update updated_at timestamps
CREATE TRIGGER update_unit_work_assignments_updated_at
    BEFORE UPDATE ON public.unit_work_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unit_work_logs_updated_at
    BEFORE UPDATE ON public.unit_work_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plot_qr_codes_updated_at
    BEFORE UPDATE ON public.plot_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create timesheet entries from work logs
CREATE OR REPLACE FUNCTION public.create_timesheet_entry_from_work_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_rate NUMERIC;
    v_bonus_rate NUMERIC;
    v_timesheet_id UUID;
    v_week_commencing DATE;
    v_bonus_hours NUMERIC := 0;
    v_estimated_hours NUMERIC;
BEGIN
    -- Only create timesheet entry when work log is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Get the Monday of the week for the completion date
        v_week_commencing := date_trunc('week', CURRENT_DATE)::DATE;
        
        -- Get or create timesheet for this user and week
        SELECT id INTO v_timesheet_id 
        FROM public.timesheets 
        WHERE user_id = NEW.user_id 
        AND week_commencing = v_week_commencing;
        
        IF v_timesheet_id IS NULL THEN
            INSERT INTO public.timesheets (user_id, project_id, week_commencing)
            SELECT NEW.user_id, p.project_id, v_week_commencing
            FROM public.plots p 
            WHERE p.id = NEW.plot_id
            RETURNING id INTO v_timesheet_id;
        END IF;
        
        -- Get user's hourly rate and bonus rate
        SELECT hourly_rate, COALESCE(bonus_rate, 0) 
        INTO v_user_rate, v_bonus_rate
        FROM public.user_job_rates 
        WHERE user_id = NEW.user_id 
        AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
        ORDER BY effective_from DESC 
        LIMIT 1;
        
        -- Get estimated hours for bonus calculation
        SELECT estimated_hours INTO v_estimated_hours
        FROM public.unit_work_assignments 
        WHERE id = NEW.assignment_id;
        
        -- Calculate bonus if completed under estimated time
        IF v_estimated_hours IS NOT NULL AND NEW.hours < v_estimated_hours THEN
            v_bonus_hours := v_estimated_hours - NEW.hours;
        END IF;
        
        -- Create timesheet entry
        INSERT INTO public.timesheet_entries (
            timesheet_id,
            plot_id,
            work_category_id,
            hours,
            notes
        ) VALUES (
            v_timesheet_id,
            NEW.plot_id,
            NEW.work_category_id,
            NEW.hours,
            COALESCE(NEW.notes, '') || 
            CASE WHEN v_bonus_hours > 0 THEN 
                ' (Bonus: ' || v_bonus_hours || ' hrs under estimate)' 
            ELSE '' END
        );
        
        -- Update assignment status to completed
        UPDATE public.unit_work_assignments 
        SET status = 'completed', updated_at = now()
        WHERE id = NEW.assignment_id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for timesheet entry creation
CREATE TRIGGER create_timesheet_entry_on_work_completion
    AFTER INSERT OR UPDATE ON public.unit_work_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.create_timesheet_entry_from_work_log();