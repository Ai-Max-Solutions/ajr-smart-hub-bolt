import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
        
        // Use separate queries for better reliability and debugging
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, name, phone, role, onboarding_completed')
          .eq('supabase_auth_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[IndexWrapper] Error fetching user data:', error);
          console.log('[IndexWrapper] Attempting to query all users with this auth ID...');
          
          // Debug: Check if user exists at all
          const { data: allUsers, error: debugError } = await supabase
            .from('users')
            .select('id,supabase_auth_id,name,onboarding_completed')
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

        // Get related data with separate queries for better debugging
        const [cscsResult, emergencyResult, ramsResult] = await Promise.all([
          supabase.from('cscs_cards').select('id').eq('user_id', userData.id),
          supabase.from('emergency_contacts').select('id').eq('user_id', userData.id),
          supabase.from('contractor_rams_signatures').select('id').eq('contractor_id', userData.id)
        ]);

        const cscsCards = cscsResult.data || [];
        const emergencyContacts = emergencyResult.data || [];
        const ramsSignatures = ramsResult.data || [];

        // Check for missing essential information with related records
        const missingSteps: string[] = [];
        
        console.log('[IndexWrapper] Checking onboarding status:');
        console.log('- Name:', !!userData.name);
        console.log('- Phone:', !!userData.phone);
        console.log('- CSCS Cards:', cscsCards.length);
        console.log('- Emergency Contacts:', emergencyContacts.length);
        console.log('- RAMS Signatures:', ramsSignatures.length);
        console.log('- Onboarding Completed:', userData.onboarding_completed);
        
        // Check personal details (basic user info)
        if (!userData.name || !userData.phone) {
          missingSteps.push('personal-details');
        }

        // Only check related records if basic info is complete
        if (userData.name && userData.phone) {
          // Check if CSCS card exists - this is saved in personal-details step
          if (cscsCards.length === 0) {
            missingSteps.push('personal-details');
          }
          
          // Check if emergency contact exists - this is also saved in personal-details step
          if (emergencyContacts.length === 0) {
            missingSteps.push('personal-details');
          }
          
          // Check if RAMS signatures exist - these are signed in work-types step
          if (ramsSignatures.length === 0) {
            missingSteps.push('work-types');
          }
        }

        // If all records exist but onboarding_completed is false, user needs to finish
        if (cscsCards.length > 0 && 
            emergencyContacts.length > 0 && 
            ramsSignatures.length > 0 && 
            !userData.onboarding_completed) {
          missingSteps.push('complete');
        }

        if (missingSteps.length > 0) {
          // Remove duplicates and get first missing step
          const uniqueSteps = [...new Set(missingSteps)];
          console.log('[IndexWrapper] User needs onboarding. Missing steps:', uniqueSteps);
          setOnboardingResult({
            needsOnboarding: true,
            redirectPath: `/onboarding/${uniqueSteps[0]}`,
            missingSteps: uniqueSteps
          });
        } else {
          console.log('[IndexWrapper] User has completed onboarding, proceeding to dashboard');
          // Always proceed to dashboard - blocking will be handled in the dashboard itself
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