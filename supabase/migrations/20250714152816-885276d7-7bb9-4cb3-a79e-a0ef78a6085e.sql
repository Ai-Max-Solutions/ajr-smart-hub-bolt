-- Phase 11: Real-time Collaboration & Communication
-- Create missing tables for real-time collaboration features

-- User presence tracking
CREATE TABLE IF NOT EXISTS public.user_presence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    current_page TEXT,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    device_info JSONB DEFAULT '{}',
    location_context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Live activity feed for real-time updates
CREATE TABLE IF NOT EXISTS public.live_activity_feed (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    project_id UUID,
    related_entity_type TEXT,
    related_entity_id UUID,
    is_system_generated BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Collaboration sessions for live editing/viewing
CREATE TABLE IF NOT EXISTS public.collaboration_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_name TEXT NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('document', 'drawing', 'planning', 'meeting')),
    host_user_id UUID NOT NULL,
    participants JSONB DEFAULT '[]',
    document_id TEXT,
    document_type TEXT,
    session_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    project_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video/voice call sessions
CREATE TABLE IF NOT EXISTS public.video_call_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL UNIQUE,
    session_name TEXT NOT NULL,
    host_user_id UUID NOT NULL,
    participants JSONB DEFAULT '[]',
    call_type TEXT NOT NULL DEFAULT 'video' CHECK (call_type IN ('audio', 'video', 'screen_share')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
    scheduled_start TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    recording_enabled BOOLEAN DEFAULT false,
    recording_url TEXT,
    meeting_notes TEXT,
    project_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shared workspaces for team collaboration
CREATE TABLE IF NOT EXISTS public.shared_workspaces (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    workspace_type TEXT NOT NULL CHECK (workspace_type IN ('project', 'team', 'temporary', 'client')),
    owner_id UUID NOT NULL,
    members JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '{}',
    workspace_data JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    project_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Message reactions for enhanced chat experience
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reaction_type TEXT NOT NULL,
    emoji TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(message_id, user_id, reaction_type)
);

-- Enable RLS on all new tables
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Foreign key constraints
ALTER TABLE public.user_presence 
ADD CONSTRAINT fk_user_presence_user_id 
FOREIGN KEY (user_id) REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE;

ALTER TABLE public.live_activity_feed 
ADD CONSTRAINT fk_live_activity_user_id 
FOREIGN KEY (user_id) REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE;

ALTER TABLE public.live_activity_feed 
ADD CONSTRAINT fk_live_activity_project_id 
FOREIGN KEY (project_id) REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE;

ALTER TABLE public.collaboration_sessions 
ADD CONSTRAINT fk_collaboration_host_user_id 
FOREIGN KEY (host_user_id) REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE;

ALTER TABLE public.collaboration_sessions 
ADD CONSTRAINT fk_collaboration_project_id 
FOREIGN KEY (project_id) REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE;

ALTER TABLE public.video_call_sessions 
ADD CONSTRAINT fk_video_call_host_user_id 
FOREIGN KEY (host_user_id) REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE;

ALTER TABLE public.video_call_sessions 
ADD CONSTRAINT fk_video_call_project_id 
FOREIGN KEY (project_id) REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE;

ALTER TABLE public.shared_workspaces 
ADD CONSTRAINT fk_shared_workspace_owner_id 
FOREIGN KEY (owner_id) REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE;

ALTER TABLE public.shared_workspaces 
ADD CONSTRAINT fk_shared_workspace_project_id 
FOREIGN KEY (project_id) REFERENCES public."Projects"(whalesync_postgres_id) ON DELETE CASCADE;

ALTER TABLE public.message_reactions 
ADD CONSTRAINT fk_message_reactions_message_id 
FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;

ALTER TABLE public.message_reactions 
ADD CONSTRAINT fk_message_reactions_user_id 
FOREIGN KEY (user_id) REFERENCES public."Users"(whalesync_postgres_id) ON DELETE CASCADE;

-- RLS Policies for user_presence
CREATE POLICY "Users can view team presence" ON public.user_presence
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public."Users" u1, public."Users" u2
        WHERE u1.supabase_auth_id = auth.uid()
        AND u2.whalesync_postgres_id = user_presence.user_id
        AND (u1.currentproject = u2.currentproject OR u1.role IN ('Admin', 'Project Manager', 'Director'))
    )
);

CREATE POLICY "Users can update own presence" ON public.user_presence
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND whalesync_postgres_id = user_presence.user_id
    )
);

-- RLS Policies for live_activity_feed
CREATE POLICY "Users can view project activity" ON public.live_activity_feed
FOR SELECT USING (
    project_id IN (
        SELECT currentproject FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Director')
    )
);

CREATE POLICY "Users can insert own activities" ON public.live_activity_feed
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND whalesync_postgres_id = live_activity_feed.user_id
    )
);

-- RLS Policies for collaboration_sessions
CREATE POLICY "Users can view project collaboration sessions" ON public.collaboration_sessions
FOR SELECT USING (
    host_user_id IN (
        SELECT whalesync_postgres_id FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    ) OR
    project_id IN (
        SELECT currentproject FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Director')
    )
);

CREATE POLICY "Users can manage own collaboration sessions" ON public.collaboration_sessions
FOR ALL USING (
    host_user_id IN (
        SELECT whalesync_postgres_id FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    )
);

-- RLS Policies for video_call_sessions
CREATE POLICY "Users can view project video calls" ON public.video_call_sessions
FOR SELECT USING (
    host_user_id IN (
        SELECT whalesync_postgres_id FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    ) OR
    project_id IN (
        SELECT currentproject FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Director')
    )
);

CREATE POLICY "Users can manage own video calls" ON public.video_call_sessions
FOR ALL USING (
    host_user_id IN (
        SELECT whalesync_postgres_id FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    )
);

-- RLS Policies for shared_workspaces
CREATE POLICY "Users can view accessible workspaces" ON public.shared_workspaces
FOR SELECT USING (
    is_public = true OR
    owner_id IN (
        SELECT whalesync_postgres_id FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    ) OR
    project_id IN (
        SELECT currentproject FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public."Users" 
        WHERE supabase_auth_id = auth.uid() 
        AND role IN ('Admin', 'Project Manager', 'Director')
    )
);

CREATE POLICY "Users can manage own workspaces" ON public.shared_workspaces
FOR ALL USING (
    owner_id IN (
        SELECT whalesync_postgres_id FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    )
);

-- RLS Policies for message_reactions
CREATE POLICY "Users can view message reactions" ON public.message_reactions
FOR SELECT USING (true);

CREATE POLICY "Users can manage own reactions" ON public.message_reactions
FOR ALL USING (
    user_id IN (
        SELECT whalesync_postgres_id FROM public."Users" 
        WHERE supabase_auth_id = auth.uid()
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_activity ON public.user_presence(last_activity);

CREATE INDEX IF NOT EXISTS idx_live_activity_feed_user_id ON public.live_activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_live_activity_feed_project_id ON public.live_activity_feed(project_id);
CREATE INDEX IF NOT EXISTS idx_live_activity_feed_created_at ON public.live_activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_activity_feed_activity_type ON public.live_activity_feed(activity_type);

CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_host_user_id ON public.collaboration_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_project_id ON public.collaboration_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_is_active ON public.collaboration_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_video_call_sessions_host_user_id ON public.video_call_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_project_id ON public.video_call_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_status ON public.video_call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_room_id ON public.video_call_sessions(room_id);

CREATE INDEX IF NOT EXISTS idx_shared_workspaces_owner_id ON public.shared_workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_workspaces_project_id ON public.shared_workspaces(project_id);
CREATE INDEX IF NOT EXISTS idx_shared_workspaces_workspace_type ON public.shared_workspaces(workspace_type);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON public.user_presence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collaboration_sessions_updated_at BEFORE UPDATE ON public.collaboration_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_video_call_sessions_updated_at BEFORE UPDATE ON public.video_call_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shared_workspaces_updated_at BEFORE UPDATE ON public.shared_workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

-- Ensure full row replication for real-time updates
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
ALTER TABLE public.live_activity_feed REPLICA IDENTITY FULL;
ALTER TABLE public.collaboration_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.video_call_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.shared_workspaces REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;