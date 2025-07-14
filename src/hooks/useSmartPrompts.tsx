import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  context_fields: any; // JSONB from database
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
  const [offlineCache, setOfflineCache] = useState<Map<string, any>>(new Map());

  // Load role-specific prompts
  const loadPrompts = useCallback(async () => {
    if (!profile?.role) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_role_smart_prompts', { p_role: profile.role });

      if (error) throw error;

      const processedPrompts = (data || []).map((prompt: any) => ({
        ...prompt,
        context_fields: Array.isArray(prompt.context_fields) ? prompt.context_fields : 
                       typeof prompt.context_fields === 'string' ? JSON.parse(prompt.context_fields) : []
      }));
      setPrompts(processedPrompts);
      
      // Cache prompts for offline use
      if (processedPrompts.length > 0) {
        const cacheKey = `prompts_${profile.role}`;
        localStorage.setItem(cacheKey, JSON.stringify(processedPrompts));
      }

    } catch (error) {
      console.error('Error loading prompts:', error);
      
      // Try to load from cache if online request fails
      const cacheKey = `prompts_${profile.role}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setPrompts(JSON.parse(cached));
        toast({
          title: "📱 Using Cached Prompts",
          description: "Loaded prompts from offline cache",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [profile?.role, toast]);

  // Load user's prompt usage history
  const loadUsageHistory = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('smart_prompt_usage')
        .select(`
          id,
          template_id,
          executed_at,
          execution_time_ms,
          tokens_used,
          user_rating,
          was_refined,
          mobile_device,
          voice_input
        `)
        .eq('user_id', profile.id)
        .order('executed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsage(data || []);

    } catch (error) {
      console.error('Error loading usage history:', error);
    }
  }, [profile]);

  // Calculate analytics from usage data
  const calculateAnalytics = useCallback(() => {
    if (usage.length === 0) return null;

    const totalExecutions = usage.length;
    const avgExecutionTime = usage.reduce((sum, u) => sum + (u.execution_time_ms || 0), 0) / totalExecutions;
    const totalTokensUsed = usage.reduce((sum, u) => sum + (u.tokens_used || 0), 0);
    const ratingsWithValues = usage.filter(u => u.user_rating);
    const avgRating = ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((sum, u) => sum + (u.user_rating || 0), 0) / ratingsWithValues.length
      : 0;

    // Count usage by category
    const categoryUsage: Record<string, number> = {};
    usage.forEach(u => {
      const prompt = prompts.find(p => p.id === u.template_id);
      if (prompt) {
        categoryUsage[prompt.category] = (categoryUsage[prompt.category] || 0) + 1;
      }
    });

    // Most used prompts
    const promptUsage = new Map<string, number>();
    usage.forEach(u => {
      promptUsage.set(u.template_id, (promptUsage.get(u.template_id) || 0) + 1);
    });

    const mostUsedPrompts = Array.from(promptUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([templateId]) => prompts.find(p => p.id === templateId))
      .filter(Boolean) as SmartPrompt[];

    const mobileUsageCount = usage.filter(u => u.mobile_device).length;
    const voiceUsageCount = usage.filter(u => u.voice_input).length;

    return {
      total_executions: totalExecutions,
      avg_execution_time: Math.round(avgExecutionTime),
      total_tokens_used: totalTokensUsed,
      avg_rating: avgRating,
      most_used_prompts: mostUsedPrompts,
      category_usage: categoryUsage,
      mobile_usage_percentage: Math.round((mobileUsageCount / totalExecutions) * 100),
      voice_usage_percentage: Math.round((voiceUsageCount / totalExecutions) * 100)
    };
  }, [usage, prompts]);

  // Execute a smart prompt
  const executePrompt = useCallback(async (
    promptId: string,
    inputText: string,
    context: Record<string, any> = {},
    options: {
      mobileDevice?: boolean;
      voiceInput?: boolean;
      offlineMode?: boolean;
    } = {}
  ) => {
    try {
      // Check if we have this cached offline
      const cacheKey = `${promptId}_${inputText}`;
      if (options.offlineMode && offlineCache.has(cacheKey)) {
        const cached = offlineCache.get(cacheKey);
        toast({
          title: "📱 Cached Response",
          description: "Using offline cached response",
        });
        return cached;
      }

      const { data, error } = await supabase.functions.invoke('smart-prompt-execute', {
        body: {
          template_id: promptId,
          input_text: inputText,
          context: context,
          mobile_device: options.mobileDevice || false,
          voice_input: options.voiceInput || false,
          offline_mode: options.offlineMode || false
        }
      });

      if (error) throw error;

      if (data.success) {
        // Cache the response for offline use
        setOfflineCache(prev => new Map(prev.set(cacheKey, data)));
        
        // Refresh usage data
        loadUsageHistory();
        
        return data;
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Error executing prompt:', error);
      throw error;
    }
  }, [offlineCache, toast, loadUsageHistory]);

  // Rate a prompt execution
  const ratePromptExecution = useCallback(async (
    usageId: string,
    rating: number,
    feedback?: string
  ) => {
    try {
      const { error } = await supabase
        .from('smart_prompt_usage')
        .update({
          user_rating: rating,
          user_feedback: feedback
        })
        .eq('id', usageId);

      if (error) throw error;

      // Refresh usage data to update analytics
      loadUsageHistory();

      toast({
        title: "⭐ Rating Submitted",
        description: "Thank you for your feedback!",
      });

    } catch (error) {
      console.error('Error rating prompt:', error);
      toast({
        title: "Rating Error",
        description: "Could not submit rating. Please try again.",
        variant: "destructive"
      });
    }
  }, [loadUsageHistory, toast]);

  // Get cached prompts for offline use
  const getCachedPrompts = useCallback(() => {
    if (!profile?.role) return [];
    
    const cacheKey = `prompts_${profile.role}`;
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : [];
  }, [profile?.role]);

  // Sync offline cache when coming back online
  const syncOfflineCache = useCallback(async () => {
    try {
      const offlineData = localStorage.getItem('offline_messages');
      if (!offlineData) return;

      const messages = JSON.parse(offlineData);
      const unsynced = messages.filter((m: any) => !m.synced);

      for (const message of unsynced) {
        // Attempt to sync each cached message
        try {
          await supabase
            .rpc('cache_prompt_offline', {
              p_template_id: message.template_id,
              p_input: message.input,
              p_output: message.output
            });

          // Mark as synced
          message.synced = true;
        } catch (error) {
          console.error('Error syncing cached message:', error);
        }
      }

      // Update localStorage with sync status
      localStorage.setItem('offline_messages', JSON.stringify(messages));

      if (unsynced.length > 0) {
        toast({
          title: "🔄 Sync Complete",
          description: `Synced ${unsynced.length} offline responses`,
        });
      }

    } catch (error) {
      console.error('Error syncing offline cache:', error);
    }
  }, [toast]);

  // Get prompt suggestions based on context
  const getPromptSuggestions = useCallback((context: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    currentProject?: string;
    recentActivity?: string[];
  }) => {
    if (prompts.length === 0) return [];

    // Smart suggestions based on context
    let suggestions = [...prompts];

    // Time-based suggestions
    if (context.timeOfDay === 'morning') {
      suggestions = suggestions.filter(p => 
        p.category === 'planning' || 
        p.category === 'team' || 
        p.title.toLowerCase().includes('briefing')
      );
    }

    // Project-based suggestions
    if (context.currentProject) {
      suggestions = suggestions.filter(p => 
        p.category === 'progress' || 
        p.category === 'delivery' || 
        p.category === 'planning'
      );
    }

    // Sort by usage and rating
    suggestions.sort((a, b) => {
      const scoreA = (a.usage_count * 0.6) + (a.avg_rating * 0.4);
      const scoreB = (b.usage_count * 0.6) + (b.avg_rating * 0.4);
      return scoreB - scoreA;
    });

    return suggestions.slice(0, 5);
  }, [prompts]);

  // Load data on mount and profile change
  useEffect(() => {
    loadPrompts();
    loadUsageHistory();
  }, [loadPrompts, loadUsageHistory]);

  // Calculate analytics when usage changes
  useEffect(() => {
    const calculated = calculateAnalytics();
    setAnalytics(calculated);
  }, [calculateAnalytics]);

  // Listen for online/offline changes to sync cache
  useEffect(() => {
    const handleOnline = () => {
      syncOfflineCache();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineCache]);

  return {
    prompts,
    loading,
    usage,
    analytics,
    executePrompt,
    ratePromptExecution,
    getCachedPrompts,
    getPromptSuggestions,
    syncOfflineCache,
    loadPrompts,
    loadUsageHistory
  };
};