import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalOnboardingCheck } from '@/hooks/useGlobalOnboardingCheck';
import Index from '@/pages/Index';
import { Loader2 } from 'lucide-react';

export const IndexWrapper = () => {
  const { user } = useAuth();
  const { flags, isLoading, firstIncompleteStep, missingSteps } = useGlobalOnboardingCheck();

  useEffect(() => {
    // The global check hook handles all the logic now
    console.log('[IndexWrapper] Flags updated:', flags);
    console.log('[IndexWrapper] Missing steps:', missingSteps);
  }, [flags, missingSteps]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking your profile...</p>
        </div>
      </div>
    );
  }

  // If any onboarding step is incomplete, redirect to first incomplete step
  if (!flags.allComplete && missingSteps.length > 0) {
    console.log('[IndexWrapper] Redirecting to onboarding:', firstIncompleteStep);
    return <Navigate to={`/onboarding/${firstIncompleteStep}`} replace />;
  }

  return <Index />;
};