import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalOnboardingCheck } from '@/hooks/useGlobalOnboardingCheck';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingRouterProps {
  children: React.ReactNode;
}

export const OnboardingRouter = ({ children }: OnboardingRouterProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { flags, isLoading, firstIncompleteStep, redirectToMissingStep } = useGlobalOnboardingCheck();

  useEffect(() => {
    if (!user || isLoading) return;

    // Get current path
    const currentPath = location.pathname.replace('/onboarding/', '');
    
    // If user has completed onboarding, redirect to dashboard
    if (flags.allComplete) {
      console.log('[OnboardingRouter] User has completed onboarding, redirecting to dashboard');
      navigate('/', { replace: true });
      return;
    }

    console.log('[OnboardingRouter] Current path:', currentPath, 'Target step:', firstIncompleteStep);
    console.log('[OnboardingRouter] Flags:', flags);
    
    // Allow base onboarding route to redirect
    if (currentPath === '' || currentPath === '/') {
      console.log('[OnboardingRouter] Base route, redirecting to', firstIncompleteStep);
      navigate(`/onboarding/${firstIncompleteStep}`, { replace: true });
      return;
    }
    
    // Check if current step is appropriate
    const redirectPath = redirectToMissingStep(location.pathname);
    if (redirectPath) {
      console.log('[OnboardingRouter] Redirecting from', currentPath, 'to', firstIncompleteStep);
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, flags, location.pathname, navigate, firstIncompleteStep, redirectToMissingStep]);

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