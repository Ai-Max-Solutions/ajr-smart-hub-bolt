-- Phase 9: Real-time Collaboration & Notifications

-- Create chat rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    room_type TEXT NOT NULL CHECK (room_type IN ('project', 'team', 'direct', 'general')),
    project_id UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 50,
    room_settings JSONB DEFAULT '{"notifications": true, "file_sharing": true}'
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system', 'mention')),
    content TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    reply_to_message_id UUID,
    mentioned_users UUID[],
    message_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE
);

-- Create chat room participants table
CREATE TABLE IF NOT EXISTS public.chat_room_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    muted_until TIMESTAMP WITH TIME ZONE,
    notification_settings JSONB DEFAULT '{"mentions": true, "all_messages": true}',
    UNIQUE(room_id, user_id)
);

-- Create real-time notifications table
CREATE TABLE IF NOT EXISTS public.real_time_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('chat', 'mention', 'document', 'project', 'system', 'compliance', 'deadline')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
    push_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false
);

-- Create document collaboration table
CREATE TABLE IF NOT EXISTS public.document_collaboration (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('drawing', 'rams', 'timesheet', 'report')),
    action_type TEXT NOT NULL CHECK (action_type IN ('viewing', 'editing', 'commenting', 'sharing')),
    cursor_position JSONB,
    selection_range JSONB,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    session_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user presence table
CREATE TABLE IF NOT EXISTS public.user_presence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    current_location TEXT, -- URL or page they're on
    device_info JSONB DEFAULT '{}',
    custom_status TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create push notification subscriptions table
CREATE TABLE IF NOT EXISTS public.push_notification_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
    browser_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, endpoint)
);

-- Enable RLS on all new tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_time_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collaboration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat rooms
CREATE POLICY "Users can view rooms they participate in" ON public.chat_rooms
    FOR SELECT USING (
        id IN (
            SELECT room_id FROM public.chat_room_participants 
            WHERE user_id = (
                SELECT whalesync_postgres_id FROM public."Users" 
                WHERE supabase_auth_id = auth.uid()
            )
        )
        OR EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Document Controller', 'Project Manager')
        )
    );

CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
    FOR INSERT WITH CHECK (
        created_by = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    );

-- Create RLS policies for chat messages
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM public.chat_room_participants 
            WHERE user_id = (
                SELECT whalesync_postgres_id FROM public."Users" 
                WHERE supabase_auth_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can send messages to their rooms" ON public.chat_messages
    FOR INSERT WITH CHECK (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
        AND room_id IN (
            SELECT room_id FROM public.chat_room_participants 
            WHERE user_id = user_id
        )
    );

-- Create RLS policies for chat room participants
CREATE POLICY "Users can view participants in their rooms" ON public.chat_room_participants
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM public.chat_room_participants participants
            WHERE participants.user_id = (
                SELECT whalesync_postgres_id FROM public."Users" 
                WHERE supabase_auth_id = auth.uid()
            )
        )
    );

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.real_time_notifications
    FOR SELECT USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own notifications" ON public.real_time_notifications
    FOR UPDATE USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    );

-- Create RLS policies for document collaboration
CREATE POLICY "Users can view document collaboration" ON public.document_collaboration
    FOR SELECT USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public."Users"
            WHERE supabase_auth_id = auth.uid()
            AND role IN ('Admin', 'Document Controller', 'Project Manager')
        )
    );

CREATE POLICY "Users can manage their own collaboration sessions" ON public.document_collaboration
    FOR ALL USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    );

-- Create RLS policies for user presence
CREATE POLICY "Users can view all user presence" ON public.user_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON public.user_presence
    FOR ALL USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    );

-- Create RLS policies for push subscriptions
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_notification_subscriptions
    FOR ALL USING (
        user_id = (
            SELECT whalesync_postgres_id FROM public."Users" 
            WHERE supabase_auth_id = auth.uid()
        )
    );

-- Create functions for real-time features
CREATE OR REPLACE FUNCTION public.create_chat_room(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_room_type TEXT DEFAULT 'team',
    p_project_id UUID DEFAULT NULL,
    p_participant_ids UUID[] DEFAULT ARRAY[]::UUID[]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_room_id UUID;
    v_participant_id UUID;
BEGIN
    -- Get current user
    SELECT whalesync_postgres_id INTO v_user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Create chat room
    INSERT INTO public.chat_rooms (name, description, room_type, project_id, created_by)
    VALUES (p_name, p_description, p_room_type, p_project_id, v_user_id)
    RETURNING id INTO v_room_id;
    
    -- Add creator as admin
    INSERT INTO public.chat_room_participants (room_id, user_id, role)
    VALUES (v_room_id, v_user_id, 'admin');
    
    -- Add other participants
    FOREACH v_participant_id IN ARRAY p_participant_ids
    LOOP
        INSERT INTO public.chat_room_participants (room_id, user_id, role)
        VALUES (v_room_id, v_participant_id, 'member')
        ON CONFLICT (room_id, user_id) DO NOTHING;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'room_id', v_room_id,
        'message', 'Chat room created successfully'
    );
END;
$$;

-- Create function to send real-time notifications
CREATE OR REPLACE FUNCTION public.send_real_time_notification(
    p_user_ids UUID[],
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'system',
    p_priority TEXT DEFAULT 'medium',
    p_action_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_notification_count INTEGER := 0;
BEGIN
    -- Insert notifications for each user
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        INSERT INTO public.real_time_notifications (
            user_id, title, message, type, priority, action_url, metadata
        ) VALUES (
            v_user_id, p_title, p_message, p_type, p_priority, p_action_url, p_metadata
        );
        v_notification_count := v_notification_count + 1;
    END LOOP;
    
    RETURN v_notification_count;
END;
$$;

-- Create function to update user presence
CREATE OR REPLACE FUNCTION public.update_user_presence(
    p_status TEXT DEFAULT 'online',
    p_location TEXT DEFAULT NULL,
    p_custom_status TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT whalesync_postgres_id INTO v_user_id
    FROM public."Users"
    WHERE supabase_auth_id = auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    INSERT INTO public.user_presence (user_id, status, current_location, custom_status)
    VALUES (v_user_id, p_status, p_location, p_custom_status)
    ON CONFLICT (user_id) 
    DO UPDATE SET
        status = EXCLUDED.status,
        current_location = EXCLUDED.current_location,
        custom_status = EXCLUDED.custom_status,
        last_seen = now(),
        updated_at = now();
    
    RETURN TRUE;
END;
$$;

-- Create function to clean up old collaboration sessions
CREATE OR REPLACE FUNCTION public.cleanup_inactive_collaborations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Mark sessions as inactive if no activity for 30 minutes
    UPDATE public.document_collaboration
    SET is_active = false
    WHERE is_active = true
    AND last_activity < (now() - INTERVAL '30 minutes');
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Delete old inactive sessions (older than 24 hours)
    DELETE FROM public.document_collaboration
    WHERE is_active = false
    AND last_activity < (now() - INTERVAL '24 hours');
    
    RETURN cleaned_count;
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.real_time_notifications(user_id, read_at, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_collaboration_document_active ON public.document_collaboration(document_id, is_active, last_activity) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status, last_seen) WHERE status != 'offline';

-- Enable realtime for chat tables
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.real_time_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
ALTER TABLE public.document_collaboration REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.real_time_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_collaboration;

-- Create updated_at triggers
CREATE TRIGGER update_chat_rooms_updated_at
    BEFORE UPDATE ON public.chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();