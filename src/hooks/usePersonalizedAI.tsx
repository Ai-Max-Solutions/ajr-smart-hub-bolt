import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { useMobileOptimization } from './useMobileOptimization';

export interface AIPreferences {
  preferred_tone: string;
  trade_terminology_level: string;
  voice_enabled: boolean;
  proactive_suggestions: boolean;
  morning_summary: boolean;
  greeting_style: string;
  response_length: string;
  notification_frequency: string;
}

export interface ProactiveSuggestion {
  id: string;
  title: string;
  content: string;
  action_type: string;
  action_data: any;
  priority_score: number;
  confidence_score: number;
  expires_at: string;
  suggestion_type: string;
}

export interface UserPattern {
  pattern_type: string;
  pattern_data: any;
  frequency_score: number;
  confidence_level: number;
  next_predicted: string;
}

export const usePersonalizedAI = () => {
  const { profile } = useUserProfile();
  const { mobileFeatures } = useMobileOptimization();
  const [preferences, setPreferences] = useState<AIPreferences | null>(null);
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [patterns, setPatterns] = useState<UserPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [personalizedGreeting, setPersonalizedGreeting] = useState<string>('');

  // Load user AI preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_ai_preferences')
          .select('*')
          .eq('user_id', profile.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading AI preferences:', error);
        } else if (data) {
          setPreferences(data);
        } else {
          // Create default preferences
          const defaultPrefs: Partial<AIPreferences> = {
            preferred_tone: 'professional',
            trade_terminology_level: 'standard',
            voice_enabled: mobileFeatures.deviceType === 'mobile',
            proactive_suggestions: true,
            morning_summary: true,
            greeting_style: 'friendly',
            response_length: 'balanced',
            notification_frequency: 'normal'
          };

          const { data: newPrefs } = await supabase
            .from('user_ai_preferences')
            .insert({ user_id: profile.id, ...defaultPrefs })
            .select()
            .single();

          if (newPrefs) setPreferences(newPrefs);
        }
      } catch (error) {
        console.error('Error in loadPreferences:', error);
      }
    };

    loadPreferences();
  }, [profile?.id, mobileFeatures.deviceType]);

  // Load proactive suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('proactive_suggestions')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .is('shown_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('priority_score', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error loading suggestions:', error);
        } else if (data) {
          setSuggestions(data);
        }
      } catch (error) {
        console.error('Error in loadSuggestions:', error);
      }
    };

    loadSuggestions();
  }, [profile?.id]);

  // Load user patterns
  useEffect(() => {
    const loadPatterns = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_patterns')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .order('frequency_score', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error loading patterns:', error);
        } else if (data) {
          setPatterns(data);
        }
      } catch (error) {
        console.error('Error in loadPatterns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatterns();
  }, [profile?.id]);

  // Generate personalized greeting
  useEffect(() => {
    if (!profile || !preferences) return;

    const generateGreeting = () => {
      const currentHour = new Date().getHours();
      const firstName = profile.firstname || profile.fullname?.split(' ')[0] || 'there';
      
      let timeGreeting = '';
      if (currentHour < 12) timeGreeting = 'Morning';
      else if (currentHour < 17) timeGreeting = 'Afternoon';
      else timeGreeting = 'Evening';

      let greeting = '';
      switch (preferences.greeting_style) {
        case 'formal':
          greeting = `Good ${timeGreeting.toLowerCase()}, ${firstName}`;
          break;
        case 'casual':
          greeting = `${timeGreeting} ${firstName}!`;
          break;
        default:
          greeting = `${timeGreeting} ${firstName}`;
      }

      // Add role-specific context
      if (patterns.length > 0) {
        const morningPattern = patterns.find(p => p.pattern_type === 'morning_routine');
        if (morningPattern && currentHour < 10) {
          greeting += ' - ready to check today\'s work?';
        }
      }

      setPersonalizedGreeting(greeting);
    };

    generateGreeting();
  }, [profile, preferences, patterns]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<AIPreferences>) => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_ai_preferences')
        .update(updates)
        .eq('user_id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
      } else if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error in updatePreferences:', error);
    }
  }, [profile?.id]);

  // Mark suggestion as shown
  const markSuggestionShown = useCallback(async (suggestionId: string) => {
    try {
      await supabase
        .from('proactive_suggestions')
        .update({ shown_at: new Date().toISOString() })
        .eq('id', suggestionId);

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error marking suggestion as shown:', error);
    }
  }, []);

  // Submit AI feedback
  const submitFeedback = useCallback(async (
    messageId: string,
    conversationId: string,
    feedbackType: 'thumbs_up' | 'thumbs_down' | 'correction',
    feedbackValue?: string,
    correctionText?: string
  ) => {
    if (!profile?.id) return;

    try {
      await supabase
        .from('ai_feedback')
        .insert({
          user_id: profile.id,
          conversation_id: conversationId,
          message_id: messageId,
          feedback_type: feedbackType,
          feedback_value: feedbackValue,
          correction_text: correctionText
        });

      console.log('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  }, [profile?.id]);

  // Get personalized AI context for chat
  const getPersonalizedContext = useCallback(async () => {
    if (!profile?.id) return null;

    try {
      const { data, error } = await supabase.rpc('get_user_ai_context', {
        p_user_id: profile.id
      });

      if (error) {
        console.error('Error getting AI context:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPersonalizedContext:', error);
      return null;
    }
  }, [profile?.id]);

  return {
    preferences,
    suggestions,
    patterns,
    isLoading,
    personalizedGreeting,
    updatePreferences,
    markSuggestionShown,
    submitFeedback,
    getPersonalizedContext
  };
};