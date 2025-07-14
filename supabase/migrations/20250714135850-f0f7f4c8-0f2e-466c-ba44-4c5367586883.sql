-- Create smart_notifications table for AI-driven notifications
CREATE TABLE public.smart_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('safety', 'compliance', 'productivity', 'training', 'general')),
  ai_generated BOOLEAN NOT NULL DEFAULT true,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own notifications" 
ON public.smart_notifications 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can create notifications for users" 
ON public.smart_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.smart_notifications 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

-- Create indexes for performance
CREATE INDEX idx_smart_notifications_user_id ON public.smart_notifications(user_id);
CREATE INDEX idx_smart_notifications_read ON public.smart_notifications(read);
CREATE INDEX idx_smart_notifications_priority ON public.smart_notifications(priority);
CREATE INDEX idx_smart_notifications_created_at ON public.smart_notifications(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create AI rate limiting table
CREATE TABLE public.ai_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for rate limiting lookups
CREATE INDEX idx_ai_rate_limits_user_endpoint ON public.ai_rate_limits(user_id, endpoint);
CREATE INDEX idx_ai_rate_limits_window_start ON public.ai_rate_limits(window_start);

-- Function to check AI rate limits
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_user_id TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 50,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start_time := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current count for this user/endpoint in the time window
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM public.ai_rate_limits
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start >= window_start_time;
  
  -- If under limit, record this request and return true
  IF current_count < p_max_requests THEN
    INSERT INTO public.ai_rate_limits (user_id, endpoint, request_count)
    VALUES (p_user_id, p_endpoint, 1)
    ON CONFLICT (user_id, endpoint) DO UPDATE 
    SET request_count = ai_rate_limits.request_count + 1,
        window_start = CASE 
          WHEN ai_rate_limits.window_start < window_start_time THEN now()
          ELSE ai_rate_limits.window_start 
        END;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to sanitize AI input
CREATE OR REPLACE FUNCTION public.sanitize_ai_input(input_text TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- Basic sanitization - remove dangerous patterns
  input_text := TRIM(input_text);
  
  -- Remove potential SQL injection patterns
  input_text := regexp_replace(input_text, '(;|--|/\*|\*/|xp_|sp_)', '', 'gi');
  
  -- Limit length
  IF LENGTH(input_text) > 2000 THEN
    input_text := LEFT(input_text, 2000);
  END IF;
  
  RETURN input_text;
END;
$$ LANGUAGE plpgsql;