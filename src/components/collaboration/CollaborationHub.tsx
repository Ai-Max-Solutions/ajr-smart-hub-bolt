import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import RealTimeChat from './RealTimeChat';
import NotificationPanel from './NotificationPanel';
import UserPresenceIndicator from './UserPresenceIndicator';
import { MessageCircle, Bell, Users, Settings } from 'lucide-react';

interface CollaborationHubProps {
  className?: string;
}

const CollaborationHub: React.FC<CollaborationHubProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboration Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="presence" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Status
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4">
              <RealTimeChat />
            </TabsContent>

            <TabsContent value="notifications" className="mt-4">
              <NotificationPanel />
            </TabsContent>

            <TabsContent value="presence" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <UserPresenceIndicator />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Collaboration Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Push Notifications</h4>
                        <Button variant="outline" size="sm">
                          Enable Push Notifications
                        </Button>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Status Settings</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm">Online</Button>
                          <Button variant="outline" size="sm">Away</Button>
                          <Button variant="outline" size="sm">Busy</Button>
                          <Button variant="outline" size="sm">Offline</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaborationHub;