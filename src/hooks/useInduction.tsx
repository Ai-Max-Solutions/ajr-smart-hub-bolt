import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InductionProgress {
  id: string;
  user_id: string;
  project_id?: string;
  induction_type: string;
  status: string;
  current_step: number;
  total_steps: number;
  language_preference: string;
  completion_percentage: number;
  started_at: string;
  completed_at?: string;
  supervisor_id?: string;
  location?: string;
  device_info?: any;
}

export interface DemoCompletion {
  id: string;
  demo_type: 'live_scan' | 'stale_scan' | 'ai_query' | 'quiz';
  qr_code_scanned?: string;
  scan_result?: any;
  understanding_confirmed: boolean;
  time_taken_seconds?: number;
  assistance_needed: boolean;
  notes?: string;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  feedback: any;
  questionResults: any[];
  recommendations: any[];
}

export function useInduction() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentInduction, setCurrentInduction] = useState<InductionProgress | null>(null);

  const startInduction = useCallback(async (
    userId: string,
    projectId?: string,
    supervisorId?: string,
    language = 'en'
  ) => {
    setIsLoading(true);
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: {
          width: screen.width,
          height: screen.height
        },
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase.rpc('start_induction', {
        p_user_id: userId,
        p_project_id: projectId,
        p_supervisor_id: supervisorId,
        p_language: language,
        p_device_info: deviceInfo
      });

      if (error) throw error;

      // Fetch the created induction
      const { data: induction, error: fetchError } = await supabase
        .from('induction_progress')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;

      setCurrentInduction(induction);
      toast.success('Induction started successfully');
      return induction;
    } catch (error) {
      console.error('Error starting induction:', error);
      toast.error('Failed to start induction');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeStep = useCallback(async (
    inductionId: string,
    stepNumber: number,
    stepData = {}
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('complete_induction_step', {
        p_induction_id: inductionId,
        p_step_number: stepNumber,
        p_step_data: stepData
      });

      if (error) throw error;

      // Refresh current induction
      if (currentInduction?.id === inductionId) {
        const { data: updated } = await supabase
          .from('induction_progress')
          .select('*')
          .eq('id', inductionId)
          .single();
        
        if (updated) {
          setCurrentInduction(updated);
        }
      }

      toast.success(`Step ${stepNumber} completed`);
      return data;
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Failed to complete step');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentInduction]);

  const recordDemoCompletion = useCallback(async (
    inductionId: string,
    demoType: DemoCompletion['demo_type'],
    demoData: Partial<DemoCompletion>
  ) => {
    try {
      const { data, error } = await supabase
        .from('demo_completions')
        .insert({
          induction_id: inductionId,
          demo_type: demoType,
          ...demoData
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`${demoType.replace('_', ' ')} demo completed`);
      return data;
    } catch (error) {
      console.error('Error recording demo completion:', error);
      toast.error('Failed to record demo completion');
      throw error;
    }
  }, []);

  const submitQuiz = useCallback(async (
    inductionId: string,
    answers: Record<string, string>,
    userId: string
  ): Promise<QuizResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('induction-ai-processor/assess-quiz', {
        body: {
          inductionId,
          answers,
          userId
        }
      });

      if (error) throw error;

      if (data.passed) {
        toast.success(`Quiz passed with ${data.score}%!`);
        // Complete the quiz step
        await completeStep(inductionId, 5, { quiz_score: data.score });
      } else {
        toast.error(`Quiz failed with ${data.score}%. Please review and try again.`);
      }

      return data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [completeStep]);

  const generateVoiceover = useCallback(async (
    text: string,
    language = 'en',
    voice = 'alloy'
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('induction-ai-processor/generate-voiceover', {
        body: {
          text,
          language,
          voice
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating voiceover:', error);
      toast.error('Failed to generate voiceover');
      throw error;
    }
  }, []);

  const getPersonalizedContent = useCallback(async (
    userId: string,
    language = 'en',
    role = 'Operative'
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('induction-ai-processor/generate-personalized-content', {
        body: {
          userId,
          language,
          role
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting personalized content:', error);
      toast.error('Failed to get personalized content');
      throw error;
    }
  }, []);

  const getInductionProgress = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('induction_progress')
        .select(`
          *,
          demo_completions(*),
          learning_analytics(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCurrentInduction(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error getting induction progress:', error);
      return null;
    }
  }, []);

  const getInductionMaterials = useCallback(async (materialType?: string, language = 'en') => {
    try {
      let query = supabase
        .from('induction_materials')
        .select('*')
        .eq('is_active', true)
        .eq('language', language);

      if (materialType) {
        query = query.eq('material_type', materialType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting induction materials:', error);
      toast.error('Failed to load induction materials');
      throw error;
    }
  }, []);

  const analyzeLearningGaps = useCallback(async (inductionId: string, userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('induction-ai-processor/analyze-learning-gaps', {
        body: {
          inductionId,
          userId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error analyzing learning gaps:', error);
      toast.error('Failed to analyze learning gaps');
      throw error;
    }
  }, []);

  return {
    isLoading,
    currentInduction,
    startInduction,
    completeStep,
    recordDemoCompletion,
    submitQuiz,
    generateVoiceover,
    getPersonalizedContent,
    getInductionProgress,
    getInductionMaterials,
    analyzeLearningGaps
  };
}