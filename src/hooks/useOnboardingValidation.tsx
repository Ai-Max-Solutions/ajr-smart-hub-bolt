import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingStepStatus {
  personal: boolean;
  cscs: boolean;
  emergency: boolean;
  rams: boolean;
  completed: boolean;
}

export const useOnboardingValidation = () => {
  const { user } = useAuth();
  const [stepStatus, setStepStatus] = useState<OnboardingStepStatus>({
    personal: false,
    cscs: false,
    emergency: false,
    rams: false,
    completed: false
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkCompletionStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Validation] Checking completion status for user:', user.id);

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, onboarding_completed, name, phone')
        .eq('supabase_auth_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('[Validation] Error fetching user:', userError);
        setIsLoading(false);
        return;
      }

      if (!userData) {
        console.log('[Validation] No user found in database');
        setStepStatus({
          personal: false,
          cscs: false,
          emergency: false,
          rams: false,
          completed: false
        });
        setIsLoading(false);
        return;
      }

      const userId = userData.id;

      // Check personal details (name exists and is meaningful)
      const personalComplete = userData.name && userData.name.trim() !== '' && userData.name !== 'User';

      // Check CSCS card
      const { data: cscsCard } = await supabase
        .from('cscs_cards')
        .select('card_number, expiry_date, card_type')
        .eq('user_id', userId)
        .maybeSingle();

      const cscsComplete = cscsCard && 
        cscsCard.card_number && 
        cscsCard.card_type && 
        cscsCard.expiry_date &&
        new Date(cscsCard.expiry_date) > new Date();

      // Check emergency contact
      const { data: emergencyContact } = await supabase
        .from('emergency_contacts')
        .select('name, phone, email, relationship')
        .eq('user_id', userId)
        .maybeSingle();

      const emergencyComplete = emergencyContact &&
        emergencyContact.name &&
        emergencyContact.phone &&
        emergencyContact.email &&
        emergencyContact.relationship;

      // Check RAMS signatures
      const { data: workTypes } = await supabase
        .from('user_work_types')
        .select('work_type')
        .eq('user_id', userId);

      const selectedWorkTypes = workTypes?.map(wt => wt.work_type) || [];

      let ramsComplete = true; // Default to true if no work types selected
      
      if (selectedWorkTypes.length > 0) {
        // Get required RAMS documents
        const { data: requiredDocs } = await supabase
          .from('rams_documents')
          .select('id, work_types')
          .eq('is_active', true);

        const requiredDocIds = new Set<string>();
        requiredDocs?.forEach(doc => {
          if (doc.work_types.some(wt => selectedWorkTypes.includes(wt))) {
            requiredDocIds.add(doc.id);
          }
        });

        // Get signed documents
        const { data: signatures } = await supabase
          .from('contractor_rams_signatures')
          .select('rams_document_id')
          .eq('contractor_id', userId)
          .eq('is_current', true);

        const signedDocIds = new Set(signatures?.map(s => s.rams_document_id) || []);
        
        // Check if all required documents are signed
        ramsComplete = Array.from(requiredDocIds).every(id => signedDocIds.has(id));
      }

      const allStepsComplete = personalComplete && cscsComplete && emergencyComplete && ramsComplete;

      const status = {
        personal: !!personalComplete,
        cscs: !!cscsComplete,
        emergency: !!emergencyComplete,
        rams: !!ramsComplete,
        completed: allStepsComplete && userData.onboarding_completed
      };

      console.log('[Validation] Completion status:', status);
      console.log('[Validation] Details:', {
        personalComplete,
        cscsComplete,
        emergencyComplete,
        ramsComplete,
        selectedWorkTypes: selectedWorkTypes.length,
        dbOnboardingCompleted: userData.onboarding_completed
      });

      setStepStatus(status);
    } catch (error) {
      console.error('[Validation] Error checking completion status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkCompletionStatus();
  }, [user]);

  const getFirstIncompleteStep = (): string => {
    if (!stepStatus.personal) return 'personal-details';
    if (!stepStatus.cscs || !stepStatus.emergency) return 'personal-details';
    if (!stepStatus.rams) return 'work-types';
    return 'complete';
  };

  const getCompletionPercentage = (): number => {
    const steps = [stepStatus.personal, stepStatus.cscs, stepStatus.emergency, stepStatus.rams];
    const completedSteps = steps.filter(Boolean).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  return {
    stepStatus,
    isLoading,
    checkCompletionStatus,
    getFirstIncompleteStep,
    getCompletionPercentage
  };
};