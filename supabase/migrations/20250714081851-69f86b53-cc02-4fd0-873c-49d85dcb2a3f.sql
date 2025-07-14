-- Create signatures table to match the existing SignatureVault interface
CREATE TABLE public.signatures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    operative_name TEXT NOT NULL,
    operative_id TEXT,
    signature_type TEXT NOT NULL,
    document_title TEXT NOT NULL,
    document_version TEXT,
    project_id UUID,
    project_name TEXT,
    plot_id UUID,
    plot_name TEXT,
    plot_location TEXT,
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    signature_method TEXT NOT NULL DEFAULT 'Digital Pad',
    signature_data TEXT NOT NULL, -- base64 signature image
    verified_by TEXT,
    status TEXT NOT NULL DEFAULT 'Valid',
    pod_id UUID, -- for POD signature integration
    signature_category TEXT DEFAULT 'general', -- 'general', 'POD', 'RAMS', etc.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key relationships
ALTER TABLE public.signatures 
ADD CONSTRAINT fk_signatures_project_id 
FOREIGN KEY (project_id) REFERENCES public."Projects"(whalesync_postgres_id);

-- Create indexes for better performance
CREATE INDEX idx_signatures_project_id ON public.signatures(project_id);
CREATE INDEX idx_signatures_operative_id ON public.signatures(operative_id);
CREATE INDEX idx_signatures_type ON public.signatures(signature_type);
CREATE INDEX idx_signatures_category ON public.signatures(signature_category);
CREATE INDEX idx_signatures_signed_at ON public.signatures(signed_at);

-- Enable RLS
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for signatures
CREATE POLICY "Users can view signatures for their projects" 
ON public.signatures FOR SELECT 
USING (
    project_id IN (
        SELECT pt.project_id FROM public.project_team pt
        WHERE pt.user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    )
    OR EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    )
);

CREATE POLICY "Users can create signatures" 
ON public.signatures FOR INSERT 
WITH CHECK (true); -- Allow all authenticated users to create signatures

CREATE POLICY "Admins can update signatures" 
ON public.signatures FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    )
);

-- Now create pod_signatures table
CREATE TABLE public.pod_signatures (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pod_id UUID NOT NULL,
    user_id UUID NOT NULL,
    signature_type TEXT NOT NULL CHECK (signature_type IN ('creation', 'approval', 'dispute', 'resolution')),
    signature_data TEXT NOT NULL, -- base64 signature image
    signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    location_lat NUMERIC,
    location_lng NUMERIC,
    device_info JSONB,
    ip_address INET,
    signature_context JSONB, -- POD-specific context (supplier, delivery type, etc.)
    is_valid BOOLEAN NOT NULL DEFAULT true,
    invalidated_at TIMESTAMP WITH TIME ZONE,
    invalidation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key relationships for pod_signatures
ALTER TABLE public.pod_signatures 
ADD CONSTRAINT fk_pod_signatures_pod_id 
FOREIGN KEY (pod_id) REFERENCES public.pod_register(id) ON DELETE CASCADE;

ALTER TABLE public.pod_signatures 
ADD CONSTRAINT fk_pod_signatures_user_id 
FOREIGN KEY (user_id) REFERENCES public."Users"(whalesync_postgres_id);

-- Create indexes for pod_signatures
CREATE INDEX idx_pod_signatures_pod_id ON public.pod_signatures(pod_id);
CREATE INDEX idx_pod_signatures_user_id ON public.pod_signatures(user_id);
CREATE INDEX idx_pod_signatures_type ON public.pod_signatures(signature_type);
CREATE INDEX idx_pod_signatures_signed_at ON public.pod_signatures(signed_at);

-- Enable RLS for pod_signatures
ALTER TABLE public.pod_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pod_signatures
CREATE POLICY "Users can view POD signatures for their projects" 
ON public.pod_signatures FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.pod_register pr
        JOIN public.project_team pt ON pr.project_id = pt.project_id
        WHERE pr.id = pod_signatures.pod_id 
        AND pt.user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    )
    OR EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    )
);

CREATE POLICY "Users can create POD signatures" 
ON public.pod_signatures FOR INSERT 
WITH CHECK (
    user_id = (
        SELECT whalesync_postgres_id FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    )
);

CREATE POLICY "Admins can update POD signatures" 
ON public.pod_signatures FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Document Controller')
    )
);

-- Create function to automatically log POD signatures to general signatures table
CREATE OR REPLACE FUNCTION public.log_pod_signature_to_vault()
RETURNS TRIGGER AS $$
DECLARE
    pod_record RECORD;
    operative_name TEXT;
    project_name TEXT;
BEGIN
    -- Get POD details and project name
    SELECT pr.*, p.projectname as project_name, u.fullname as operative_name
    INTO pod_record
    FROM public.pod_register pr
    LEFT JOIN public."Projects" p ON pr.project_id = p.whalesync_postgres_id
    LEFT JOIN public."Users" u ON pr.uploaded_by = u.whalesync_postgres_id
    WHERE pr.id = NEW.pod_id;
    
    -- Get signer name
    SELECT fullname INTO operative_name
    FROM public."Users"
    WHERE whalesync_postgres_id = NEW.user_id;
    
    -- Insert into signatures table for vault compatibility
    INSERT INTO public.signatures (
        id,
        operative_name,
        operative_id,
        signature_type,
        document_title,
        signed_at,
        signature_method,
        signature_data,
        verified_by,
        status,
        pod_id,
        signature_category,
        plot_location,
        project_id,
        project_name
    ) VALUES (
        gen_random_uuid(),
        operative_name,
        (SELECT userid FROM public."Users" WHERE whalesync_postgres_id = NEW.user_id),
        CASE NEW.signature_type
            WHEN 'creation' THEN 'POD Creation'
            WHEN 'approval' THEN 'POD Approval'
            WHEN 'dispute' THEN 'POD Dispute'
            WHEN 'resolution' THEN 'POD Resolution'
        END,
        'POD: ' || COALESCE(pod_record.description, 'Unknown') || ' - ' || COALESCE(pod_record.supplier_name, 'Unknown Supplier'),
        NEW.signed_at,
        'Digital Pad',
        NEW.signature_data,
        CASE 
            WHEN NEW.signature_type = 'approval' THEN operative_name
            ELSE NULL
        END,
        CASE 
            WHEN NEW.is_valid THEN 'Valid'
            ELSE 'Invalid'
        END,
        NEW.pod_id,
        'POD',
        pod_record.plot_location,
        pod_record.project_id,
        project_name
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log POD signatures
CREATE TRIGGER trigger_log_pod_signature_to_vault
    AFTER INSERT ON public.pod_signatures
    FOR EACH ROW
    EXECUTE FUNCTION public.log_pod_signature_to_vault();

-- Add update trigger for both tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_signatures_updated_at
    BEFORE UPDATE ON public.signatures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pod_signatures_updated_at
    BEFORE UPDATE ON public.pod_signatures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();