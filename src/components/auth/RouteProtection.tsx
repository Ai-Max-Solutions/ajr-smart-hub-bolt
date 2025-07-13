import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RBACService, AuditLogService } from '@/lib/security';
import { UserContextService, User } from '@/lib/userContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

interface RouteProtectionProps {
  children: ReactNode;
  requiredRole?: string[];
  requiredResource?: string;
  requiredAction?: string;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

// User interface imported from userContext

export const RouteProtection = ({
  children,
  requiredRole = [],
  requiredResource,
  requiredAction = 'read',
  fallbackPath = '/',
  showAccessDenied = true
}: RouteProtectionProps) => {
  const location = useLocation();
  
  // Get current user from context service
  const currentUser: User = UserContextService.getCurrentUser();

  // Check role-based access
  const hasRequiredRole = requiredRole.length === 0 || requiredRole.includes(currentUser.role);
  
  // Check resource-based access
  const hasResourceAccess = !requiredResource || RBACService.hasPermission(
    currentUser.role,
    requiredResource,
    requiredAction,
    {
      userId: currentUser.id,
      requestingUserId: currentUser.id,
      userProjects: currentUser.projects,
      userTeams: currentUser.teams
    }
  );

  // Check dashboard access for special dashboard routes
  let hasDashboardAccess = true;
  if (location.pathname.includes('/admin')) {
    hasDashboardAccess = RBACService.canAccessDashboard(currentUser.role, 'admin_dashboard');
  } else if (location.pathname.includes('/director')) {
    hasDashboardAccess = RBACService.canAccessDashboard(currentUser.role, 'director_dashboard');
  } else if (location.pathname.includes('/projects') && location.pathname.includes('dashboard')) {
    hasDashboardAccess = RBACService.canAccessDashboard(currentUser.role, 'pm_dashboard');
  }

  const hasAccess = hasRequiredRole && hasResourceAccess && hasDashboardAccess;

  // Log access attempt for security monitoring
  if (!hasAccess) {
    AuditLogService.log({
      userId: currentUser.id,
      action: 'access',
      resource: requiredResource || location.pathname,
      resourceId: location.pathname,
      ipAddress: 'unknown', // In production, get real IP
      userAgent: navigator.userAgent,
      success: false,
      details: { 
        reason: 'Access denied',
        requiredRole,
        userRole: currentUser.role,
        requiredResource,
        requiredAction
      }
    });

    if (!showAccessDenied) {
      return <Navigate to={fallbackPath} replace state={{ from: location }} />;
    }

    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-destructive" />
            <h1 className="mt-4 text-3xl font-bold text-primary">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              You don't have permission to access this resource.
            </p>
          </div>

          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your current role ({currentUser.role}) doesn't have access to this area. 
              {requiredRole.length > 0 && (
                <span> Required role(s): {requiredRole.join(', ')}</span>
              )}
              {requiredResource && (
                <span> Required permission: {requiredAction} access to {requiredResource}</span>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => window.history.back()} 
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button 
              onClick={() => window.location.href = fallbackPath} 
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>If you believe this is an error, please contact your administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook for checking permissions in components
export const usePermissions = () => {
  // Get current user from context service
  const currentUser: User = UserContextService.getCurrentUser();

  const hasPermission = (resource: string, action: string = 'read', context?: any) => {
    const hasAccess = RBACService.hasPermission(
      currentUser.role,
      resource,
      action,
      {
        userId: currentUser.id,
        requestingUserId: currentUser.id,
        userProjects: currentUser.projects,
        userTeams: currentUser.teams,
        ...context
      }
    );

    // Log permission check for security monitoring
    AuditLogService.log({
      userId: currentUser.id,
      action: 'access',
      resource,
      ipAddress: 'unknown', // In production, get real IP
      userAgent: navigator.userAgent,
      success: hasAccess,
      details: { action, context }
    });

    return hasAccess;
  };

  const canAccessDashboard = (dashboard: string) => {
    return RBACService.canAccessDashboard(currentUser.role, dashboard);
  };

  const canManageRole = (targetRole: string) => {
    return RBACService.canManageRole(currentUser.role, targetRole);
  };

  return {
    currentUser,
    hasPermission,
    canAccessDashboard,
    canManageRole,
    roleLevel: RBACService.getRoleLevel(currentUser.role),
    userProjects: UserContextService.getUserProjects(currentUser.id),
    userTeams: UserContextService.getUserTeams(currentUser.id)
  };
};

// Component wrapper for conditional rendering based on permissions
interface PermissionGateProps {
  children: ReactNode;
  resource: string;
  action?: string;
  fallback?: ReactNode;
  context?: any;
}

export const PermissionGate = ({ 
  children, 
  resource, 
  action = 'read', 
  fallback = null, 
  context 
}: PermissionGateProps) => {
  const { hasPermission } = usePermissions();
  
  if (hasPermission(resource, action, context)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

// Dashboard-specific access control
interface DashboardGateProps {
  children: ReactNode;
  dashboard: string;
  fallback?: ReactNode;
}

export const DashboardGate = ({ children, dashboard, fallback = null }: DashboardGateProps) => {
  const { canAccessDashboard } = usePermissions();
  
  if (canAccessDashboard(dashboard)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};