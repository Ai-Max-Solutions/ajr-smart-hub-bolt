-- Phase 4: Job & Work Management Relationships
-- Phase 5: User & Assignment Relationships

-- Step 1: Clean up invalid references for Hire table
UPDATE public."Hire" SET project = NULL WHERE project IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Projects" WHERE whalesync_postgres_id = "Hire".project);

UPDATE public."Hire" SET block = NULL WHERE block IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Blocks" WHERE whalesync_postgres_id = "Hire".block);

UPDATE public."Hire" SET jobs = NULL WHERE jobs IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Jobs" WHERE whalesync_postgres_id = "Hire".jobs);

-- Clean up invalid references for Job_Templates
UPDATE public."Job_Templates" SET jobs = NULL WHERE jobs IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Jobs" WHERE whalesync_postgres_id = "Job_Templates".jobs);

UPDATE public."Job_Templates" SET category = NULL WHERE category IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."WorkCategories" WHERE whalesync_postgres_id = "Job_Templates".category);

-- Clean up invalid references for User_Job_Rates
UPDATE public."User_Job_Rates" SET "user" = NULL WHERE "user" IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Users" WHERE whalesync_postgres_id = "User_Job_Rates"."user");

UPDATE public."User_Job_Rates" SET jobs = NULL WHERE jobs IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Jobs" WHERE whalesync_postgres_id = "User_Job_Rates".jobs);

UPDATE public."User_Job_Rates" SET jobtemplate = NULL WHERE jobtemplate IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Job_Templates" WHERE whalesync_postgres_id = "User_Job_Rates".jobtemplate);

UPDATE public."User_Job_Rates" SET plottype = NULL WHERE plottype IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Plot_Types" WHERE whalesync_postgres_id = "User_Job_Rates".plottype);

-- Clean up invalid references for Plots
UPDATE public."Plots" SET jobs = NULL WHERE jobs IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Jobs" WHERE whalesync_postgres_id = "Plots".jobs);

UPDATE public."Plots" SET plottype = NULL WHERE plottype IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public."Plot_Types" WHERE whalesync_postgres_id = "Plots".plottype);

-- Step 2: Add missing foreign key constraints for Hire table
ALTER TABLE public."Hire" 
ADD CONSTRAINT hire_project_fkey 
FOREIGN KEY (project) REFERENCES public."Projects"(whalesync_postgres_id) 
ON DELETE CASCADE;

ALTER TABLE public."Hire" 
ADD CONSTRAINT hire_block_fkey 
FOREIGN KEY (block) REFERENCES public."Blocks"(whalesync_postgres_id) 
ON DELETE SET NULL;

ALTER TABLE public."Hire" 
ADD CONSTRAINT hire_jobs_fkey 
FOREIGN KEY (jobs) REFERENCES public."Jobs"(whalesync_postgres_id) 
ON DELETE SET NULL;

-- Step 3: Add missing foreign key constraints for Job_Templates
ALTER TABLE public."Job_Templates" 
ADD CONSTRAINT job_templates_jobs_fkey 
FOREIGN KEY (jobs) REFERENCES public."Jobs"(whalesync_postgres_id) 
ON DELETE SET NULL;

ALTER TABLE public."Job_Templates" 
ADD CONSTRAINT job_templates_category_fkey 
FOREIGN KEY (category) REFERENCES public."WorkCategories"(whalesync_postgres_id) 
ON DELETE SET NULL;

-- Step 4: Add missing foreign key constraints for User_Job_Rates
ALTER TABLE public."User_Job_Rates" 
ADD CONSTRAINT user_job_rates_user_fkey 
FOREIGN KEY ("user") REFERENCES public."Users"(whalesync_postgres_id) 
ON DELETE CASCADE;

ALTER TABLE public."User_Job_Rates" 
ADD CONSTRAINT user_job_rates_jobs_fkey 
FOREIGN KEY (jobs) REFERENCES public."Jobs"(whalesync_postgres_id) 
ON DELETE SET NULL;

ALTER TABLE public."User_Job_Rates" 
ADD CONSTRAINT user_job_rates_jobtemplate_fkey 
FOREIGN KEY (jobtemplate) REFERENCES public."Job_Templates"(whalesync_postgres_id) 
ON DELETE SET NULL;

