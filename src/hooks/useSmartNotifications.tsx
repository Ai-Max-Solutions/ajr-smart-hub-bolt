import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SmartNotification {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'safety' | 'compliance' | 'productivity' | 'training' | 'general';
  ai_generated: boolean;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

export const useSmartNotifications = () => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('smart_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifs = data.map((n: any) => ({
        ...n,
        is_read: n.is_read || false
      })) as SmartNotification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Generate new AI notifications
  const generateSmartNotifications = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('smart-notifications', {
        body: {
          userId: user.id,
          type: 'daily_check',
        },
      });

      if (error) throw error;

      toast({
        title: "Smart Notifications Generated",
        description: `Generated ${data.notifications?.length || 0} personalized notifications`,
      });

      // Refresh notifications
      await fetchNotifications();

    } catch (error) {
      console.error('Error generating notifications:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to generate notifications',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('smart_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('smart_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);

      toast({
        title: "All notifications marked as read",
      });

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Get notifications by priority
  const getByPriority = useCallback((priority: 'high' | 'medium' | 'low') => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  // Get unread notifications
  const getUnread = useCallback(() => {
    return notifications.filter(n => !n.is_read);
  }, [notifications]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const channel = supabase
        .channel('smart-notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'smart_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    generateSmartNotifications,
    markAsRead,
    markAllAsRead,
    getByPriority,
    getUnread,
  };
};