-- Job Tracker System Database Schema
-- Creating comprehensive structure for Projects → Plots → Work Categories → Job Types → Job Tracker

-- Work Categories table (Fix Stages, Installations, Testing, etc.)
CREATE TABLE public.work_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id),
    is_template BOOLEAN DEFAULT false, -- for master templates
    display_order INTEGER DEFAULT 0,
    requires_rams BOOLEAN DEFAULT true,
    safety_requirements TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job Types table (1st Fix Plumbing, 2nd Fix Electrics, etc.)
CREATE TABLE public.job_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    work_category_id UUID NOT NULL REFERENCES public.work_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    estimated_duration_hours NUMERIC,
    requires_certification TEXT[], -- CSCS, IPAF, Gas Safe, etc.
    required_rams_template_id UUID, -- Link to RAMS template
    pricing_model TEXT NOT NULL CHECK (pricing_model IN ('day_rate', 'price_per_job', 'price_per_unit')),
    default_unit_price NUMERIC DEFAULT 0,
    default_unit_type TEXT, -- 'radiator', 'socket', 'meter', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(work_category_id, code)
);

-- User Job Assignments (who can do what jobs on which plots)
CREATE TABLE public.user_job_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    plot_id UUID REFERENCES public."Plots"(whalesync_postgres_id) ON DELETE CASCADE,
    job_type_id UUID NOT NULL REFERENCES public.job_types(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id),
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, project_id, plot_id, job_type_id)
);

-- User Rate Cards (pricing per user per job type)
CREATE TABLE public.user_rate_cards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    job_type_id UUID NOT NULL REFERENCES public.job_types(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    rate_type TEXT NOT NULL CHECK (rate_type IN ('day_rate', 'price_per_job', 'price_per_unit')),
    base_rate NUMERIC NOT NULL,
    unit_type TEXT, -- for price_per_unit
    overtime_multiplier NUMERIC DEFAULT 1.5,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    approved_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Plot Job Status (tracks what's been done on each plot)
CREATE TABLE public.plot_job_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES public."Plots"(whalesync_postgres_id) ON DELETE CASCADE,
    job_type_id UUID NOT NULL REFERENCES public.job_types(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'in_progress', 'pending_approval', 'approved', 'rejected', 'locked')),
    claimed_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    claimed_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    locked_at TIMESTAMP WITH TIME ZONE,
    lock_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, plot_id, job_type_id)
);

-- Main Job Tracker table
CREATE TABLE public.job_tracker (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES public."Plots"(whalesync_postgres_id) ON DELETE CASCADE,
    job_type_id UUID NOT NULL REFERENCES public.job_types(id) ON DELETE CASCADE,
    assigned_user_id UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    
    -- Work details
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME,
    end_time TIME,
    hours_worked NUMERIC,
    
    -- Quantity and pricing
    quantity_completed NUMERIC DEFAULT 1,
    unit_type TEXT,
    agreed_rate NUMERIC NOT NULL,
    rate_type TEXT NOT NULL CHECK (rate_type IN ('day_rate', 'price_per_job', 'price_per_unit')),
    calculated_total NUMERIC GENERATED ALWAYS AS (quantity_completed * agreed_rate) STORED,
    
    -- Override pricing (admin only)
    override_total NUMERIC,
    override_reason TEXT,
    override_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    override_at TIMESTAMP WITH TIME ZONE,
    
    -- Work description and evidence
    work_description TEXT NOT NULL,
    materials_used JSONB,
    issues_encountered TEXT,
    photos TEXT[], -- URLs to uploaded photos
    
    -- RAMS and compliance
    rams_signed_id UUID, -- Reference to signed RAMS document
    safety_checks_completed BOOLEAN DEFAULT false,
    
    -- Status and approval
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job Tracker Duplicates (for flagging potential duplicates)
CREATE TABLE public.job_tracker_duplicates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    original_job_id UUID NOT NULL REFERENCES public.job_tracker(id) ON DELETE CASCADE,
    duplicate_job_id UUID NOT NULL REFERENCES public.job_tracker(id) ON DELETE CASCADE,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_action TEXT, -- 'approved_both', 'merged', 'rejected_duplicate'
    notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_job_tracker_project_plot ON public.job_tracker(project_id, plot_id);
CREATE INDEX idx_job_tracker_user_date ON public.job_tracker(assigned_user_id, work_date);
CREATE INDEX idx_job_tracker_status ON public.job_tracker(status);
CREATE INDEX idx_plot_job_status_lookup ON public.plot_job_status(project_id, plot_id, job_type_id);
CREATE INDEX idx_user_job_assignments_active ON public.user_job_assignments(user_id, is_active) WHERE is_active = true;

-- Enable RLS on all tables
ALTER TABLE public.work_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_job_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tracker_duplicates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Work Categories - Project-based access
CREATE POLICY "work_categories_project_access" ON public.work_categories
    FOR ALL USING (
        project_id IS NULL OR -- Template categories
        project_id IN (
            SELECT whalesync_postgres_id FROM public."Projects" p
            WHERE EXISTS (
                SELECT 1 FROM public."Users" u 
                WHERE u.supabase_auth_id = auth.uid() 
                AND (
                    u.role IN ('Admin', 'Document Controller', 'Project Manager', 'Director') OR
                    u.currentproject = p.whalesync_postgres_id
                )
            )
        )
    );

-- Job Types - Work category based access
CREATE POLICY "job_types_access" ON public.job_types
    FOR ALL USING (
        work_category_id IN (
            SELECT id FROM public.work_categories 
            WHERE project_id IS NULL OR project_id IN (
                SELECT whalesync_postgres_id FROM public."Projects" p
                WHERE EXISTS (
                    SELECT 1 FROM public."Users" u 
                    WHERE u.supabase_auth_id = auth.uid() 
                    AND (
                        u.role IN ('Admin', 'Document Controller', 'Project Manager', 'Director') OR
                        u.currentproject = p.whalesync_postgres_id
                    )
                )
            )
        )
    );

-- User Job Assignments - Role-based access
CREATE POLICY "user_job_assignments_access" ON public.user_job_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND (
                u.role IN ('Admin', 'Document Controller', 'Project Manager', 'Director') OR
                u.whalesync_postgres_id = user_job_assignments.user_id OR
                u.currentproject = user_job_assignments.project_id
            )
        )
    );

