
import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OnboardingFlags {
  personalComplete: boolean;
  cscsComplete: boolean;
  emergencyComplete: boolean;
  ramsComplete: boolean;
  allComplete: boolean;
}

interface OnboardingContextType {
  flags: OnboardingFlags;
  isLoading: boolean;
  error: string | null;
  firstIncompleteStep: string;
  missingSteps: string[];
  refreshOnboarding: () => Promise<void>;
  markStepComplete: (step: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<OnboardingFlags>({
    personalComplete: false,
    cscsComplete: false,
    emergencyComplete: false,
    ramsComplete: false,
    allComplete: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const performOnboardingCheck = useCallback(async (retryCount = 0) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[OnboardingContext] Starting onboarding check for user:', user.id, 'retry:', retryCount);

      // Single comprehensive query to get all user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('supabase_auth_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('[OnboardingContext] Error fetching user:', userError);
        setError('Failed to fetch user data');
        return;
      }

      if (!userData) {
        // Retry logic for race condition where user profile isn't created yet
        if (retryCount < 3) {
          console.log('[OnboardingContext] No user found, retrying in 1000ms...', retryCount + 1);
          setTimeout(() => performOnboardingCheck(retryCount + 1), 1000);
          return;
        }

        console.log('[OnboardingContext] No user found in database after retries, creating profile');
        // Create user profile if it doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            supabase_auth_id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || '',
            firstname: user.user_metadata?.first_name || '',
            lastname: user.user_metadata?.last_name || '',
            role: 'Operative'
          })
          .select()
          .single();
        
        if (createError) {
          console.error('[OnboardingContext] Error creating user profile:', createError);
          setError('Failed to create user profile');
          return;
        }
        
        // Set all flags to false for new user - force personal details step
        setFlags({
          personalComplete: false,
          cscsComplete: false,
          emergencyComplete: false,
          ramsComplete: false,
          allComplete: false
        });
        return;
      }

      // **CRITICAL FIX**: Prioritize onboarding_completed database flag first
      if (userData.onboarding_completed === true) {
        console.log('[OnboardingContext] User has onboarding_completed=true, marking all complete');
        setFlags({
          personalComplete: true,
          cscsComplete: true,
          emergencyComplete: true,
          ramsComplete: true,
          allComplete: true
        });
        return;
      }

      // Only perform detailed validation if onboarding_completed is false/null
      console.log('[OnboardingContext] onboarding_completed=false/null, performing detailed validation');
      
      const userId = userData.id;

      // Check all related data in parallel
      const [cscsResult, emergencyResult, workTypesResult, signaturesResult] = await Promise.all([
        supabase
          .from('cscs_cards')
          .select('card_number, expiry_date, card_type, status')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('emergency_contacts')
          .select('name, phone, email, relationship')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_work_types')
          .select('work_type')
          .eq('user_id', userId),
        supabase
          .from('contractor_rams_signatures')
          .select('rams_document_id, is_current')
          .eq('contractor_id', userId)
          .eq('is_current', true)
      ]);

      // Enhanced personal completion check
      const personalComplete = !!(
        userData.firstname && 
        userData.lastname && 
        userData.phone &&
        userData.firstname.trim() !== '' &&
        userData.lastname.trim() !== '' &&
        userData.phone.trim() !== '' &&
        userData.firstname.length > 0 &&
        userData.lastname.length > 0 &&
        userData.phone.length >= 10
      );

      const cscsCard = cscsResult.data;
      const cscsComplete = !!(
        cscsCard && 
        cscsCard.card_number && 
        cscsCard.card_type && 
        cscsCard.expiry_date &&
        new Date(cscsCard.expiry_date) > new Date()
      );

      const emergencyContact = emergencyResult.data;
      const emergencyComplete = !!(
        emergencyContact &&
        emergencyContact.name &&
        emergencyContact.phone &&
        emergencyContact.email &&
        emergencyContact.relationship
      );

      const workTypes = workTypesResult.data || [];
      const signatures = signaturesResult.data || [];
      const ramsComplete = workTypes.length > 0 && signatures.length > 0;

      const allComplete = personalComplete && cscsComplete && emergencyComplete && ramsComplete;

      const newFlags = {
        personalComplete,
        cscsComplete,
        emergencyComplete,
        ramsComplete,
        allComplete
      };

      setFlags(newFlags);
      console.log('[OnboardingContext] Detailed validation flags:', newFlags);

      // If all complete but onboarding_completed is false, update it
      if (allComplete && !userData.onboarding_completed) {
        console.log('[OnboardingContext] Marking onboarding as completed in database');
        await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('id', userId);
      }

    } catch (error) {
      console.error('[OnboardingContext] Error in onboarding check:', error);
      setError('Unexpected error during onboarding check');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial check on mount and when user changes with debouncing
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set up debounced execution
    const timer = setTimeout(() => {
      performOnboardingCheck();
    }, 300);
    
    setDebounceTimer(timer);

    // Cleanup on unmount
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user]); // Only depend on user, not performOnboardingCheck to avoid loops

  const refreshOnboarding = useCallback(async () => {
    console.log('[OnboardingContext] Manual refresh triggered');
    await performOnboardingCheck();
  }, [performOnboardingCheck]);

  const markStepComplete = useCallback((step: string) => {
    console.log('[OnboardingContext] Marking step complete:', step);
    // Optimistically update the flag
    setFlags(prev => ({
      ...prev,
      [`${step}Complete`]: true
    }));
    
    // Refresh to get actual state after a brief delay
    setTimeout(() => {
      refreshOnboarding();
    }, 500);
  }, [refreshOnboarding]);

  // Compute derived values
  const missingSteps = useMemo(() => {
    const steps: string[] = [];
    if (!flags.personalComplete) steps.push('personal-details');
    if (!flags.cscsComplete) steps.push('cscs-card');
    if (!flags.emergencyComplete) steps.push('emergency-contact');
    if (!flags.ramsComplete) steps.push('work-types');
    return steps;
  }, [flags]);

  const firstIncompleteStep = useMemo(() => {
    return missingSteps[0] || 'complete';
  }, [missingSteps]);

  const value = useMemo(() => ({
    flags,
    isLoading,
    error,
    firstIncompleteStep,
    missingSteps,
    refreshOnboarding,
    markStepComplete
  }), [flags, isLoading, error, firstIncompleteStep, missingSteps, refreshOnboarding, markStepComplete]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
