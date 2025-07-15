-- Fix foreign key constraint in audit_log table to allow user deletion
-- Drop the existing foreign key constraint
ALTER TABLE audit_log 
DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;

-- Add new foreign key constraint with ON DELETE SET NULL
-- This preserves audit records but sets user_id to NULL when user is deleted
ALTER TABLE audit_log 
ADD CONSTRAINT audit_log_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES "Users"(whalesync_postgres_id) 
ON DELETE SET NULL;