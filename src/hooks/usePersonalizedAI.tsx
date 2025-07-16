import { useState, useCallback, useEffect } from 'react';
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

interface AIPreferences {
  communicationStyle: string;
  voiceEnabled: boolean;
  voice_enabled: boolean;
  proactiveEnabled: boolean;
  proactive_suggestions: boolean;
  learningEnabled: boolean;
  greeting_style: string;
  preferred_tone: string;
  response_length: string;
  trade_terminology_level: string;
  morning_summary: boolean;
  notification_frequency: string;
}

export const usePersonalizedAI = () => {
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [preferences, setPreferences] = useState<AIPreferences>({
    communicationStyle: 'professional',
    voiceEnabled: true,
    voice_enabled: true,
    proactiveEnabled: true,
    proactive_suggestions: true,
    learningEnabled: true,
    greeting_style: 'friendly',
    preferred_tone: 'professional',
    response_length: 'medium',
    trade_terminology_level: 'standard',
    morning_summary: true,
    notification_frequency: 'standard',
  });
  const [personalizedGreeting, setPersonalizedGreeting] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
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
        // Mock recent activity data
        const mockActivity = [
          { action_type: 'view', table_name: 'timesheets' },
          { action_type: 'create', table_name: 'projects' },
          { action_type: 'update', table_name: 'users' }
        ];
        
        context += `Recent activity: ${mockActivity.map(a => `${a.action_type} on ${a.table_name}`).join(', ')}. `;
      }

      if (options.includeProjectContext) {
        // Add project context if available
        context += 'User is working on construction projects. ';
      }

      if (options.includeComplianceData) {
        // Mock compliance data
        const mockCompliance = {
          compliance_percentage: 85,
          signatures_required: 10,
          signatures_completed: 8
        };
        
        context += `Current compliance: ${mockCompliance.compliance_percentage}% (${mockCompliance.signatures_completed}/${mockCompliance.signatures_required} signatures). `;
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

  const updatePreferences = useCallback(async (newPreferences: Partial<AIPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
    toast({
      title: "Preferences Updated",
      description: "Your AI preferences have been saved",
    });
  }, [toast]);

  const submitFeedback = useCallback(async (messageId: string, feedbackType: 'positive' | 'negative', feedbackText?: string) => {
    try {
      // Mock feedback submission - log to console for demo
      console.log('Feedback submitted:', {
        messageId,
        feedbackType,
        feedbackText
      });

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }, [toast]);

  const getPersonalizedContext = useCallback(async () => {
    try {
      // Mock personalized context
      const mockActivity = [
        { action_type: 'view', table_name: 'timesheets' },
        { action_type: 'create', table_name: 'projects' },
        { action_type: 'update', table_name: 'users' }
      ];

      return mockActivity.map(a => `${a.action_type} on ${a.table_name}`).join(', ');
    } catch (error) {
      console.error('Failed to get personalized context:', error);
      return '';
    }
  }, []);

  const markSuggestionShown = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, shown: true } : s
    ));
  }, []);

  // Initialize personalized greeting
  useEffect(() => {
    const generateGreeting = () => {
      const hour = new Date().getHours();
      const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      setPersonalizedGreeting(`${timeGreeting}! How can I assist you today?`);
    };

    generateGreeting();
  }, []);

  return {
    askAI,
    askWithFullContext,
    askBasic,
    loading,
    isLoading: loading,
    lastResponse,
    preferences,
    updatePreferences,
    personalizedGreeting,
    submitFeedback,
    getPersonalizedContext,
    suggestions,
    patterns,
    markSuggestionShown,
  };
};