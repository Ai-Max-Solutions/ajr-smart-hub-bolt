
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';

type AllowedRoles = "Operative" | "Supervisor" | "PM" | "Manager" | "Admin" | "Director" | "DPO";

interface WithRoleGuardProps {
  children: ReactNode;
  allowedRoles: AllowedRoles[];
  fallbackPath?: string;
  showFunnyMessage?: boolean;
}

export const withRoleGuard = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: AllowedRoles[],
  fallbackPath: string = '/auth'
) => {
  return function GuardedComponent(props: P) {
    const { user, session, loading } = useAuth();
    const { profile, loading: profileLoading } = useUserProfile();
    
    if (loading || profileLoading) {
      return (
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!session || !user || !profile) {
      return <Navigate to={fallbackPath} replace />;
    }

    const userRole = profile?.role?.toLowerCase() || 'operative';
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    
    if (!normalizedAllowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <Shield className="mx-auto h-16 w-16 text-destructive" />
              <h1 className="mt-4 text-3xl font-bold text-primary">Wrong Tool for the Job!</h1>
              <p className="mt-2 text-muted-foreground">
                Oi mate! You're trying to use a wrench on a pipe fitting. 
                Your current role ({userRole}) can't access this area.
              </p>
            </div>

            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Access blocked tighter than a well-fitted joint! 
                Required role(s): {allowedRoles.join(', ')}. 
                Don't worry - no leaks in our security system!
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.history.back()} 
                className="w-full"
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Safe Waters
              </Button>
              <Button 
                onClick={() => window.location.href = '/'} 
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>If this seems like a plumbing error, contact your site supervisor! 🔧</p>
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

// Direct component version for inline use
export const RoleGuard = ({ children, allowedRoles, fallbackPath = '/auth', showFunnyMessage = true }: WithRoleGuardProps) => {
  const { user, session, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !user || !profile) {
    return <Navigate to={fallbackPath} replace />;
  }

  const userRole = profile?.role?.toLowerCase() || 'operative';
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
  
  if (!normalizedAllowedRoles.includes(userRole)) {
    if (!showFunnyMessage) {
      return <Navigate to={fallbackPath} replace />;
    }

    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-destructive" />
            <h1 className="mt-4 text-3xl font-bold text-primary">No Leaks in Our Security!</h1>
            <p className="mt-2 text-muted-foreground">
              Sorry mate, wrong pipe for this job. Your access level ({userRole}) 
              doesn't have the right fittings for this area.
            </p>
          </div>

          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Sealed tighter than a compression joint! 
              Required access: {allowedRoles.join(', ')}.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={() => window.history.back()} 
            className="w-full"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Your Toolbox
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
