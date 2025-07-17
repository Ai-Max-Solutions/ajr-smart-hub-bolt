import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Index from '@/pages/Index';

interface OnboardingCheckResult {
  needsOnboarding: boolean;
  redirectPath: string;
  missingSteps: string[];
}

export const IndexWrapper = () => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingCheckResult | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || !session) {
        setLoading(false);
        return;
      }

      try {
        console.log('[IndexWrapper] Checking onboarding status for user:', user.id);
        console.log('[IndexWrapper] User email:', user.email);
        
        const { data: userData, error } = await supabase
          .from('users')
          .select('name, phone, role, onboarding_completed')
          .eq('supabase_auth_id', user.id)
          .single();

        if (error) {
          console.error('[IndexWrapper] Error fetching user data:', error);
          console.log('[IndexWrapper] Attempting to query all users with this auth ID...');
          
          // Debug: Check if user exists at all
          const { data: allUsers, error: debugError } = await supabase
            .from('users')
            .select('id, supabase_auth_id, name, onboarding_completed')
            .eq('supabase_auth_id', user.id);
            
          console.log('[IndexWrapper] Debug query result:', allUsers, debugError);
          
          // If user doesn't exist in users table, they definitely need onboarding
          setOnboardingResult({
            needsOnboarding: true,
            redirectPath: '/onboarding/personal-details',
            missingSteps: ['personal-details', 'emergency-contact', 'cscs-card']
          });
          setLoading(false);
          return;
        }

        console.log('[IndexWrapper] User data found:', userData);

        // Check for missing essential information
        const missingSteps: string[] = [];
        
        // Check personal details
        if (!userData.name || !userData.phone) {
          missingSteps.push('personal-details');
        }

        // Check if user has completed full onboarding using database field
        console.log('[IndexWrapper] Database onboarding_completed:', userData.onboarding_completed);
        
        if (!userData.onboarding_completed && userData.name) {
          // User has basic info but hasn't completed full onboarding flow
          console.log('[IndexWrapper] User has name but onboarding_completed=false in database');
          missingSteps.push('emergency-contact', 'cscs-card', 'work-types');
        }

        if (missingSteps.length > 0) {
          console.log('[IndexWrapper] User needs onboarding. Missing steps:', missingSteps);
          setOnboardingResult({
            needsOnboarding: true,
            redirectPath: `/onboarding/${missingSteps[0]}`,
            missingSteps
          });
        } else {
          console.log('[IndexWrapper] User has completed onboarding');
          setOnboardingResult({
            needsOnboarding: false,
            redirectPath: '',
            missingSteps: []
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('[IndexWrapper] Error checking onboarding status:', error);
        // On error, assume onboarding is needed to be safe
        setOnboardingResult({
          needsOnboarding: true,
          redirectPath: '/onboarding/personal-details',
          missingSteps: ['personal-details']
        });
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your profile...</p>
        </div>
      </div>
    );
  }

  if (onboardingResult?.needsOnboarding) {
    console.log('[IndexWrapper] Redirecting to onboarding:', onboardingResult.redirectPath);
    return <Navigate to={onboardingResult.redirectPath} replace />;
  }

  return <Index />;
};