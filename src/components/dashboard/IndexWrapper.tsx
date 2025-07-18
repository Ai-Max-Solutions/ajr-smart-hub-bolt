
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/context/OnboardingContext';
import Index from '@/pages/Index';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';
import { toast } from 'sonner';

export const IndexWrapper = () => {
  const { user, userProfile } = useAuth();
  const { flags, isLoading, firstIncompleteStep, missingSteps } = useOnboarding();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    console.log('[IndexWrapper] Flags updated:', flags);
    console.log('[IndexWrapper] Missing steps:', missingSteps);
    console.log('[IndexWrapper] User profile:', userProfile);
    console.log('[IndexWrapper] User profile role:', userProfile?.role);
    console.log('[IndexWrapper] User profile onboarding_completed:', userProfile?.onboarding_completed);
  }, [flags, missingSteps, userProfile]);

  useEffect(() => {
    if (isLoading || isNavigating || !user) return;

    // **CRITICAL FIX**: Check onboarding_completed flag FIRST
    if (userProfile?.onboarding_completed === true) {
      console.log('[IndexWrapper] User onboarding completed, routing to role dashboard');
      console.log('[IndexWrapper] User role for routing:', userProfile?.role);
      
      // Role-based routing for completed users
      const role = userProfile?.role?.toLowerCase() || 'operative';
      const roleToDashboard = {
        operative: '/operative',
        pm: '/projects',
        manager: '/projects', 
        supervisor: '/operative',
        director: '/director',
        admin: '/admin',
        dpo: '/admin'
      };
      
      const redirectPath = roleToDashboard[role] || '/operative';
      console.log('[IndexWrapper] Calculated redirect path:', redirectPath, 'for role:', role);
      
      if (redirectPath !== '/') {
        setIsNavigating(true);
        toast.success("Welcome back—pipes flowing smoothly! 🔧");
        
        setTimeout(() => {
          console.log('[IndexWrapper] Navigating to:', redirectPath);
          navigate(redirectPath, { replace: true });
          setTimeout(() => setIsNavigating(false), 100);
        }, 500);
        return;
      }
    }

    // Only redirect to onboarding if definitely incomplete
    if (!flags.allComplete && missingSteps.length > 0) {
      console.log('[IndexWrapper] User incomplete, redirecting to onboarding after delay:', firstIncompleteStep);
      setIsNavigating(true);
      toast.info("Almost there—let's plug those gaps! 🚰");
      
      setTimeout(() => {
        navigate(`/onboarding/${firstIncompleteStep}`, { replace: true });
        setTimeout(() => setIsNavigating(false), 100);
      }, 500);
    }
  }, [userProfile?.onboarding_completed, userProfile?.role, flags.allComplete, missingSteps, firstIncompleteStep, isLoading, isNavigating, user, navigate]);

  if (isLoading || isNavigating) {
    return <FullScreenLoader message={isNavigating ? "Unclogging access..." : "Checking your profile..."} />;
  }

  return <Index />;
};
