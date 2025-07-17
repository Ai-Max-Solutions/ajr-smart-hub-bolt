-- Create tables to properly store onboarding data linked to users

-- Emergency contacts table
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_emergency_contacts_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_emergency_contact UNIQUE (user_id) -- One emergency contact per user
);

-- CSCS cards table
CREATE TABLE public.cscs_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_number TEXT NOT NULL,
  card_type TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  front_image_url TEXT,
  back_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, rejected
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_cscs_cards_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_cscs_card UNIQUE (user_id) -- One active CSCS card per user
);

-- User work types table
CREATE TABLE public.user_work_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  work_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_work_types_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_work_type UNIQUE (user_id, work_type) -- No duplicate work types per user
);

-- Enable RLS on all tables
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cscs_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_work_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for emergency_contacts
CREATE POLICY "Users can view their own emergency contact" 
ON public.emergency_contacts 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can create their own emergency contact" 
ON public.emergency_contacts 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can update their own emergency contact" 
ON public.emergency_contacts 
FOR UPDATE 
USING (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Admins can view all emergency contacts" 
ON public.emergency_contacts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.supabase_auth_id = auth.uid() 
  AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
));

-- Create RLS policies for cscs_cards
CREATE POLICY "Users can view their own CSCS card" 
ON public.cscs_cards 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can create their own CSCS card" 
ON public.cscs_cards 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can update their own CSCS card" 
ON public.cscs_cards 
FOR UPDATE 
USING (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Admins can view all CSCS cards" 
ON public.cscs_cards 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.supabase_auth_id = auth.uid() 
  AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
));

CREATE POLICY "Admins can update CSCS card status" 
ON public.cscs_cards 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.supabase_auth_id = auth.uid() 
  AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
));

-- Create RLS policies for user_work_types
CREATE POLICY "Users can view their own work types" 
ON public.user_work_types 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can create their own work types" 
ON public.user_work_types 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Users can delete their own work types" 
ON public.user_work_types 
FOR DELETE 
USING (user_id IN (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY "Admins can view all work types" 
ON public.user_work_types 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.supabase_auth_id = auth.uid() 
  AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cscs_cards_updated_at
  BEFORE UPDATE ON public.cscs_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);
CREATE INDEX idx_cscs_cards_user_id ON public.cscs_cards(user_id);
CREATE INDEX idx_cscs_cards_status ON public.cscs_cards(status);
CREATE INDEX idx_user_work_types_user_id ON public.user_work_types(user_id);