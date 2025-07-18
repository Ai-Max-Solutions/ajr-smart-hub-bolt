
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuth } from '@/hooks/useAuth';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';
import { toast } from 'sonner';

interface OnboardingRouterProps {
  children: React.ReactNode;
}

export const OnboardingRouter = ({ children }: OnboardingRouterProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const { flags, isLoading, firstIncompleteStep } = useOnboarding();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const handleNavigation = useCallback((path: string, reason: string) => {
    if (isNavigating) return;
    console.log(`[OnboardingRouter] ${reason}:`, path);
    setIsNavigating(true);
    
    navigate(path, { replace: true });
    setTimeout(() => setIsNavigating(false), 200);
  }, [navigate, isNavigating]);

  // **NEW**: Guard against manual onboarding URL access for completed users
  useEffect(() => {
    if (!user || isLoading || isNavigating) return;

    // If user has completed onboarding, redirect them away from onboarding
    if (userProfile?.onboarding_completed === true) {
      const role = userProfile?.role?.toLowerCase() || 'operative';
      const roleToDashboard = {
        operative: '/operative',
        pm: '/projects',
        manager: '/projects',
        director: '/director', 
        admin: '/admin',
        dpo: '/admin'
      };
      
      const redirectPath = roleToDashboard[role] || '/';
      toast.success("Already done? Back to the flow! 🔧");
      handleNavigation(redirectPath, 'User already completed onboarding, redirecting to dashboard');
      return;
    }
  }, [user, userProfile?.onboarding_completed, userProfile?.role, isLoading, handleNavigation, isNavigating]);

  // Handle completion redirect
  useEffect(() => {
    if (!user || isLoading || isNavigating || !hasInitialized) return;

    if (flags.allComplete) {
      handleNavigation('/', 'User has completed onboarding, redirecting to dashboard');
    }
  }, [user, isLoading, flags.allComplete, handleNavigation, isNavigating, hasInitialized]);

  // Handle onboarding step routing
  useEffect(() => {
    if (!user || isLoading || isNavigating || flags.allComplete || userProfile?.onboarding_completed === true) return;

    // Mark as initialized after first load
    if (!hasInitialized && !isLoading) {
      setHasInitialized(true);
    }

    const currentPath = location.pathname.replace('/onboarding/', '');
    
    console.log('[OnboardingRouter] Current path:', currentPath, 'Target step:', firstIncompleteStep);
    console.log('[OnboardingRouter] Flags:', flags);
    
    // Allow base onboarding route to redirect
    if (currentPath === '' || currentPath === '/') {
      handleNavigation(`/onboarding/${firstIncompleteStep}`, 'Base route, redirecting to first incomplete step');
      return;
    }
    
    // Only redirect if user is trying to skip steps or on wrong step
    const stepOrder = ['personal-details', 'cscs-card', 'emergency-contact', 'work-types'];
    const currentStepIndex = stepOrder.indexOf(currentPath);
    const targetStepIndex = stepOrder.indexOf(firstIncompleteStep);
    
    // Allow access if user is on the correct target step
    if (currentPath === firstIncompleteStep) {
      console.log('[OnboardingRouter] User is on correct step, allowing access');
      return;
    }
    
    // Only redirect if user tries to skip ahead to an incomplete step
    if (currentStepIndex > targetStepIndex && targetStepIndex !== -1) {
      console.log('[OnboardingRouter] User tried to skip ahead, redirecting to:', firstIncompleteStep);
      handleNavigation(`/onboarding/${firstIncompleteStep}`, `Redirecting from ${currentPath} to correct step (skipped ahead)`);
    } else if (currentStepIndex === -1 && targetStepIndex !== -1) {
      // Unknown step, redirect to correct one
      console.log('[OnboardingRouter] Unknown step, redirecting to:', firstIncompleteStep);
      handleNavigation(`/onboarding/${firstIncompleteStep}`, `Redirecting from unknown step ${currentPath} to correct step`);
    } else {
      // Allow going back to completed steps
      console.log('[OnboardingRouter] User accessing completed or valid step, allowing');
    }
  }, [user, isLoading, flags, location.pathname, firstIncompleteStep, handleNavigation, isNavigating, hasInitialized, userProfile?.onboarding_completed]);

  if (!user || isLoading) {
    return <FullScreenLoader message="Checking onboarding status..." />;
  }

  if (isNavigating) {
    return <FullScreenLoader message="Redirecting..." />;
  }

  return <>{children}</>;
};
