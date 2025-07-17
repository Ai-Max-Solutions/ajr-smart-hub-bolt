import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalOnboardingCheck } from '@/hooks/useGlobalOnboardingCheck';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface OnboardingRouterProps {
  children: React.ReactNode;
}

export const OnboardingRouter = ({ children }: OnboardingRouterProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { flags, isLoading, firstIncompleteStep } = useGlobalOnboardingCheck();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigation = useCallback((path: string, reason: string) => {
    if (isNavigating) return;
    console.log(`[OnboardingRouter] ${reason}:`, path);
    setIsNavigating(true);
    navigate(path, { replace: true });
  }, [navigate, isNavigating]);

  // Handle completion redirect
  useEffect(() => {
    if (!user || isLoading || isNavigating) return;

    if (flags.allComplete) {
      handleNavigation('/', 'User has completed onboarding, redirecting to dashboard');
    }
  }, [user, isLoading, flags.allComplete, handleNavigation, isNavigating]);

  // Handle onboarding step routing
  useEffect(() => {
    if (!user || isLoading || isNavigating || flags.allComplete) return;

    const currentPath = location.pathname.replace('/onboarding/', '');
    
    console.log('[OnboardingRouter] Current path:', currentPath, 'Target step:', firstIncompleteStep);
    console.log('[OnboardingRouter] Flags:', flags);
    
    // Allow base onboarding route to redirect
    if (currentPath === '' || currentPath === '/') {
      handleNavigation(`/onboarding/${firstIncompleteStep}`, 'Base route, redirecting to first incomplete step');
      return;
    }
    
    // Check if current step is appropriate - only redirect if user is on wrong step
    if (currentPath !== firstIncompleteStep) {
      handleNavigation(`/onboarding/${firstIncompleteStep}`, `Redirecting from ${currentPath} to correct step`);
    }
  }, [user, isLoading, flags, location.pathname, firstIncompleteStep, handleNavigation, isNavigating]);

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking onboarding status...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};