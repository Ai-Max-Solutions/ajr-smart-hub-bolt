import { useState, useEffect, useCallback } from 'react';
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

  // Mock data for demo
  const mockRooms: ChatRoom[] = [
    {
      id: 'room1',
      name: 'General Discussion',
      description: 'General team chat',
      room_type: 'general',
      created_by: user?.id || 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      max_participants: 100,
      room_settings: {},
      unread_count: 2
    },
    {
      id: 'room2',
      name: 'Project Alpha',
      description: 'Discussion for Project Alpha',
      room_type: 'project',
      project_id: 'project1',
      created_by: user?.id || 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      max_participants: 50,
      room_settings: {},
      unread_count: 0
    }
  ];

  const mockMessages: Record<string, ChatMessage[]> = {
    room1: [
      {
        id: 'msg1',
        room_id: 'room1',
        user_id: 'demo-user-1',
        message_type: 'text',
        content: 'Welcome to the general discussion!',
        message_metadata: {},
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        user: {
          fullname: 'Demo User',
          role: 'Admin'
        }
      },
      {
        id: 'msg2',
        room_id: 'room1',
        user_id: 'demo-user-2',
        message_type: 'text',
        content: 'Thanks! Looking forward to collaborating.',
        message_metadata: {},
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        user: {
          fullname: 'Jane Smith',
          role: 'Supervisor'
        }
      }
    ],
    room2: [
      {
        id: 'msg3',
        room_id: 'room2',
        user_id: 'demo-user-1',
        message_type: 'text',
        content: 'Project Alpha kickoff meeting scheduled for tomorrow.',
        message_metadata: {},
        created_at: new Date(Date.now() - 900000).toISOString(),
        updated_at: new Date(Date.now() - 900000).toISOString(),
        user: {
          fullname: 'Demo User',
          role: 'Admin'
        }
      }
    ]
  };

  // Fetch user's chat rooms (mock implementation)
  const fetchRooms = useCallback(async () => {
    if (!user) return;

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setRooms(mockRooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load chat rooms",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Fetch messages for a specific room (mock implementation)
  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setMessages(prev => ({
        ...prev,
        [roomId]: mockMessages[roomId] || []
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

  // Send a message (mock implementation)
  const sendMessage = useCallback(async (
    roomId: string,
    content: string,
    messageType: 'text' | 'file' | 'image' | 'mention' = 'text',
    replyToId?: string,
    mentionedUsers?: string[]
  ) => {
    if (!user || !content.trim()) return;

    try {
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        room_id: roomId,
        user_id: user.id,
        message_type: messageType,
        content: content.trim(),
        reply_to_message_id: replyToId,
        mentioned_users: mentionedUsers,
        message_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          fullname: 'Current User',
          role: 'User'
        }
      };

      // Add message to local state
      setMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), newMessage]
      }));

      // Update room timestamp
      setRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, updated_at: new Date().toISOString() }
          : room
      ));

      return newMessage;
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

  // Create a new chat room (mock implementation)
  const createRoom = useCallback(async (
    name: string,
    description?: string,
    roomType: 'project' | 'team' | 'direct' | 'general' = 'team',
    projectId?: string,
    participantIds: string[] = []
  ) => {
    if (!user) return null;

    try {
      const newRoom: ChatRoom = {
        id: `room_${Date.now()}`,
        name,
        description,
        room_type: roomType,
        project_id: projectId,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        max_participants: 50,
        room_settings: {},
        unread_count: 0
      };

      setRooms(prev => [newRoom, ...prev]);
      return newRoom.id;
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast({
        title: "Error",
        description: "Failed to create chat room",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  // Mark messages as read (mock implementation)
  const markAsRead = useCallback(async (roomId: string) => {
    if (!user) return;

    try {
      // Update local state
      setRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, unread_count: 0 } : room
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchRooms().finally(() => setLoading(false));
      // Pre-load messages for demo rooms
      Object.keys(mockMessages).forEach(roomId => {
        setMessages(prev => ({
          ...prev,
          [roomId]: mockMessages[roomId]
        }));
      });
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