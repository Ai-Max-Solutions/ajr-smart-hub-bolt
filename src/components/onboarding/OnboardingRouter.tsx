import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface OnboardingRouterProps {
  children: React.ReactNode;
}

export const OnboardingRouter = ({ children }: OnboardingRouterProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { flags, isLoading, firstIncompleteStep } = useOnboarding();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigation = useCallback((path: string, reason: string) => {
    if (isNavigating) return;
    console.log(`[OnboardingRouter] ${reason}:`, path);
    setIsNavigating(true);
    navigate(path, { replace: true });
    
    // Reset navigation state after a short delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 100);
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
    
    // Sequential access validation - allow access to current target step
    const stepOrder = ['personal-details', 'cscs-card', 'emergency-contact', 'work-types'];
    const currentStepIndex = stepOrder.indexOf(currentPath);
    const targetStepIndex = stepOrder.indexOf(firstIncompleteStep);
    
    // Allow access if:
    // 1. User is on the correct target step
    // 2. User is on a completed step (going back)
    if (currentPath === firstIncompleteStep) {
      console.log('[OnboardingRouter] User is on correct step, allowing access');
      return;
    }
    
    // Only redirect if user tries to skip ahead or is on wrong incomplete step
    if (currentStepIndex > targetStepIndex) {
      handleNavigation(`/onboarding/${firstIncompleteStep}`, `Redirecting from ${currentPath} to correct step (skipped ahead)`);
    } else if (currentStepIndex < targetStepIndex && currentStepIndex !== -1) {
      // Allow going back to completed steps, but don't force navigation
      console.log('[OnboardingRouter] User accessing completed step, allowing');
    } else if (currentStepIndex === -1) {
      // Unknown step, redirect to correct one
      handleNavigation(`/onboarding/${firstIncompleteStep}`, `Redirecting from unknown step ${currentPath} to correct step`);
    }
  }, [user, isLoading, flags.allComplete, location.pathname, firstIncompleteStep, handleNavigation, isNavigating]);

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