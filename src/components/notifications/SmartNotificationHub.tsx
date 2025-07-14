import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { 
  Bell, 
  BellOff, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  TrendingUp,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SmartNotificationHub = () => {
  const {
    notifications,
    loading,
    unreadCount,
    generateSmartNotifications,
    markAsRead,
    markAllAsRead,
    getByPriority,
    getUnread,
  } = useSmartNotifications();

  const [activeTab, setActiveTab] = useState('all');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety': return <Shield className="w-4 h-4" />;
      case 'compliance': return <CheckCircle className="w-4 h-4" />;
      case 'productivity': return <TrendingUp className="w-4 h-4" />;
      case 'training': return <BookOpen className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-destructive/10 text-destructive';
      case 'compliance': return 'bg-primary/10 text-primary';
      case 'productivity': return 'bg-accent/10 text-accent-foreground';
      case 'training': return 'bg-secondary/10 text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredNotifications = () => {
    switch (activeTab) {
      case 'unread': return getUnread();
      case 'high': return getByPriority('high');
      case 'safety': return notifications.filter(n => n.category === 'safety');
      case 'compliance': return notifications.filter(n => n.category === 'compliance');
      default: return notifications;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Smart Notifications</h2>
          <p className="text-muted-foreground">
            AI-powered insights and alerts for your construction projects
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Bell className="w-3 h-3 mr-1" />
            {unreadCount} unread
          </Badge>
          
          <Button
            variant="outline"
            onClick={generateSmartNotifications}
            disabled={loading}
            className="whitespace-nowrap"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate AI Insights
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-destructive">{getByPriority('high').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Safety Alerts</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.filter(n => n.category === 'safety').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Generated</p>
                <p className="text-2xl font-bold text-primary">
                  {notifications.filter(n => n.ai_generated).length}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="high">High Priority</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredNotifications().map((notification) => (
                    <Card 
                      key={notification.id}
                      className={`transition-all hover:shadow-md ${
                        !notification.is_read ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${getCategoryColor(notification.category)}`}>
                              {getCategoryIcon(notification.category)}
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium">{notification.title}</h4>
                                <Badge variant={getPriorityColor(notification.priority) as any}>
                                  {notification.priority}
                                </Badge>
                                {notification.ai_generated && (
                                  <Badge variant="outline" className="text-xs">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredNotifications().length === 0 && (
                    <div className="text-center py-8">
                      <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No notifications</h3>
                      <p className="text-muted-foreground mb-4">
                        {activeTab === 'all' 
                          ? "You're all caught up!" 
                          : `No ${activeTab} notifications found.`
                        }
                      </p>
                      {activeTab === 'all' && (
                        <Button onClick={generateSmartNotifications} disabled={loading}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Smart Notifications
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartNotificationHub;