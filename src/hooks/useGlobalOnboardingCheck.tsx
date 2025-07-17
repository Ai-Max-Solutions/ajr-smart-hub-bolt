import { useState, useEffect, useMemo, useCallback } from 'react';
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

export interface GlobalOnboardingCheckResult {
  flags: OnboardingFlags;
  isLoading: boolean;
  error: string | null;
  firstIncompleteStep: string;
  missingSteps: string[];
}

export const useGlobalOnboardingCheck = () => {
  const { user } = useAuth();
  const [result, setResult] = useState<GlobalOnboardingCheckResult>({
    flags: {
      personalComplete: false,
      cscsComplete: false,
      emergencyComplete: false,
      ramsComplete: false,
      allComplete: false
    },
    isLoading: true,
    error: null,
    firstIncompleteStep: 'personal-details',
    missingSteps: []
  });

  const performGlobalCheck = useCallback(async () => {
    if (!user) {
      setResult(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setResult(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('[GlobalCheck] Starting comprehensive onboarding check for user:', user.id);

      // Get all user data in a single comprehensive query
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('supabase_auth_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('[GlobalCheck] Error fetching user:', userError);
        setResult(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to fetch user data',
          firstIncompleteStep: 'personal-details',
          missingSteps: ['personal-details']
        }));
        return;
      }

      if (!userData) {
        console.log('[GlobalCheck] No user found in database');
        setResult(prev => ({ 
          ...prev, 
          isLoading: false,
          firstIncompleteStep: 'personal-details',
          missingSteps: ['personal-details', 'cscs-card', 'emergency-contact', 'work-types']
        }));
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
      
      // For RAMS completion, check if work types are selected and signed
      const ramsComplete = workTypes.length > 0 && signatures.length > 0;

      const allComplete = personalComplete && cscsComplete && emergencyComplete && ramsComplete;

      // Determine missing steps and first incomplete
      const missingSteps: string[] = [];
      if (!personalComplete) missingSteps.push('personal-details');
      if (!cscsComplete) missingSteps.push('cscs-card');
      if (!emergencyComplete) missingSteps.push('emergency-contact');
      if (!ramsComplete) missingSteps.push('work-types');

      const firstIncompleteStep = missingSteps[0] || 'complete';

      const flags: OnboardingFlags = {
        personalComplete,
        cscsComplete,
        emergencyComplete,
        ramsComplete,
        allComplete
      };

      console.log('[GlobalCheck] Completion flags:', flags);
      console.log('[GlobalCheck] Missing steps:', missingSteps);
      console.log('[GlobalCheck] First incomplete step:', firstIncompleteStep);

      // If all complete but onboarding_completed is false, update it
      if (allComplete && !userData.onboarding_completed) {
        console.log('[GlobalCheck] Marking onboarding as completed in database');
        const { error: updateError } = await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('id', userId);

        if (updateError) {
          console.error('[GlobalCheck] Error updating onboarding completion:', updateError);
        } else {
          console.log('[GlobalCheck] Successfully marked onboarding as completed');
        }
      }

      setResult({
        flags,
        isLoading: false,
        error: null,
        firstIncompleteStep,
        missingSteps
      });

    } catch (error) {
      console.error('[GlobalCheck] Error in global onboarding check:', error);
      setResult(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Unexpected error during onboarding check',
        firstIncompleteStep: 'personal-details',
        missingSteps: ['personal-details']
      }));
    }
  }, [user]);

  useEffect(() => {
    performGlobalCheck();
  }, [performGlobalCheck]);

  const redirectToMissingStep = useCallback((currentPath: string) => {
    if (result.missingSteps.length > 0) {
      const targetStep = result.firstIncompleteStep;
      if (currentPath !== `/onboarding/${targetStep}`) {
        console.log('[GlobalCheck] Redirecting from', currentPath, 'to', targetStep);
        toast.error(`Please complete: ${targetStep.replace('-', ' ')}`);
        return `/onboarding/${targetStep}`;
      }
    }
    return null;
  }, [result.missingSteps, result.firstIncompleteStep]);

  const memoizedResult = useMemo(() => ({
    ...result,
    performGlobalCheck,
    redirectToMissingStep
  }), [result, performGlobalCheck, redirectToMissingStep]);

  return memoizedResult;
};