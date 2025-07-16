-- Minimal timesheet schema validation and cleanup
-- Ensure all constraints and relationships are properly set up

-- Verify timesheet_status_enum has all required values
DO $$ 
BEGIN
    -- Check if enum exists and has correct values
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'timesheet_status_enum' 
        AND e.enumlabel = 'Rejected'
    ) THEN
        -- Add Rejected status if it doesn't exist
        ALTER TYPE timesheet_status_enum ADD VALUE IF NOT EXISTS 'Rejected';
    END IF;
END $$;

-- Ensure foreign key constraints are properly named and configured
ALTER TABLE timesheets 
DROP CONSTRAINT IF EXISTS timesheets_user_id_fkey,
ADD CONSTRAINT timesheets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE timesheets 
DROP CONSTRAINT IF EXISTS timesheets_project_id_fkey,
ADD CONSTRAINT timesheets_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE timesheet_entries 
DROP CONSTRAINT IF EXISTS timesheet_entries_timesheet_id_fkey,
ADD CONSTRAINT timesheet_entries_timesheet_id_fkey 
FOREIGN KEY (timesheet_id) REFERENCES timesheets(id) ON DELETE CASCADE;

ALTER TABLE timesheet_entries 
DROP CONSTRAINT IF EXISTS timesheet_entries_plot_id_fkey,
ADD CONSTRAINT timesheet_entries_plot_id_fkey 
FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE SET NULL;

ALTER TABLE timesheet_entries 
DROP CONSTRAINT IF EXISTS timesheet_entries_work_category_id_fkey,
ADD CONSTRAINT timesheet_entries_work_category_id_fkey 
FOREIGN KEY (work_category_id) REFERENCES work_categories(id) ON DELETE SET NULL;

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_timesheets_user_week ON timesheets(user_id, week_commencing);
CREATE INDEX IF NOT EXISTS idx_timesheets_project ON timesheets(project_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet ON timesheet_entries(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_plot ON timesheet_entries(plot_id);