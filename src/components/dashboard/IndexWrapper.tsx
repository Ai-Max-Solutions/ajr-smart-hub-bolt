import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Index from '@/pages/Index';

export const IndexWrapper = () => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || !session) {
        setLoading(false);
        return;
      }

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('name, phone')
          .eq('supabase_auth_id', user.id)
          .single();

        if (error) {
          console.error('[IndexWrapper] Error fetching user data:', error);
          setLoading(false);
          return;
        }

        console.log('[IndexWrapper] User data:', userData);

        // Check if user needs to complete onboarding (for now, skip onboarding)
        // if (!userData.name || !userData.phone) {
        //   console.log('[IndexWrapper] User needs onboarding, redirecting...');
        //   setShouldRedirectToOnboarding(true);
        // }

        setLoading(false);
      } catch (error) {
        console.error('[IndexWrapper] Error checking onboarding status:', error);
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (shouldRedirectToOnboarding) {
    return <Navigate to="/onboarding/personal-details" replace />;
  }

  return <Index />;
};