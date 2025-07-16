import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Index from '@/pages/Index';

export const IndexWrapper = () => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] = useState(false);
  const [shouldRedirectToCSCS, setShouldRedirectToCSCS] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || !session) {
        setLoading(false);
        return;
      }

      try {
        const { data: userData, error } = await supabase
          .from('Users')
          .select('onboarding_completed, firstname, lastname, cscs_required, whalesync_postgres_id')
          .eq('supabase_auth_id', user.id)
          .single();

        if (error) {
          console.error('[IndexWrapper] Error fetching user data:', error);
          setLoading(false);
          return;
        }

        console.log('[IndexWrapper] User data:', userData);

        // Check if user needs to complete onboarding
        if (!userData.onboarding_completed || !userData.firstname || !userData.lastname) {
          console.log('[IndexWrapper] User needs onboarding, redirecting...');
          setShouldRedirectToOnboarding(true);
          setLoading(false);
          return;
        }

        // If onboarding is completed and CSCS is required, check for valid CSCS card
        if (userData.cscs_required) {
          console.log('[IndexWrapper] Checking CSCS status for onboarded user');
          // Query with both possible user ID references to handle Whalesync/Supabase mapping
          const { data: cscsCards, error: cscsError } = await supabase
            .from('cscs_cards')
            .select('*')
            .or(`user_id.eq.${user.id},user_id.eq.${userData.whalesync_postgres_id}`)
            .order('created_at', { ascending: false });

          console.log('[IndexWrapper] CSCS cards query result:', { cscsCards, cscsError, userAuthId: user.id, userWhalesyncId: userData.whalesync_postgres_id });

          const validCard = cscsCards?.find(card => {
            const expiryDate = new Date(card.expiry_date);
            return expiryDate > new Date();
          });

          if (!validCard) {
            console.log('[IndexWrapper] No valid CSCS card found, redirecting to CSCS upload');
            setShouldRedirectToCSCS(true);
            setLoading(false);
            return;
          }
        }

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

  if (shouldRedirectToCSCS) {
    return <Navigate to="/onboarding/cscs" replace />;
  }

  return <Index />;
};