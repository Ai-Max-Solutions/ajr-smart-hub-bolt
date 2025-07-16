
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import RealTimeChat from './RealTimeChat';
import { useAuth } from '@/hooks/useAuth';

const CollaborationHub = () => {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string>('project-1');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Collaboration Hub</h1>
          <p className="text-muted-foreground">
            Stay connected with your team and track project communications
          </p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Real-time Chat</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Chat</CardTitle>
              <CardDescription>
                Collaborate with your team in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealTimeChat projectId={selectedProject} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Stay updated on important project changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Notifications panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                Track all project activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Activity feed coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollaborationHub;
