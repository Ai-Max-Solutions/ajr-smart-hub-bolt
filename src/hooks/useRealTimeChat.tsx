import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message_type: 'text' | 'file' | 'image' | 'system' | 'mention';
  content: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_message_id?: string;
  mentioned_users?: string[];
  message_metadata: any;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  edited_at?: string;
  user?: {
    fullname: string;
    role: string;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  room_type: 'project' | 'team' | 'direct' | 'general';
  project_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  max_participants: number;
  room_settings: any;
  unread_count?: number;
}

export const useRealTimeChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<Record<string, string[]>>({});

  // Fetch user's chat rooms
  const fetchRooms = useCallback(async () => {
    if (!user) return;

    try {
      const { data: roomsData, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_room_participants!inner (
            user_id,
            last_read_at,
            notification_settings
          )
        `)
        .eq('chat_room_participants.user_id', user.user_id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get unread message counts
      const roomsWithUnread = await Promise.all(
        (roomsData || []).map(async (room: any) => {
          const participants = Array.isArray(room.chat_room_participants) 
            ? room.chat_room_participants 
            : [room.chat_room_participants];
          const participant = participants[0];
          if (!participant) return { ...room, unread_count: 0 };

          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .gt('created_at', participant.last_read_at || '1970-01-01');

          return {
            id: room.id,
            name: room.name,
            description: room.description,
            room_type: room.room_type as 'project' | 'team' | 'direct' | 'general',
            project_id: room.project_id,
            created_by: room.created_by,
            created_at: room.created_at,
            updated_at: room.updated_at,
            is_active: room.is_active,
            max_participants: room.max_participants,
            room_settings: room.room_settings,
            unread_count: count || 0
          };
        })
      );

      setRooms(roomsWithUnread);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load chat rooms",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Fetch messages for a specific room
  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user:Users!chat_messages_user_id_fkey (
            fullname,
            role
          )
        `)
        .eq('room_id', roomId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      setMessages(prev => ({
        ...prev,
        [roomId]: (data || []).map((msg: any) => ({
          id: msg.id,
          room_id: msg.room_id,
          user_id: msg.user_id,
          message_type: msg.message_type as 'text' | 'file' | 'image' | 'system' | 'mention',
          content: msg.content,
          file_url: msg.file_url,
          file_name: msg.file_name,
          file_size: msg.file_size,
          reply_to_message_id: msg.reply_to_message_id,
          mentioned_users: msg.mentioned_users,
          message_metadata: msg.message_metadata,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          deleted_at: msg.deleted_at,
          edited_at: msg.edited_at,
          user: msg.user
        }))
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Send a message
  const sendMessage = useCallback(async (
    roomId: string,
    content: string,
    messageType: 'text' | 'file' | 'image' | 'mention' = 'text',
    replyToId?: string,
    mentionedUsers?: string[]
  ) => {
    if (!user || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.user_id,
          message_type: messageType,
          content: content.trim(),
          reply_to_message_id: replyToId,
          mentioned_users: mentionedUsers
        })
        .select(`
          *,
          user:Users!chat_messages_user_id_fkey (
            fullname,
            role
          )
        `)
        .single();

      if (error) throw error;

      // Update room's updated_at timestamp
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  // Create a new chat room
  const createRoom = useCallback(async (
    name: string,
    description?: string,
    roomType: 'project' | 'team' | 'direct' | 'general' = 'team',
    projectId?: string,
    participantIds: string[] = []
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .rpc('create_chat_room', {
          p_name: name,
          p_description: description,
          p_room_type: roomType,
          p_project_id: projectId,
          p_participant_ids: participantIds
        });

      if (error) throw error;

      await fetchRooms();
      return data;
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast({
        title: "Error",
        description: "Failed to create chat room",
        variant: "destructive",
      });
      return null;
    }
  }, [user, fetchRooms, toast]);

  // Mark messages as read
  const markAsRead = useCallback(async (roomId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('chat_room_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.user_id);

      // Update local state
      setRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, unread_count: 0 } : room
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => ({
            ...prev,
            [newMessage.room_id]: [
              ...(prev[newMessage.room_id] || []),
              newMessage
            ]
          }));

          // Update room timestamp and unread count
          setRooms(prev => prev.map(room => {
            if (room.id === newMessage.room_id) {
              return {
                ...room,
                updated_at: newMessage.created_at,
                unread_count: newMessage.user_id !== user.user_id 
                  ? (room.unread_count || 0) + 1 
                  : room.unread_count
              };
            }
            return room;
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages(prev => ({
            ...prev,
            [updatedMessage.room_id]: (prev[updatedMessage.room_id] || []).map(msg =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchRooms().finally(() => setLoading(false));
    }
  }, [user, fetchRooms]);

  return {
    rooms,
    messages,
    loading,
    typing,
    fetchMessages,
    sendMessage,
    createRoom,
    markAsRead,
    refetchRooms: fetchRooms
  };
};