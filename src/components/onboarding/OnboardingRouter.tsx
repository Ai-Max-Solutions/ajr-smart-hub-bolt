
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '@/context/OnboardingContext';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';

interface OnboardingRouterProps {
  children: React.ReactNode;
}

export const OnboardingRouter = ({ children }: OnboardingRouterProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { flags, isLoading, firstIncompleteStep } = useOnboarding();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const handleNavigation = useCallback((path: string, reason: string) => {
    if (isNavigating) return;
    console.log(`[OnboardingRouter] ${reason}:`, path);
    setIsNavigating(true);
    
    // Navigate immediately without delay
    navigate(path, { replace: true });
    
    // Reset navigation state after a brief delay
    setTimeout(() => setIsNavigating(false), 200);
  }, [navigate, isNavigating]);

  // Handle completion redirect
  useEffect(() => {
    if (!user || isLoading || isNavigating || !hasInitialized) return;

    if (flags.allComplete) {
      handleNavigation('/', 'User has completed onboarding, redirecting to dashboard');
    }
  }, [user, isLoading, flags.allComplete, handleNavigation, isNavigating, hasInitialized]);

  // Handle onboarding step routing
  useEffect(() => {
    if (!user || isLoading || isNavigating || flags.allComplete) return;

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
    
    // **CRITICAL FIX**: Only redirect if user is trying to skip steps or on wrong step
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
  }, [user, isLoading, flags, location.pathname, firstIncompleteStep, handleNavigation, isNavigating, hasInitialized]);

  if (!user || isLoading) {
    return <FullScreenLoader message="Checking onboarding status..." />;
  }

  if (isNavigating) {
    return <FullScreenLoader message="Redirecting..." />;
  }

  return <>{children}</>;
};
