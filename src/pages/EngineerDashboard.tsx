import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, ClipboardList, FileText, AlertTriangle, Trophy, QrCode, Mic } from 'lucide-react';
import { TasksTab } from '@/components/engineer-tools/TasksTab';
import { DrawingRegisterTab } from '@/components/engineer-tools/DrawingRegisterTab';
import { RFITab } from '@/components/engineer-tools/RFITab';
import { SnagsTab } from '@/components/engineer-tools/SnagsTab';
import { ProgressTab } from '@/components/engineer-tools/ProgressTab';

export default function EngineerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the Engineer Dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Engineer Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.email}. Track your tasks, manage RFIs, and monitor project progress.
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            Scan QR
          </Button>
          <Button variant="outline" size="sm">
            <Mic className="h-4 w-4 mr-2" />
            Voice Note
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open RFIs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">1 overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Snags</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">2 high priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            My Tasks
          </TabsTrigger>
          <TabsTrigger value="drawings" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Drawings
          </TabsTrigger>
          <TabsTrigger value="rfis" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            RFIs
          </TabsTrigger>
          <TabsTrigger value="snags" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Snags
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <TasksTab />
        </TabsContent>

        <TabsContent value="drawings" className="space-y-4">
          <DrawingRegisterTab />
        </TabsContent>

        <TabsContent value="rfis" className="space-y-4">
          <RFITab />
        </TabsContent>

        <TabsContent value="snags" className="space-y-4">
          <SnagsTab />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <ProgressTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}