ALTER TABLE public."User_Job_Rates" 
ADD CONSTRAINT user_job_rates_plottype_fkey 
FOREIGN KEY (plottype) REFERENCES public."Plot_Types"(whalesync_postgres_id) 
ON DELETE SET NULL;

-- Step 5: Add missing foreign key constraints for Plots
ALTER TABLE public."Plots" 
ADD CONSTRAINT plots_jobs_fkey 
FOREIGN KEY (jobs) REFERENCES public."Jobs"(whalesync_postgres_id) 
ON DELETE SET NULL;

ALTER TABLE public."Plots" 
ADD CONSTRAINT plots_plottype_fkey 
FOREIGN KEY (plottype) REFERENCES public."Plot_Types"(whalesync_postgres_id) 
ON DELETE SET NULL;

-- Step 6: Create junction tables for many-to-many relationships

-- Project-Jobs junction table (replacing single Jobs reference)
CREATE TABLE IF NOT EXISTS public.project_jobs (
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public."Jobs"(whalesync_postgres_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (project_id, job_id)
);

-- Plot-Jobs junction table (replacing single Jobs reference)
CREATE TABLE IF NOT EXISTS public.plot_jobs (
    plot_id UUID NOT NULL REFERENCES public."Plots"(whalesync_postgres_id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public."Jobs"(whalesync_postgres_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'assigned',
    PRIMARY KEY (plot_id, job_id)
);

-- User-Jobs junction table for job assignments
CREATE TABLE IF NOT EXISTS public.user_jobs (
    user_id UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public."Jobs"(whalesync_postgres_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'assigned',
    skill_level TEXT,
    PRIMARY KEY (user_id, job_id)
);

-- Step 7: Create Project-Users junction table (replacing single users field)
CREATE TABLE IF NOT EXISTS public.project_users (
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    role TEXT DEFAULT 'member',
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);

-- Step 8: Populate junction tables from existing relationships

-- Populate project_users from Users.currentproject
INSERT INTO public.project_users (project_id, user_id, role)
SELECT u.currentproject, u.whalesync_postgres_id, 'member'
FROM public."Users" u
WHERE u.currentproject IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Populate plot_jobs from existing Plots.jobs single references
INSERT INTO public.plot_jobs (plot_id, job_id)
SELECT p.whalesync_postgres_id, p.jobs
FROM public."Plots" p
WHERE p.jobs IS NOT NULL
ON CONFLICT (plot_id, job_id) DO NOTHING;

-- Step 9: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_hire_project ON public."Hire"(project);
CREATE INDEX IF NOT EXISTS idx_hire_block ON public."Hire"(block);
CREATE INDEX IF NOT EXISTS idx_hire_jobs ON public."Hire"(jobs);

CREATE INDEX IF NOT EXISTS idx_job_templates_jobs ON public."Job_Templates"(jobs);
CREATE INDEX IF NOT EXISTS idx_job_templates_category ON public."Job_Templates"(category);

CREATE INDEX IF NOT EXISTS idx_user_job_rates_user ON public."User_Job_Rates"("user");
CREATE INDEX IF NOT EXISTS idx_user_job_rates_jobs ON public."User_Job_Rates"(jobs);
CREATE INDEX IF NOT EXISTS idx_user_job_rates_jobtemplate ON public."User_Job_Rates"(jobtemplate);
CREATE INDEX IF NOT EXISTS idx_user_job_rates_plottype ON public."User_Job_Rates"(plottype);

CREATE INDEX IF NOT EXISTS idx_plots_jobs ON public."Plots"(jobs);
CREATE INDEX IF NOT EXISTS idx_plots_plottype ON public."Plots"(plottype);

CREATE INDEX IF NOT EXISTS idx_project_jobs_project ON public.project_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_jobs_job ON public.project_jobs(job_id);

CREATE INDEX IF NOT EXISTS idx_plot_jobs_plot ON public.plot_jobs(plot_id);
CREATE INDEX IF NOT EXISTS idx_plot_jobs_job ON public.plot_jobs(job_id);

CREATE INDEX IF NOT EXISTS idx_user_jobs_user ON public.user_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_jobs_job ON public.user_jobs(job_id);

CREATE INDEX IF NOT EXISTS idx_project_users_project ON public.project_users(project_id);
CREATE INDEX IF NOT EXISTS idx_project_users_user ON public.project_users(user_id);