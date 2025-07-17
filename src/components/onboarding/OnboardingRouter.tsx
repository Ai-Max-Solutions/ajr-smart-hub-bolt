import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboardingValidation } from '@/hooks/useOnboardingValidation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface OnboardingRouterProps {
  children: React.ReactNode;
}

export const OnboardingRouter = ({ children }: OnboardingRouterProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { stepStatus, isLoading, getFirstIncompleteStep } = useOnboardingValidation();

  useEffect(() => {
    if (!user || isLoading) return;

    // Get current path
    const currentPath = location.pathname.replace('/onboarding/', '');
    
    // If user has completed onboarding, redirect to dashboard
    if (stepStatus.completed) {
      console.log('[OnboardingRouter] User has completed onboarding, redirecting to dashboard');
      navigate('/', { replace: true });
      return;
    }

    // Get the step they should be on
    const targetStep = getFirstIncompleteStep();
    
    // If they're not on the correct step, redirect them
    if (currentPath !== targetStep && currentPath !== '') {
      console.log('[OnboardingRouter] Redirecting from', currentPath, 'to', targetStep);
      navigate(`/onboarding/${targetStep}`, { replace: true });
    }
  }, [user, isLoading, stepStatus, location.pathname, navigate, getFirstIncompleteStep]);

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