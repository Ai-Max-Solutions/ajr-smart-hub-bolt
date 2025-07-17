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
  refreshOnboarding: () => void;
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
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);

  const performOnboardingCheck = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Debounce: prevent multiple checks within 1 second
    const now = Date.now();
    if (now - lastCheckTime < 1000) {
      return;
    }
    setLastCheckTime(now);

    setIsLoading(true);
    setError(null);

    try {
      console.log('[OnboardingContext] Starting onboarding check for user:', user.id);

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
        console.log('[OnboardingContext] No user found in database');
        setFlags({
          personalComplete: false,
          cscsComplete: false,
          emergencyComplete: false,
          ramsComplete: false,
          allComplete: false
        });
        return;
      }

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

      // Compute completion flags
      const personalComplete = !!(
        userData.firstname && 
        userData.lastname && 
        userData.phone &&
        userData.firstname.trim() !== '' &&
        userData.lastname.trim() !== '' &&
        userData.phone.trim() !== ''
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
      console.log('[OnboardingContext] Flags updated:', newFlags);

      // If all complete but onboarding_completed is false, update it
      if (allComplete && !userData.onboarding_completed) {
        console.log('[OnboardingContext] Marking onboarding as completed');
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
  }, [user, lastCheckTime]);

  // Initial check on mount and when user changes
  useEffect(() => {
    performOnboardingCheck();
  }, [performOnboardingCheck]);

  const refreshOnboarding = useCallback(() => {
    setLastCheckTime(0); // Reset debounce
    performOnboardingCheck();
  }, [performOnboardingCheck]);

  const markStepComplete = useCallback((step: string) => {
    // Optimistically update the flag
    setFlags(prev => ({
      ...prev,
      [`${step}Complete`]: true
    }));
    
    // Refresh to get actual state
    setTimeout(() => {
      refreshOnboarding();
    }, 100);
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