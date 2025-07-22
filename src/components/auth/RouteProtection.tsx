import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { RBACService } from '@/lib/security';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { CSCSAccessGate } from '@/components/auth/CSCSAccessGate';

interface RouteProtectionProps {
  children: ReactNode;
  requiredRole?: string[];
  requiredResource?: string;
  requiredAction?: string;
  fallbackPath?: string;
  showAccessDenied?: boolean;
  requireCSCS?: boolean;
}

// User interface imported from userContext

export const RouteProtection = ({
  children,
  requiredRole = [],
  requiredResource,
  requiredAction = 'read',
  fallbackPath = '/auth',
  showAccessDenied = true,
  requireCSCS = true
}: RouteProtectionProps) => {
  const location = useLocation();
  const { user, session, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  
  // Show loading spinner while auth is loading
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no session, redirect to auth page
  if (!session || !user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Get user role from profile
  const userRole = profile?.role?.toLowerCase() || 'operative';
  
  // Check role-based access
  const hasRequiredRole = requiredRole.length === 0 || requiredRole.includes(userRole);
  
  // Check resource-based access (simplified for now)
  const hasResourceAccess = !requiredResource || true; // TODO: Implement proper resource access

  // Check dashboard access for special dashboard routes
  let hasDashboardAccess = true;
  if (location.pathname.includes('/admin')) {
    hasDashboardAccess = RBACService.canAccessDashboard(userRole as any, 'admin_dashboard');
  } else if (location.pathname.includes('/director')) {
    hasDashboardAccess = RBACService.canAccessDashboard(userRole as any, 'director_dashboard');
  } else if (location.pathname.includes('/projects') && location.pathname.includes('dashboard')) {
    hasDashboardAccess = RBACService.canAccessDashboard(userRole as any, 'pm_dashboard');
  }

  const hasAccess = hasRequiredRole && hasResourceAccess && hasDashboardAccess;

  // Skip CSCS check for onboarding, auth, and CSCS routes
  const skipCSCSCheck = location.pathname.startsWith('/onboarding') || 
                       location.pathname.startsWith('/auth') ||
                       location.pathname === '/onboarding/cscs';

  // If access is denied, show access denied page or redirect
  if (!hasAccess) {
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
              Your current role ({userRole}) doesn't have access to this area. 
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

  // Wrap children with CSCS access gate if required
  if (requireCSCS && !skipCSCSCheck) {
    return (
      <CSCSAccessGate>
        {children}
      </CSCSAccessGate>
    );
  }

  return <>{children}</>;
};

// Hook for checking permissions in components
export const usePermissions = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  
  const userRole = profile?.role?.toLowerCase() || 'operative';

  const hasPermission = (resource: string, action: string = 'read', context?: any) => {
    if (!profile) return false;
    
    // Admin and DPO have access to everything
    if (profile.role === 'Admin' || profile.system_role === 'Admin') return true;
    
    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'admin': ['user_management', 'audit_logs', 'security_dashboard', 'project_data', 'my_dashboard', 'onboarding'],
      'dpo': ['user_management', 'audit_logs', 'security_dashboard', 'project_data', 'my_dashboard', 'onboarding'], 
      'director': ['project_data', 'my_dashboard', 'onboarding'],
      'project manager': ['project_data', 'team_management', 'my_dashboard', 'onboarding'],
      'pm': ['project_data', 'team_management', 'my_dashboard', 'onboarding'],
      'supervisor': ['team_data', 'my_dashboard', 'onboarding'],
      'site supervisor': ['team_data', 'my_dashboard', 'onboarding'],
      'operative': ['my_dashboard', 'onboarding'],
      'worker': ['my_dashboard', 'onboarding']
    };
    
    const permissions = rolePermissions[userRole] || ['my_dashboard', 'onboarding'];
    return permissions.includes(resource);
  };

  const canAccessDashboard = (dashboard: string) => {
    if (!profile) return false;
    
    // Define role-based dashboard access
    const roleDashboards: Record<string, string[]> = {
      'admin': ['admin_dashboard', 'director_dashboard', 'pm_dashboard', 'supervisor_dashboard'],
      'dpo': ['admin_dashboard', 'director_dashboard', 'pm_dashboard', 'supervisor_dashboard'],
      'director': ['director_dashboard'],
      'project manager': ['pm_dashboard'],
      'pm': ['pm_dashboard'],
      'supervisor': ['supervisor_dashboard'],
      'site supervisor': ['supervisor_dashboard'],
      'operative': [],
      'worker': []
    };
    
    const dashboards = roleDashboards[userRole] || [];
    return dashboards.includes(dashboard);
  };

  const canManageRole = (targetRole: string) => {
    return RBACService.canManageRole(userRole as any, targetRole as any);
  };

  return {
    user: profile,
    userRole,
    hasPermission,
    canAccessDashboard,
    canManageRole,
    roleLevel: RBACService.getRoleLevel(userRole as any)
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
