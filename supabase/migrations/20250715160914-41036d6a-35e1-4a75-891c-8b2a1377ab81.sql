-- Create CSCS cards table for storing card metadata
CREATE TABLE IF NOT EXISTS public.cscs_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  cscs_card_type TEXT NOT NULL,
  custom_card_type TEXT,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cscs_cards ENABLE ROW LEVEL SECURITY;

-- INSERT: user can add their own card
CREATE POLICY "Allow insert own CSCS card"
ON public.cscs_cards
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- SELECT: user can view their own cards
CREATE POLICY "Allow select own CSCS card"
ON public.cscs_cards
FOR SELECT
USING (user_id = auth.uid());

-- UPDATE: user can update their own cards
CREATE POLICY "Allow update own CSCS card"
ON public.cscs_cards
FOR UPDATE
USING (user_id = auth.uid());

-- DELETE: user can delete their own cards
CREATE POLICY "Allow delete own CSCS card"
ON public.cscs_cards
FOR DELETE
USING (user_id = auth.uid());

-- Optional: Admin access to all cards
CREATE POLICY "Admins can manage all CSCS cards"
ON public.cscs_cards
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public."Users" u
    WHERE u.supabase_auth_id = auth.uid()
    AND u.role IN ('Admin', 'Document Controller', 'Project Manager')
  )
);