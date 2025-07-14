import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIResponse {
  response: string;
  conversationId?: string;
}

interface PersonalizedAIOptions {
  includeRecentActivity?: boolean;
  includeProjectContext?: boolean;
  includeComplianceData?: boolean;
}

export const usePersonalizedAI = () => {
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const { toast } = useToast();

  const askAI = useCallback(async (
    message: string, 
    options: PersonalizedAIOptions = {}
  ): Promise<AIResponse | null> => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Build context based on options
      let context = '';
      
      if (options.includeRecentActivity) {
        const { data: activity } = await supabase
          .from('activity_metrics')
          .select('action_type, table_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (activity?.length) {
          context += `Recent activity: ${activity.map(a => `${a.action_type} on ${a.table_name}`).join(', ')}. `;
        }
      }

      if (options.includeProjectContext) {
        // Add project context if available
        context += 'User is working on construction projects. ';
      }

      if (options.includeComplianceData) {
        const { data: compliance } = await supabase
          .from('compliance_dashboard_stats')
          .select('compliance_percentage, signatures_required, signatures_completed')
          .order('calculated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (compliance) {
          context += `Current compliance: ${compliance.compliance_percentage}% (${compliance.signatures_completed}/${compliance.signatures_required} signatures). `;
        }
      }

      // Call AI chat function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message,
          context: context.trim(),
          userId: user.id,
        },
      });

      if (error) {
        throw error;
      }

      const response: AIResponse = {
        response: data.response,
        conversationId: data.conversationId,
      };

      setLastResponse(response);
      return response;

    } catch (error) {
      console.error('AI request failed:', error);
      toast({
        title: "AI Assistant Error",
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const askWithFullContext = useCallback((message: string) => {
    return askAI(message, {
      includeRecentActivity: true,
      includeProjectContext: true,
      includeComplianceData: true,
    });
  }, [askAI]);

  const askBasic = useCallback((message: string) => {
    return askAI(message, {});
  }, [askAI]);

  return {
    askAI,
    askWithFullContext,
    askBasic,
    loading,
    lastResponse,
  };
};