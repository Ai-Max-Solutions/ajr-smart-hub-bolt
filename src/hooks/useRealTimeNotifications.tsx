import { useState, useEffect, useCallback } from 'react';
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

  // Mock notifications data
  const mockNotifications: Notification[] = [
    {
      id: 'notif1',
      user_id: user?.id || 'demo-user',
      title: 'New Document Available',
      message: 'A new safety document has been added to your project.',
      type: 'document',
      priority: 'medium',
      action_url: '/documents',
      metadata: { document_id: 'doc1' },
      created_at: new Date(Date.now() - 3600000).toISOString(),
      push_sent: true,
      email_sent: false
    },
    {
      id: 'notif2',
      user_id: user?.id || 'demo-user',
      title: 'Timesheet Reminder',
      message: 'Please submit your timesheet for this week.',
      type: 'deadline',
      priority: 'high',
      action_url: '/timesheet',
      metadata: { week: '2024-01-15' },
      created_at: new Date(Date.now() - 7200000).toISOString(),
      push_sent: true,
      email_sent: true
    },
    {
      id: 'notif3',
      user_id: user?.id || 'demo-user',
      title: 'Project Update',
      message: 'Your project timeline has been updated.',
      type: 'project',
      priority: 'low',
      action_url: '/projects',
      metadata: { project_id: 'proj1' },
      read_at: new Date(Date.now() - 10800000).toISOString(),
      created_at: new Date(Date.now() - 10800000).toISOString(),
      push_sent: false,
      email_sent: false
    }
  ];

  // Fetch notifications (mock implementation)
  const fetchNotifications = useCallback(async (limit = 50) => {
    if (!user) return;

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userNotifications = mockNotifications.filter(n => n.user_id === user.id);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read_at).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Mark notification as read (mock implementation)
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const readTime = new Date().toISOString();
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_at: readTime } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all notifications as read (mock implementation)
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const readTime = new Date().toISOString();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || readTime }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Delete notification (mock implementation)
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read_at ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user, notifications]);

  // Send notification to users (mock implementation)
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
      // Create mock notification
      const newNotification: Notification = {
        id: `notif_${Date.now()}`,
        user_id: userIds[0] || 'demo-user',
        title,
        message,
        type,
        priority,
        action_url: actionUrl,
        metadata,
        created_at: new Date().toISOString(),
        push_sent: true,
        email_sent: false
      };

      // Add to local state if current user is in the recipient list
      if (user && userIds.includes(user.id)) {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast for high priority notifications
        if (priority === 'high' || priority === 'urgent') {
          toast({
            title,
            description: message,
            variant: priority === 'urgent' ? 'destructive' : 'default',
          });
        }
      }

      return newNotification.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
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