-- Create delivery_bookings table for logistics management
CREATE TABLE public.delivery_bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT NOT NULL UNIQUE,
    submitted_by UUID NOT NULL,
    submitted_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    supplier TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time TIME NOT NULL,
    items_json JSONB NOT NULL DEFAULT '[]',
    delivery_method JSONB NOT NULL DEFAULT '{}',
    vehicle_details JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'initiated', 'booked', 'failed', 'rejected')),
    booking_reference TEXT,
    booking_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.delivery_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage delivery bookings" 
ON public.delivery_bookings 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.supabase_auth_id = auth.uid() 
    AND u.role IN ('Admin', 'PM', 'Director', 'Supervisor')
));

CREATE POLICY "Document controllers can view delivery bookings" 
ON public.delivery_bookings 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_delivery_bookings_updated_at
BEFORE UPDATE ON public.delivery_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_delivery_bookings_status ON public.delivery_bookings(status);
CREATE INDEX idx_delivery_bookings_delivery_date ON public.delivery_bookings(delivery_date);
CREATE INDEX idx_delivery_bookings_submitted_by ON public.delivery_bookings(submitted_by);