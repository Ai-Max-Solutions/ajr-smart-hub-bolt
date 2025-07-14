import React, { useState, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Settings, Smartphone } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { toast } from 'sonner';
import { AJIcon } from '@/components/ui/aj-icon';

interface NotificationSettings {
  enabled: boolean;
  projectUpdates: boolean;
  taskReminders: boolean;
  complianceAlerts: boolean;
  safetyNotices: boolean;
  systemMessages: boolean;
}

interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

export function PushNotificationsManager() {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    projectUpdates: true,
    taskReminders: true,
    complianceAlerts: true,
    safetyNotices: true,
    systemMessages: false,
  });
  const { canUsePushNotifications, isNative, triggerHaptics } = useMobile();

  useEffect(() => {
    if (canUsePushNotifications) {
      initializePushNotifications();
    }
  }, [canUsePushNotifications]);

  const initializePushNotifications = async () => {
    try {
      // Check permissions
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        const permRequest = await PushNotifications.requestPermissions();
        setIsPermissionGranted(permRequest.receive === 'granted');
      } else {
        setIsPermissionGranted(permStatus.receive === 'granted');
      }

      // Register listeners
      await PushNotifications.addListener('registration', token => {
        console.log('Push registration success, token: ' + token.value);
        setPushToken(token.value);
        triggerHaptics();
        toast.success('Push notifications enabled');
      });

      await PushNotifications.addListener('registrationError', err => {
        console.error('Registration error: ', err.error);
        toast.error('Failed to enable push notifications');
      });

      await PushNotifications.addListener('pushNotificationReceived', notification => {
        console.log('Push notification received: ', notification);
        
        const newNotification: PushNotification = {
          id: Date.now().toString(),
          title: notification.title,
          body: notification.body,
          data: notification.data,
          timestamp: new Date(),
          read: false
        };

        setNotifications(prev => [newNotification, ...prev]);
        triggerHaptics();
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
        console.log('Push notification action performed: ', notification.actionId, notification.inputValue);
        
        // Mark notification as read
        const notificationId = notification.notification.data?.id;
        if (notificationId) {
          markAsRead(notificationId);
        }
      });

      // Register for push notifications if permission granted
      if (isPermissionGranted) {
        await PushNotifications.register();
      }

    } catch (error) {
      console.error('Push notification initialization error:', error);
      toast.error('Failed to initialize push notifications');
    }
  };

  const enableNotifications = async () => {
    if (!canUsePushNotifications) {
      toast.error('Push notifications not available on this platform');
      return;
    }

    try {
      await PushNotifications.register();
      setSettings(prev => ({ ...prev, enabled: true }));
      await triggerHaptics();
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const disableNotifications = async () => {
    try {
      await PushNotifications.removeAllListeners();
      setSettings(prev => ({ ...prev, enabled: false }));
      setPushToken(null);
      await triggerHaptics();
      toast.success('Push notifications disabled');
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      toast.error('Failed to disable notifications');
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    triggerHaptics();
    toast.success('All notifications cleared');
  };

  const sendTestNotification = async () => {
    if (!pushToken) {
      toast.error('Push token not available');
      return;
    }

    // This would typically call your backend to send a test notification
    const testNotification: PushNotification = {
      id: Date.now().toString(),
      title: 'Test Notification',
      body: 'This is a test notification from AJ Ryan SmartWork Hub',
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [testNotification, ...prev]);
    await triggerHaptics();
    toast.success('Test notification sent');
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    triggerHaptics();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!canUsePushNotifications) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="text-center py-8">
          <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Push Notifications Unavailable</h3>
          <p className="text-muted-foreground">
            Push notifications require a mobile device with native capabilities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-poppins">
            <AJIcon icon={Bell} variant="navy" size="sm" hover={false} />
            Push Notifications
            {settings.enabled && (
              <Badge variant="default">Enabled</Badge>
            )}
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Enable Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive real-time updates about your projects and tasks
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    enableNotifications();
                  } else {
                    disableNotifications();
                  }
                }}
              />
            </div>

            {settings.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={sendTestNotification}
                  variant="outline"
                  size="sm"
                  className="font-poppins"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Send Test
                </Button>
                
                {notifications.length > 0 && (
                  <Button
                    onClick={clearAllNotifications}
                    variant="outline"
                    size="sm"
                    className="font-poppins"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            )}

            {pushToken && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Device Token</div>
                <div className="font-mono text-xs break-all">{pushToken}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {settings.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-poppins">
              <AJIcon icon={Settings} variant="navy" size="sm" hover={false} />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { key: 'projectUpdates', label: 'Project Updates', description: 'Status changes and milestones' },
                { key: 'taskReminders', label: 'Task Reminders', description: 'Upcoming deadlines and assignments' },
                { key: 'complianceAlerts', label: 'Compliance Alerts', description: 'Safety and regulatory notifications' },
                { key: 'safetyNotices', label: 'Safety Notices', description: 'Important safety information' },
                { key: 'systemMessages', label: 'System Messages', description: 'App updates and maintenance' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={key} className="font-medium">{label}</Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    id={key}
                    checked={settings[key as keyof NotificationSettings] as boolean}
                    onCheckedChange={(checked) => updateSetting(key as keyof NotificationSettings, checked)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.read ? 'bg-muted/30' : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.body}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {notification.timestamp.toLocaleString()}
                      </div>
                    </div>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}