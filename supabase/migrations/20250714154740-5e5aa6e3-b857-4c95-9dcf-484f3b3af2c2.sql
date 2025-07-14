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