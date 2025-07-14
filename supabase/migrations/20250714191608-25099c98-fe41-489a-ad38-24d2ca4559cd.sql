-- Add RLS policies for tables missing security controls

-- Enable RLS for Plot_Assignments
ALTER TABLE public."Plot_Assignments" ENABLE ROW LEVEL SECURITY;

-- Plot_Assignments policies - users can only see their own assignments
CREATE POLICY "Users can view own plot assignments" 
ON public."Plot_Assignments" 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create own plot assignments" 
ON public."Plot_Assignments" 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own plot assignments" 
ON public."Plot_Assignments" 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all plot assignments" 
ON public."Plot_Assignments" 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
));

-- Enable RLS for Plot_Status_History
ALTER TABLE public."Plot_Status_History" ENABLE ROW LEVEL SECURITY;

-- Plot_Status_History policies - users can only see history for plots they have access to
CREATE POLICY "Users can view plot status history for accessible plots" 
ON public."Plot_Status_History" 
FOR SELECT 
USING (
    plot_id IN (
        SELECT pa.plot_id 
        FROM public."Plot_Assignments" pa 
        WHERE pa.user_id = auth.uid()
    ) OR 
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Document Controller', 'Project Manager')
    )
);

CREATE POLICY "Admins can manage all plot status history" 
ON public."Plot_Status_History" 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
));

-- Enable RLS for Work_Tracking_History
ALTER TABLE public."Work_Tracking_History" ENABLE ROW LEVEL SECURITY;

-- Work_Tracking_History policies - users can only see their own work history
CREATE POLICY "Users can view own work tracking history" 
ON public."Work_Tracking_History" 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create own work tracking records" 
ON public."Work_Tracking_History" 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own work tracking records" 
ON public."Work_Tracking_History" 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all work tracking history" 
ON public."Work_Tracking_History" 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller', 'Project Manager')
));

-- Enable RLS for Asite_Sync_Log
ALTER TABLE public."Asite_Sync_Log" ENABLE ROW LEVEL SECURITY;

-- Asite_Sync_Log policies - restrict to admin/document controller roles only
CREATE POLICY "Only admins can access Asite sync logs" 
ON public."Asite_Sync_Log" 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public."Users" 
    WHERE supabase_auth_id = auth.uid() 
    AND role IN ('Admin', 'Document Controller')
));