import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from './useUserProfile';
import { useToast } from './use-toast';

interface SmartPrompt {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  usage_count: number;
  avg_rating: number;
  requires_context: boolean;
  context_fields: any;
  example_input?: string;
  system_prompt?: string;
  output_format?: string;
}

interface SmartPromptUsage {
  id: string;
  template_id: string;
  executed_at: string;
  execution_time_ms: number;
  tokens_used: number;
  user_rating?: number;
  was_refined: boolean;
  mobile_device: boolean;
  voice_input: boolean;
}

interface PromptAnalytics {
  total_executions: number;
  avg_execution_time: number;
  total_tokens_used: number;
  avg_rating: number;
  most_used_prompts: SmartPrompt[];
  category_usage: Record<string, number>;
  mobile_usage_percentage: number;
  voice_usage_percentage: number;
}

export const useSmartPrompts = () => {
  const { profile } = useUserProfile();
  const { toast } = useToast();
  
  const [prompts, setPrompts] = useState<SmartPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<SmartPromptUsage[]>([]);
  const [analytics, setAnalytics] = useState<PromptAnalytics | null>(null);

  // Mock prompts data
  const mockPrompts: SmartPrompt[] = [
    {
      id: 'prompt1',
      title: 'Safety Briefing Generator',
      description: 'Generate daily safety briefings based on weather and site conditions',
      category: 'safety',
      priority: 1,
      usage_count: 45,
      avg_rating: 4.2,
      requires_context: true,
      context_fields: { weather: true, site_conditions: true },
      example_input: 'Generate safety briefing for rainy conditions',
      system_prompt: 'You are a safety expert generating briefings.',
      output_format: 'structured_list'
    },
    {
      id: 'prompt2',
      title: 'Progress Report Writer',
      description: 'Create professional progress reports from raw data',
      category: 'productivity',
      priority: 2,
      usage_count: 32,
      avg_rating: 4.0,
      requires_context: true,
      context_fields: { timesheet_data: true, completion_status: true },
      example_input: 'Write progress report for week ending 2024-01-15',
      system_prompt: 'You are a project manager creating reports.',
      output_format: 'document'
    }
  ];

  // Load prompts based on user role (mock implementation)
  const loadRoleBasedPrompts = useCallback(async () => {
    if (!profile?.role) return;

    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter prompts based on role
      const rolePrompts = mockPrompts.filter(prompt => {
        if (profile.role === 'Supervisor') return true;
        if (profile.role === 'Operative') return prompt.category === 'safety';
        return prompt.priority <= 2;
      });

      setPrompts(rolePrompts);
    } catch (error) {
      console.error('Error loading role-based prompts:', error);
      toast({
        title: "Error",
        description: "Failed to load smart prompts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.role, toast]);

  // Load usage analytics (mock implementation)
  const loadUsageAnalytics = useCallback(async () => {
    if (!profile?.id) return;

    try {
      // Mock usage data
      const mockUsage: SmartPromptUsage[] = [
        {
          id: 'usage1',
          template_id: 'prompt1',
          executed_at: new Date().toISOString(),
          execution_time_ms: 1200,
          tokens_used: 150,
          user_rating: 4,
          was_refined: false,
          mobile_device: false,
          voice_input: false
        }
      ];

      setUsage(mockUsage);

      // Mock analytics
      const mockAnalytics: PromptAnalytics = {
        total_executions: 77,
        avg_execution_time: 1150,
        total_tokens_used: 11550,
        avg_rating: 4.1,
        most_used_prompts: mockPrompts.slice(0, 3),
        category_usage: { safety: 45, productivity: 32 },
        mobile_usage_percentage: 15,
        voice_usage_percentage: 8
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading usage analytics:', error);
    }
  }, [profile?.id]);

  // Execute prompt (mock implementation)
  const executePrompt = useCallback(async (
    promptId: string,
    input: string,
    context: any = {},
    options: {
      voice_input?: boolean;
      mobile_device?: boolean;
      require_refinement?: boolean;
    } = {}
  ) => {
    try {
      setLoading(true);
      
      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) throw new Error('Prompt not found');

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = {
        id: `exec_${Date.now()}`,
        prompt_id: promptId,
        input,
        output: `Mock AI response for: ${input}`,
        execution_time_ms: 950,
        tokens_used: 125,
        context_used: context,
        requires_follow_up: false
      };

      // Record usage
      const usageRecord: SmartPromptUsage = {
        id: `usage_${Date.now()}`,
        template_id: promptId,
        executed_at: new Date().toISOString(),
        execution_time_ms: response.execution_time_ms,
        tokens_used: response.tokens_used,
        was_refined: false,
        mobile_device: options.mobile_device || false,
        voice_input: options.voice_input || false
      };

      setUsage(prev => [usageRecord, ...prev]);

      toast({
        title: "Prompt Executed",
        description: `${prompt.title} completed successfully`,
      });

      return response;
    } catch (error) {
      console.error('Error executing prompt:', error);
      toast({
        title: "Execution Error",
        description: "Failed to execute prompt",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [prompts, toast]);

  // Rate prompt execution (mock implementation)
  const rateExecution = useCallback(async (
    usageId: string,
    rating: number,
    feedback?: string
  ) => {
    try {
      setUsage(prev => prev.map(u => 
        u.id === usageId ? { ...u, user_rating: rating } : u
      ));

      console.log('Rating submitted:', { usageId, rating, feedback });
      return true;
    } catch (error) {
      console.error('Error rating execution:', error);
      return false;
    }
  }, []);

  // Cache prompt for offline use (mock implementation)
  const cachePromptOffline = useCallback(async (promptId: string) => {
    try {
      console.log('Caching prompt offline:', promptId);
      return true;
    } catch (error) {
      console.error('Error caching prompt:', error);
      return false;
    }
  }, []);

  // Get cached prompts (mock implementation)
  const getCachedPrompts = useCallback(async () => {
    try {
      return mockPrompts.filter(p => p.priority <= 2);
    } catch (error) {
      console.error('Error getting cached prompts:', error);
      return [];
    }
  }, []);

  // Initialize
  useEffect(() => {
    loadRoleBasedPrompts();
    loadUsageAnalytics();
  }, [loadRoleBasedPrompts, loadUsageAnalytics]);

  return {
    prompts,
    usage,
    analytics,
    loading,
    executePrompt,
    rateExecution,
    cachePromptOffline,
    getCachedPrompts,
    loadRoleBasedPrompts,
    loadUsageAnalytics
  };
};