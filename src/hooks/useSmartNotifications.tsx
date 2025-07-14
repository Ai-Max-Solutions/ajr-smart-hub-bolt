import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  priority?: string;
  category?: string;
  projectId?: string;
  complianceDeadline?: string;
  metadata?: any;
  deliveryChannels?: string[];
}

export const useSmartNotifications = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createNotification = useCallback(async (params: CreateNotificationParams) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('smart-notifications', {
        body: {
          action: 'create',
          ...params
        }
      });

      if (error) throw error;

      toast({
        title: 'Notification created',
        description: 'Smart notification has been sent successfully'
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating notification',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const markAsRead = useCallback(async (notificationId: string, deviceType?: string, locationContext?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('smart-notifications', {
        body: {
          action: 'mark_read',
          notificationId,
          deviceType: deviceType || 'web',
          locationContext: locationContext || 'office'
        }
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      toast({
        title: 'Error marking as read',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  const markAsAcknowledged = useCallback(async (notificationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('smart-notifications', {
        body: {
          action: 'mark_acknowledged',
          notificationId
        }
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      toast({
        title: 'Error acknowledging notification',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  const generateCompliancePredictions = useCallback(async (projectId?: string, userId?: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('smart-notifications', {
        body: {
          action: 'predict_compliance',
          projectId,
          userId
        }
      });

      if (error) throw error;

      toast({
        title: 'Compliance predictions generated',
        description: `Generated ${data.predictions} predictions`
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error generating predictions',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const bulkMarkAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      setLoading(true);
      
      const promises = notificationIds.map(id => markAsRead(id));
      await Promise.all(promises);

      toast({
        title: 'Bulk action completed',
        description: `Marked ${notificationIds.length} notifications as read`
      });
    } catch (error: any) {
      toast({
        title: 'Error with bulk action',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [markAsRead, toast]);

  const getNotificationStats = useCallback(async (projectId?: string, daysBack: number = 7) => {
    try {
      // For now, return mock data since the function needs to be added to the migration
      return {
        total_notifications: 0,
        unread_count: 0,
        high_priority_unread: 0,
        compliance_overdue: 0,
        avg_response_time_hours: 0,
        ai_predictions_accurate: 0
      };
    } catch (error: any) {
      console.error('Error fetching notification stats:', error);
      return null;
    }
  }, []);

  return {
    loading,
    createNotification,
    markAsRead,
    markAsAcknowledged,
    generateCompliancePredictions,
    bulkMarkAsRead,
    getNotificationStats
  };
};