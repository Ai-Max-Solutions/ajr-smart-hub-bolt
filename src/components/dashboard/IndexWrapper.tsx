import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/context/OnboardingContext';
import Index from '@/pages/Index';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';

export const IndexWrapper = () => {
  const { user } = useAuth();
  const { flags, isLoading, firstIncompleteStep, missingSteps } = useOnboarding();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    console.log('[IndexWrapper] Flags updated:', flags);
    console.log('[IndexWrapper] Missing steps:', missingSteps);
  }, [flags, missingSteps]);

  useEffect(() => {
    if (isLoading || isNavigating || !user) return;

    // Only redirect if user is definitively incomplete - add 500ms delay to prevent flash
    if (!flags.allComplete && missingSteps.length > 0) {
      console.log('[IndexWrapper] User incomplete, redirecting to onboarding after delay:', firstIncompleteStep);
      setIsNavigating(true);
      
      setTimeout(() => {
        navigate(`/onboarding/${firstIncompleteStep}`, { replace: true });
        setTimeout(() => setIsNavigating(false), 100);
      }, 500);
    }
  }, [flags.allComplete, missingSteps, firstIncompleteStep, isLoading, isNavigating, user, navigate]);

  if (isLoading || isNavigating) {
    return <FullScreenLoader message={isNavigating ? "Redirecting to onboarding..." : "Checking your profile..."} />;
  }

  return <Index />;
};