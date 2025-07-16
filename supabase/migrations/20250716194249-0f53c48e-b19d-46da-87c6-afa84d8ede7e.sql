-- Create Users table
CREATE TABLE public.Users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fullname TEXT,
    employmentstatus TEXT DEFAULT 'Active',
    role TEXT DEFAULT 'User',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create taskplanrams table
CREATE TABLE public.taskplanrams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taskplanrams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Users table
CREATE POLICY "Users can view all users" ON public.Users FOR SELECT USING (true);
CREATE POLICY "Users can update their own record" ON public.Users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert their own record" ON public.Users FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Create RLS policies for audit_log table
CREATE POLICY "Audit logs are viewable by authenticated users" ON public.audit_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Audit logs can be inserted by authenticated users" ON public.audit_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for taskplanrams table
CREATE POLICY "Users can view their own taskplanrams" ON public.taskplanrams FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create their own taskplanrams" ON public.taskplanrams FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own taskplanrams" ON public.taskplanrams FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete their own taskplanrams" ON public.taskplanrams FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.Users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_taskplanrams_updated_at
    BEFORE UPDATE ON public.taskplanrams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create detect_suspicious_activity function
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Simple suspicious activity detection
    -- This is a placeholder function that returns a basic risk assessment
    result := json_build_object(
        'risk_level', 'LOW',
        'message', 'No suspicious activity detected',
        'timestamp', now()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;