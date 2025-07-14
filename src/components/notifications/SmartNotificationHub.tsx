import React, { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle, Volume2, Eye, Trash2, Archive, Filter, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { NotificationAnalytics } from './NotificationAnalytics';
import { VoiceInterface } from './VoiceInterface';

interface SmartNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  category: string;
  is_read: boolean;
  is_acknowledged: boolean;
  action_taken?: string;
  compliance_deadline?: string;
  created_at: string;
  project_name?: string;
  ai_confidence?: number;
  predicted_compliance_risk?: number;
  delivery_channels?: string[];
  delivery_status?: any;
}

const SmartNotificationHub: React.FC = () => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<SmartNotification | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high_priority' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const { toast } = useToast();
  const { markAsRead, markAsAcknowledged, createNotification } = useSmartNotifications();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('smart_notifications')
        .select(`
          id,
          title,
          message,
          notification_type,
          priority,
          category,
          is_read,
          is_acknowledged,
          action_taken,
          compliance_deadline,
          created_at,
          ai_confidence,
          predicted_compliance_risk,
          delivery_channels,
          delivery_status,
          Projects(projectname)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const processedNotifications: SmartNotification[] = data.map(notification => ({
        ...notification,
        project_name: notification.Projects?.projectname || 'No Project',
        delivery_channels: Array.isArray(notification.delivery_channels) ? notification.delivery_channels as string[] : ['in_app']
      }));

      setNotifications(processedNotifications);
      setFilteredNotifications(processedNotifications);
    } catch (error: any) {
      toast({
        title: 'Error loading notifications',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Filter notifications
  useEffect(() => {
    let filtered = notifications;

    // Apply main filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.is_read);
        break;
      case 'high_priority':
        filtered = filtered.filter(n => ['high', 'critical'].includes(n.priority));
        break;
      case 'overdue':
        filtered = filtered.filter(n => 
          n.compliance_deadline && 
          new Date(n.compliance_deadline) < new Date() &&
          !n.is_acknowledged
        );
        break;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(n => selectedTypes.includes(n.notification_type));
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter, searchTerm, selectedTypes]);

  // Real-time updates
  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('smart-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'smart_notifications'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      fetchNotifications();
      toast({
        title: 'Notification marked as read',
        description: 'Analytics have been recorded'
      });
    } catch (error: any) {
      toast({
        title: 'Error marking as read',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsAcknowledged = async (notificationId: string) => {
    try {
      await markAsAcknowledged(notificationId);
      fetchNotifications();
      toast({
        title: 'Notification acknowledged',
        description: 'Action has been recorded'
      });
    } catch (error: any) {
      toast({
        title: 'Error acknowledging notification',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return <AlertTriangle className="h-4 w-4" />;
      case 'compliance':
        return <CheckCircle className="h-4 w-4" />;
      case 'training':
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const highPriorityCount = notifications.filter(n => ['high', 'critical'].includes(n.priority) && !n.is_read).length;
  const overdueCount = notifications.filter(n => 
    n.compliance_deadline && 
    new Date(n.compliance_deadline) < new Date() &&
    !n.is_acknowledged
  ).length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Notifications</h1>
          <p className="text-muted-foreground">AI-powered compliance and safety alerts</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={voiceEnabled ? 'bg-primary text-primary-foreground' : ''}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Voice
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{highPriorityCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="high_priority">High Priority</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTypes.join(',')} onValueChange={(value) => setSelectedTypes(value ? value.split(',') : [])}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="pod">POD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Voice Interface */}
      {voiceEnabled && (
        <VoiceInterface
          onCommand={(command, notificationId) => {
            // Handle voice commands
            if (command === 'read' && notificationId) {
              handleMarkAsRead(notificationId);
            } else if (command === 'acknowledge' && notificationId) {
              handleMarkAsAcknowledged(notificationId);
            }
          }}
        />
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No notifications found</p>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all hover:shadow-md ${
                !notification.is_read ? 'border-l-4 border-l-primary bg-primary/5' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(notification.notification_type)}
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {notification.category}
                      </Badge>
                      {notification.ai_confidence && (
                        <Badge variant="secondary">
                          AI: {Math.round(notification.ai_confidence * 100)}%
                        </Badge>
                      )}
                      {notification.predicted_compliance_risk && notification.predicted_compliance_risk > 0.7 && (
                        <Badge variant="destructive">
                          High Risk
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg">{notification.title}</h3>
                      <p className="text-muted-foreground mt-1">{notification.message}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatTimeAgo(notification.created_at)}</span>
                      {notification.project_name && (
                        <span>• {notification.project_name}</span>
                      )}
                      {notification.compliance_deadline && (
                        <span className={
                          new Date(notification.compliance_deadline) < new Date() 
                            ? 'text-red-600 font-medium' 
                            : ''
                        }>
                          • Due: {new Date(notification.compliance_deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Delivery Status */}
                    {notification.delivery_status && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Delivered via:</span>
                        {notification.delivery_status.successful?.map((channel: string) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                    
                    {!notification.is_acknowledged && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleMarkAsAcknowledged(notification.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{notification.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>{notification.message}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Type:</span> {notification.notification_type}
                            </div>
                            <div>
                              <span className="font-medium">Priority:</span> {notification.priority}
                            </div>
                            <div>
                              <span className="font-medium">Category:</span> {notification.category}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {new Date(notification.created_at).toLocaleString()}
                            </div>
                          </div>

                          {notification.ai_confidence && (
                            <div className="bg-secondary/20 p-3 rounded-lg">
                              <h4 className="font-medium mb-2">AI Analysis</h4>
                              <div className="text-sm space-y-1">
                                <div>Confidence: {Math.round(notification.ai_confidence * 100)}%</div>
                                {notification.predicted_compliance_risk && (
                                  <div>Compliance Risk: {Math.round(notification.predicted_compliance_risk * 100)}%</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notification Analytics</DialogTitle>
          </DialogHeader>
          <NotificationAnalytics />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartNotificationHub;