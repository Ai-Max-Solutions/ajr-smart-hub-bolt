-- Update default minimum read time for RAMS documents to 15 seconds
UPDATE rams_documents 
SET minimum_read_time = 15 
WHERE minimum_read_time = 30;

-- Update any existing task plan register entries with 30 second minimum times
UPDATE task_plan_register 
SET minimum_read_time = 15 
WHERE minimum_read_time = 30;