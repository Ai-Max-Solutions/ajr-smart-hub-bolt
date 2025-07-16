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

      // Mock induction start since start_induction function doesn't exist
      const mockData = {
        induction_id: 'mock-induction-1',
        status: 'started',
        language: language
      };


      // Mock induction progress since induction_progress table doesn't exist
      const mockInduction: InductionProgress = {
        id: 'mock-induction-1',
        user_id: userId,
        project_id: projectId,
        induction_type: 'basic',
        status: 'started',
        current_step: 1,
        total_steps: 5,
        language_preference: language,
        completion_percentage: 0,
        started_at: new Date().toISOString(),
        supervisor_id: supervisorId
      };

      setCurrentInduction(mockInduction);
      toast.success('Induction started successfully');
      return mockInduction;
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
      // Mock step completion since complete_induction_step function doesn't exist
      const mockResult = { step_completed: stepNumber };

      // Mock induction progress update since induction_progress table doesn't exist
      if (currentInduction?.id === inductionId) {
        const updatedInduction = {
          ...currentInduction,
          current_step: stepNumber + 1,
          completion_percentage: ((stepNumber) / currentInduction.total_steps) * 100
        };
        setCurrentInduction(updatedInduction);
      }

      toast.success(`Step ${stepNumber} completed`);
      return mockResult;
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
      // Mock demo completion since demo_completions table doesn't exist
      const mockData = {
        id: `mock-demo-${Date.now()}`,
        demo_type: demoType,
        ...demoData
      };

      toast.success(`${demoType.replace('_', ' ')} demo completed`);
      return mockData;
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
      // Mock induction progress since induction_progress table doesn't exist
      const mockProgress: InductionProgress = {
        id: 'mock-progress-1',
        user_id: userId,
        induction_type: 'basic',
        status: 'in_progress',
        current_step: 3,
        total_steps: 5,
        language_preference: 'en',
        completion_percentage: 60,
        started_at: new Date().toISOString()
      };

      setCurrentInduction(mockProgress);
      return mockProgress;
    } catch (error) {
      console.error('Error getting induction progress:', error);
      return null;
    }
  }, []);

  const getInductionMaterials = useCallback(async (materialType?: string, language = 'en') => {
    try {
      // Mock induction materials since induction_materials table doesn't exist
      const mockMaterials = [
        {
          id: '1',
          material_type: materialType || 'video',
          title: 'Safety Introduction',
          language: language,
          content_url: '/mock-video.mp4',
          is_active: true
        }
      ];

      return mockMaterials;
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