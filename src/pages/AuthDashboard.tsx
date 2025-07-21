import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/auth/UserManagement';
import { SessionManagement } from '@/components/auth/SessionManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Monitor, AlertTriangle } from 'lucide-react';

export default function AuthDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Authentication Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, sessions, and security settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">Phase 4: Auth & Security</Badge>
          <Badge variant="secondary">Enterprise</Badge>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>User Management</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>Session Management</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <SessionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}