CREATE POLICY "user_job_assignments_admin_modify" ON public.user_job_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND u.role IN ('Admin', 'Document Controller', 'Project Manager')
        )
    );

-- Job Tracker - Role and assignment based access
CREATE POLICY "job_tracker_access" ON public.job_tracker
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND (
                u.role IN ('Admin', 'Document Controller', 'Project Manager', 'Director') OR
                u.whalesync_postgres_id = job_tracker.assigned_user_id OR
                u.currentproject = job_tracker.project_id
            )
        )
    );

CREATE POLICY "job_tracker_user_insert" ON public.job_tracker
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND u.whalesync_postgres_id = assigned_user_id
        ) AND
        EXISTS (
            SELECT 1 FROM public.user_job_assignments uja
            WHERE uja.user_id = assigned_user_id
            AND uja.project_id = job_tracker.project_id
            AND uja.plot_id = job_tracker.plot_id
            AND uja.job_type_id = job_tracker.job_type_id
            AND uja.is_active = true
        )
    );

-- Plot Job Status - Project access
CREATE POLICY "plot_job_status_access" ON public.plot_job_status
    FOR ALL USING (
        project_id IN (
            SELECT whalesync_postgres_id FROM public."Projects" p
            WHERE EXISTS (
                SELECT 1 FROM public."Users" u 
                WHERE u.supabase_auth_id = auth.uid() 
                AND (
                    u.role IN ('Admin', 'Document Controller', 'Project Manager', 'Director') OR
                    u.currentproject = p.whalesync_postgres_id
                )
            )
        )
    );

-- User Rate Cards - User and admin access
CREATE POLICY "user_rate_cards_access" ON public.user_rate_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND (
                u.role IN ('Admin', 'Document Controller', 'Project Manager', 'Director') OR
                u.whalesync_postgres_id = user_rate_cards.user_id
            )
        )
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_work_categories_updated_at BEFORE UPDATE ON public.work_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_types_updated_at BEFORE UPDATE ON public.job_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_rate_cards_updated_at BEFORE UPDATE ON public.user_rate_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plot_job_status_updated_at BEFORE UPDATE ON public.plot_job_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_tracker_updated_at BEFORE UPDATE ON public.job_tracker FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check for duplicate work submissions
CREATE OR REPLACE FUNCTION public.check_duplicate_job_submission()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- Check for existing approved work for same plot/job type
    SELECT COUNT(*) INTO existing_count
    FROM public.job_tracker jt
    JOIN public.plot_job_status pjs ON (
        pjs.project_id = NEW.project_id AND 
        pjs.plot_id = NEW.plot_id AND 
        pjs.job_type_id = NEW.job_type_id
    )
    WHERE jt.project_id = NEW.project_id
    AND jt.plot_id = NEW.plot_id
    AND jt.job_type_id = NEW.job_type_id
    AND jt.status = 'approved'
    AND pjs.status IN ('approved', 'locked');
    
    -- If work already approved and plot is locked, prevent duplicate
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Work already completed and approved for this plot and job type. Contact admin to reopen if needed.';
    END IF;
    
    -- Update plot status to claimed when job is submitted
    INSERT INTO public.plot_job_status (project_id, plot_id, job_type_id, status, claimed_by, claimed_at)
    VALUES (NEW.project_id, NEW.plot_id, NEW.job_type_id, 'claimed', NEW.assigned_user_id, now())
    ON CONFLICT (project_id, plot_id, job_type_id) 
    DO UPDATE SET 
        status = CASE 
            WHEN plot_job_status.status = 'available' THEN 'claimed'
            ELSE plot_job_status.status
        END,
        claimed_by = CASE 
            WHEN plot_job_status.status = 'available' THEN NEW.assigned_user_id
            ELSE plot_job_status.claimed_by
        END,
        claimed_at = CASE 
            WHEN plot_job_status.status = 'available' THEN now()
            ELSE plot_job_status.claimed_at
        END,
        updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_duplicate_job_submission_trigger
    BEFORE INSERT ON public.job_tracker
    FOR EACH ROW EXECUTE FUNCTION public.check_duplicate_job_submission();

-- Function to update plot status when job is approved
CREATE OR REPLACE FUNCTION public.update_plot_status_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- When job is approved, update plot status
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE public.plot_job_status 
        SET status = 'approved', updated_at = now()
        WHERE project_id = NEW.project_id 
        AND plot_id = NEW.plot_id 
        AND job_type_id = NEW.job_type_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plot_status_on_approval_trigger
    AFTER UPDATE ON public.job_tracker
    FOR EACH ROW EXECUTE FUNCTION public.update_plot_status_on_approval();