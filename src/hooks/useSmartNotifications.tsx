import { useState, useEffect, useCallback } from 'react';
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

  // Mock notifications data
  const mockNotifications: SmartNotification[] = [
    {
      id: 'smart1',
      title: 'AI Safety Alert',
      message: 'Weather conditions suggest increased safety precautions today.',
      priority: 'high',
      category: 'safety',
      ai_generated: true,
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      user_id: 'demo-user'
    },
    {
      id: 'smart2',
      title: 'Productivity Insight',
      message: 'Your team efficiency is 15% above average this week.',
      priority: 'medium',
      category: 'productivity',
      ai_generated: true,
      is_read: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      user_id: 'demo-user'
    },
    {
      id: 'smart3',
      title: 'Training Reminder',
      message: 'Based on your role, refresher training on equipment safety is recommended.',
      priority: 'medium',
      category: 'training',
      ai_generated: true,
      is_read: true,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      user_id: 'demo-user'
    }
  ];

  // Fetch notifications (mock implementation)
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate new AI notifications (mock implementation)
  const generateSmartNotification = useCallback(async (
    category: SmartNotification['category'],
    context: any = {}
  ) => {
    try {
      const newNotification: SmartNotification = {
        id: `smart_${Date.now()}`,
        title: `AI ${category} Alert`,
        message: `Smart notification generated based on ${category} context.`,
        priority: 'medium',
        category,
        ai_generated: true,
        is_read: false,
        created_at: new Date().toISOString(),
        user_id: context.user_id || 'demo-user'
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast for high priority notifications
      if (newNotification.priority === 'high' || newNotification.priority === 'critical') {
        toast({
          title: newNotification.title,
          description: newNotification.message,
          variant: newNotification.priority === 'critical' ? 'destructive' : 'default',
        });
      }

      return newNotification;
    } catch (error) {
      console.error('Error generating smart notification:', error);
      return null;
    }
  }, [toast]);

  // Mark notification as read (mock implementation)
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read (mock implementation)
  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Delete notification (mock implementation)
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.is_read ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Schedule smart notification (mock implementation)
  const scheduleSmartNotification = useCallback(async (
    title: string,
    message: string,
    scheduledFor: Date,
    priority: SmartNotification['priority'] = 'medium'
  ) => {
    try {
      // In a real implementation, this would schedule the notification
      console.log('Scheduling smart notification:', {
        title,
        message,
        scheduledFor,
        priority
      });
      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }, []);

  // Generate smart notifications (mock implementation)
  const generateSmartNotifications = useCallback(async () => {
    try {
      // Mock generate multiple notifications
      const newNotifications: SmartNotification[] = [
        {
          id: `smart_${Date.now()}_1`,
          title: 'Weather Alert',
          message: 'Heavy rain expected today - ensure proper safety equipment.',
          priority: 'high',
          category: 'safety',
          ai_generated: true,
          is_read: false,
          created_at: new Date().toISOString(),
          user_id: 'demo-user'
        }
      ];

      setNotifications(prev => [...newNotifications, ...prev]);
      setUnreadCount(prev => prev + newNotifications.length);
      return newNotifications;
    } catch (error) {
      console.error('Error generating smart notifications:', error);
      return [];
    }
  }, []);

  // Get notifications by priority
  const getByPriority = useCallback((priority: SmartNotification['priority']) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  // Get unread notifications
  const getUnread = useCallback(() => {
    return notifications.filter(n => !n.is_read);
  }, [notifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    generateSmartNotification,
    generateSmartNotifications,
    getByPriority,
    getUnread,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    scheduleSmartNotification
  };
};