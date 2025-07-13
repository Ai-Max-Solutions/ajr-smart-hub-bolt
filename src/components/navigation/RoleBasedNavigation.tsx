import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions, PermissionGate, DashboardGate } from '@/components/auth/RouteProtection';
import { 
  Shield, 
  Users, 
  Building2, 
  FileText, 
  Calendar, 
  Clock, 
  Settings, 
  UserCheck,
  HardHat,
  ClipboardList,
  TrendingUp,
  Database,
  Lock
} from 'lucide-react';

interface NavigationItem {
  title: string;
  description: string;
  path: string;
  icon: any;
  resource?: string;
  action?: string;
  roles?: string[];
  dashboard?: string;
  variant?: 'default' | 'admin' | 'director' | 'pm';
}

export const RoleBasedNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, hasPermission, canAccessDashboard } = usePermissions();

  const navigationItems: NavigationItem[] = [
    // Core operational dashboards
    {
      title: 'Operative Portal',
      description: 'Access your personal dashboard, timesheets, and documents',
      path: '/operative',
      icon: HardHat,
      resource: 'my_dashboard',
      roles: ['operative', 'supervisor', 'pm', 'admin', 'dpo'],
      variant: 'default'
    },
    {
      title: 'Project Management',
      description: 'Manage projects, teams, and site operations',
      path: '/projects',
      icon: Building2,
      resource: 'project_data',
      roles: ['pm', 'admin', 'dpo'],
      variant: 'pm'
    },
    {
      title: 'Director Dashboard',
      description: 'Executive overview of all projects and company metrics',
      path: '/director',
      icon: TrendingUp,
      dashboard: 'director_dashboard',
      roles: ['director', 'admin', 'dpo'],
      variant: 'director'
    },
    {
      title: 'Admin Dashboard',
      description: 'User management, security, and system administration',
      path: '/admin',
      icon: Shield,
      dashboard: 'admin_dashboard',
      roles: ['admin', 'dpo'],
      variant: 'admin'
    },

    // Specific functional areas
    {
      title: 'Onboarding',
      description: 'Complete your onboarding process and documentation',
      path: '/onboarding',
      icon: UserCheck,
      resource: 'onboarding',
      roles: ['operative', 'supervisor', 'pm', 'admin', 'dpo'],
      variant: 'default'
    },
    {
      title: 'Document Checker',
      description: 'Verify document status and compliance',
      path: '/check',
      icon: FileText,
      variant: 'default'
    }
  ];

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'admin':
        return 'border-destructive/20 bg-destructive/5 hover:border-destructive/40 hover:bg-destructive/10';
      case 'director':
        return 'border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10';
      case 'pm':
        return 'border-accent/20 bg-accent/5 hover:border-accent/40 hover:bg-accent/10';
      default:
        return 'border-border hover:border-primary/20 hover:bg-muted/50';
    }
  };

  const getIconColor = (variant: string) => {
    switch (variant) {
      case 'admin':
        return 'text-destructive';
      case 'director':
        return 'text-primary';
      case 'pm':
        return 'text-accent';
      default:
        return 'text-muted-foreground';
    }
  };

  const isAccessible = (item: NavigationItem) => {
    // Check role-based access
    if (item.roles && !item.roles.includes(userRole)) {
      return false;
    }

    // Check resource permission
    if (item.resource && !hasPermission(item.resource, item.action || 'read')) {
      return false;
    }

    // Check dashboard access
    if (item.dashboard && !canAccessDashboard(item.dashboard)) {
      return false;
    }

    return true;
  };

  const accessibleItems = navigationItems.filter(isAccessible);

  return (
    <div className="space-y-6">
      {/* User Role Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Available Dashboards</h2>
          <p className="text-muted-foreground">Select the area you want to access</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            <Lock className="w-3 h-3 mr-1" />
            {userRole}
          </Badge>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleItems.map((item) => {
          const Icon = item.icon;
          const isCurrentPath = location.pathname.startsWith(item.path);
          
          return (
            <Card 
              key={item.path}
              className={`card-hover cursor-pointer transition-all ${getVariantStyles(item.variant || 'default')} ${
                isCurrentPath ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-background border ${getIconColor(item.variant || 'default')}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      {item.description}
                    </p>
                    <Button 
                      variant={isCurrentPath ? "default" : "outline"} 
                      size="sm"
                      className="w-full"
                    >
                      {isCurrentPath ? 'Current' : 'Access'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Role-specific information */}
      <div className="mt-8 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">Role Permissions</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {userRole === 'operative' && (
            <p>You have access to your personal data, timesheets, and assigned project documents.</p>
          )}
          {userRole === 'supervisor' && (
            <p>You can manage your team's data and approve activities for your assigned projects.</p>
          )}
          {userRole === 'pm' && (
            <p>You have full project management access for your assigned projects, including team management and reporting.</p>
          )}
          {userRole === 'director' && (
            <p>You have read-only access to all company data for strategic oversight and reporting.</p>
          )}
          {(userRole === 'admin' || userRole === 'dpo') && (
            <p>You have full system access including user management, security controls, and data administration.</p>
          )}
        </div>
      </div>

      {/* Quick Actions for Admin/DPO */}
      {(userRole === 'admin' || userRole === 'dpo') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PermissionGate resource="user_management" action="read">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin')}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
          </PermissionGate>
          
          <PermissionGate resource="audit_logs" action="read">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin')}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              View Audit Logs
            </Button>
          </PermissionGate>
          
          <PermissionGate resource="security_dashboard" action="read">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin')}
            >
              <Shield className="w-4 h-4 mr-2" />
              Security Dashboard
            </Button>
          </PermissionGate>
        </div>
      )}
    </div>
  );
};

export default RoleBasedNavigation;