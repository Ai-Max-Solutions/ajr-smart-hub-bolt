import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'chat' | 'mention' | 'document' | 'project' | 'system' | 'compliance' | 'deadline';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  metadata: any;
  read_at?: string;
  created_at: string;
  expires_at?: string;
  push_sent: boolean;
  email_sent: boolean;
}

export const useRealTimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async (limit = 50) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('real_time_notifications')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const typedNotifications = (data || []).map((item: any): Notification => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        message: item.message,
        type: item.type as Notification['type'],
        priority: item.priority as Notification['priority'],
        action_url: item.action_url,
        metadata: item.metadata,
        read_at: item.read_at,
        created_at: item.created_at,
        expires_at: item.expires_at,
        push_sent: item.push_sent,
        email_sent: item.email_sent
      }));
      
      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('real_time_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.user_id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('real_time_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.user_id)
        .is('read_at', null);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('real_time_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.user_id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read_at ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user, notifications]);

  // Send notification to users
  const sendNotification = useCallback(async (
    userIds: string[],
    title: string,
    message: string,
    type: Notification['type'] = 'system',
    priority: Notification['priority'] = 'medium',
    actionUrl?: string,
    metadata: any = {}
  ) => {
    try {
      const { data, error } = await supabase
        .rpc('send_real_time_notification', {
          p_user_ids: userIds,
          p_title: title,
          p_message: message,
          p_type: type,
          p_priority: priority,
          p_action_url: actionUrl,
          p_metadata: metadata
        });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'real_time_notifications',
          filter: `user_id=eq.${user.user_id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for high priority notifications
          if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.priority === 'urgent' ? 'destructive' : 'default',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'real_time_notifications',
          filter: `user_id=eq.${user.user_id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications().finally(() => setLoading(false));
    }
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification
  };
};