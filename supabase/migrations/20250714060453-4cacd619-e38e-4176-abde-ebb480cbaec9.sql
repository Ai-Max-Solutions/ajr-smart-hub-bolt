-- Create POD Register system
CREATE TABLE IF NOT EXISTS public.pod_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public."Projects"(whalesync_postgres_id),
    plot_id UUID REFERENCES public."Plots"(whalesync_postgres_id),
    pod_type TEXT NOT NULL CHECK (pod_type IN ('delivery', 'collection', 'off_hire', 'return', 'site_delivery')),
    supplier_id UUID REFERENCES public.suppliers(id),
    supplier_name TEXT,
    description TEXT NOT NULL,
    signed_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    signed_by_name TEXT,
    uploaded_by UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id),
    pod_photo_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'rejected')),
    linked_hire_id UUID REFERENCES public.on_hire(id),
    damage_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public."Users"(whalesync_postgres_id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create POD approval workflow table
CREATE TABLE IF NOT EXISTS public.pod_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES public.pod_register(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES public."Users"(whalesync_postgres_id),
    action TEXT NOT NULL CHECK (action IN ('approved', 'flagged', 'rejected', 'requested_changes')),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pod_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pod_register
CREATE POLICY "Users can view PODs for their projects" ON public.pod_register
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND (u.currentproject = project_id OR u.role IN ('Admin', 'Project Manager', 'Director'))
        )
    );

CREATE POLICY "Users can create PODs" ON public.pod_register
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND u.whalesync_postgres_id = uploaded_by
        )
    );

CREATE POLICY "Supervisors and above can update PODs" ON public.pod_register
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND (u.role IN ('Admin', 'Project Manager', 'Supervisor', 'Director') OR u.whalesync_postgres_id = uploaded_by)
        )
    );

-- RLS Policies for pod_approvals
CREATE POLICY "Users can view approvals for accessible PODs" ON public.pod_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pod_register pr
            JOIN public."Users" u ON u.supabase_auth_id = auth.uid()
            WHERE pr.id = pod_id 
            AND (u.currentproject = pr.project_id OR u.role IN ('Admin', 'Project Manager', 'Director'))
        )
    );

CREATE POLICY "Supervisors can create approvals" ON public.pod_approvals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public."Users" u 
            WHERE u.supabase_auth_id = auth.uid() 
            AND u.role IN ('Admin', 'Project Manager', 'Supervisor', 'Director')
            AND u.whalesync_postgres_id = approver_id
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pod_register_project_id ON public.pod_register(project_id);
CREATE INDEX IF NOT EXISTS idx_pod_register_status ON public.pod_register(status);
CREATE INDEX IF NOT EXISTS idx_pod_register_created_at ON public.pod_register(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pod_register_uploaded_by ON public.pod_register(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_pod_approvals_pod_id ON public.pod_approvals(pod_id);

-- Create storage bucket for POD photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pod-photos', 'pod-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for POD photos
CREATE POLICY "Anyone can view POD photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'pod-photos');

CREATE POLICY "Authenticated users can upload POD photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pod-photos' 
        AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update their own POD photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'pod-photos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Function to get POD summary for projects
CREATE OR REPLACE FUNCTION public.get_pod_summary(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_pods', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'flagged', COUNT(*) FILTER (WHERE status = 'flagged'),
        'recent_pods', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'pod_type', pod_type,
                    'supplier_name', supplier_name,
                    'description', description,
                    'status', status,
                    'created_at', created_at
                ) ORDER BY created_at DESC
            ) FROM (
                SELECT * FROM public.pod_register 
                WHERE project_id = p_project_id 
                ORDER BY created_at DESC 
                LIMIT 5
            ) recent
        )
    ) INTO result
    FROM public.pod_register
    WHERE project_id = p_project_id;
    
    RETURN COALESCE(result, '{"total_pods": 0, "pending": 0, "approved": 0, "flagged": 0, "recent_pods": []}'::jsonb);
END;
$$;

-- Webhook function for n8n integration
CREATE OR REPLACE FUNCTION public.notify_pod_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This will be called by n8n webhook
    PERFORM pg_notify(
        'pod_created',
        json_build_object(
            'pod_id', NEW.id,
            'project_id', NEW.project_id,
            'pod_type', NEW.pod_type,
            'supplier_name', NEW.supplier_name,
            'description', NEW.description,
            'photo_url', NEW.pod_photo_url,
            'created_at', NEW.created_at,
            'uploaded_by', NEW.uploaded_by
        )::text
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for POD creation webhook
CREATE TRIGGER pod_webhook_trigger
    AFTER INSERT ON public.pod_register
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_pod_webhook();