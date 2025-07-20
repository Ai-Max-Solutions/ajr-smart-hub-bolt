-- Add status enum for projects
CREATE TYPE project_status_enum AS ENUM ('Planning', 'Active', 'Building', 'Completed');

-- Add status and is_archived columns to projects table
ALTER TABLE public.projects 
ADD COLUMN status project_status_enum NOT NULL DEFAULT 'Planning'::project_status_enum,
ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

-- Create index for better performance on archived projects filter
CREATE INDEX idx_projects_is_archived ON public.projects(is_archived);

-- Create index for status filtering
CREATE INDEX idx_projects_status ON public.projects(status);