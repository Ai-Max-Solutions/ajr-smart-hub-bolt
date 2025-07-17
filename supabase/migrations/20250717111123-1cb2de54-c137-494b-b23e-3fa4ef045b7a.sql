-- Update the default value for is_blocked to true so new users are blocked by default
ALTER TABLE public.users ALTER COLUMN is_blocked SET DEFAULT true;