
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/context/OnboardingContext';
import Index from '@/pages/Index';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';
import { toast } from 'sonner';

export const IndexWrapper = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { flags, isLoading: onboardingLoading, firstIncompleteStep, missingSteps } = useOnboarding();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasRouted, setHasRouted] = useState(false);

  // Combined loading state
  const isLoading = authLoading || onboardingLoading;

  useEffect(() => {
    console.log('[IndexWrapper] State update:', {
      isLoading,
      isNavigating,
      hasRouted,
      user: user?.id,
      userProfile: userProfile?.role,
      onboardingCompleted: userProfile?.onboarding_completed,
      flagsAllComplete: flags.allComplete,
      missingSteps: missingSteps.length
    });
  }, [isLoading, isNavigating, hasRouted, user, userProfile, flags.allComplete, missingSteps]);

  useEffect(() => {
    // Don't route if still loading, already navigating, already routed, or no user
    if (isLoading || isNavigating || hasRouted || !user) {
      return;
    }

    // Wait for userProfile to be available
    if (!userProfile) {
      console.log('[IndexWrapper] Waiting for userProfile...');
      return;
    }

    console.log('[IndexWrapper] Routing logic triggered:', {
      onboardingCompleted: userProfile.onboarding_completed,
      role: userProfile.role,
      flagsAllComplete: flags.allComplete,
      missingStepsCount: missingSteps.length
    });

    // **CRITICAL FIX**: Check onboarding_completed flag FIRST
    if (userProfile?.onboarding_completed === true) {
      console.log('[IndexWrapper] User onboarding completed, routing to role dashboard');
      
      // Role-based routing for completed users
      const role = userProfile?.role?.toLowerCase() || 'operative';
      console.log('[IndexWrapper] Determining route for role:', role);
      
      const roleToDashboard = {
        operative: '/operative',
        pm: '/projects',
        manager: '/projects', 
        director: '/director',
        admin: '/admin',
        dpo: '/admin'
      };
      
      const redirectPath = roleToDashboard[role] || '/operative';
      
      if (redirectPath !== '/') {
        setIsNavigating(true);
        setHasRouted(true);
        
        console.log('[IndexWrapper] Routing to:', redirectPath);
        toast.success("Welcome back—pipes flowing smoothly! 🔧");
        
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
          setTimeout(() => setIsNavigating(false), 100);
        }, 500);
        return;
      }
    }

    // Only redirect to onboarding if definitely incomplete
    if (!flags.allComplete && missingSteps.length > 0) {
      console.log('[IndexWrapper] User incomplete, redirecting to onboarding:', firstIncompleteStep);
      setIsNavigating(true);
      setHasRouted(true);
      toast.info("Almost there—let's plug those gaps! 🚰");
      
      setTimeout(() => {
        navigate(`/onboarding/${firstIncompleteStep}`, { replace: true });
        setTimeout(() => setIsNavigating(false), 100);
      }, 500);
    }
  }, [
    userProfile?.onboarding_completed, 
    userProfile?.role, 
    flags.allComplete, 
    missingSteps, 
    firstIncompleteStep, 
    isLoading, 
    isNavigating, 
    hasRouted,
    user, 
    navigate
  ]);

  if (isLoading || isNavigating) {
    const message = isNavigating 
      ? "Unclogging access..." 
      : userProfile 
        ? "Checking your profile..." 
        : "Loading your workspace...";
        
    return <FullScreenLoader message={message} />;
  }

  return <Index />;
};
