import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserManagement } from "@/components/admin/UserManagement";
import { ProjectAccessControl } from "@/components/admin/ProjectAccessControl";
import { RetentionManagement } from "@/components/admin/RetentionManagement";
import { AuditLogsViewer } from "@/components/admin/AuditLogsViewer";
import { SecurityAlertsPanel } from "@/components/admin/SecurityAlertsPanel";
import { RBACService } from "@/lib/security";
import { Shield, Users, Settings, Archive, FileText, AlertTriangle } from "lucide-react";

const AdminDashboard = () => {
  // Mock current user role - in real app this would come from auth context
  const currentUserRole = "admin";
  
  // Check if user has admin access
  const hasAdminAccess = RBACService.hasPermission(currentUserRole, "admin", "read");
  
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access the Admin Dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <Badge variant="secondary" className="ml-2">
              Control Centre
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Secure user management, access control, and compliance oversight for AJ Ryan SmartWork Hub
          </p>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users & Roles
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Projects & Access
            </TabsTrigger>
            <TabsTrigger value="retention" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Retention & Archive
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Security Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <ProjectAccessControl />
          </TabsContent>

          <TabsContent value="retention" className="space-y-6">
            <RetentionManagement />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditLogsViewer />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityAlertsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;