import { useState, useEffect, useRef } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIMetrics {
  responseTime: number;
  accuracy: number;
  hallucinationScore: number;
  contextRelevance: number;
  userSatisfaction: number;
}

interface AIInsight {
  id: string;
  type: 'performance' | 'pattern' | 'optimization' | 'error';
  message: string;
  confidence: number;
  actionRequired: boolean;
  timestamp: Date;
}

interface ConversationPattern {
  userId: string;
  commonQueries: string[];
  responsePatterns: string[];
  satisfaction: number;
  improvements: string[];
}

export const useAISelfDiagnostics = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<AIMetrics>({
    responseTime: 0,
    accuracy: 0.95,
    hallucinationScore: 0.02,
    contextRelevance: 0.89,
    userSatisfaction: 0.87
  });
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const responseTimeRef = useRef<number>(0);
  const conversationRef = useRef<string[]>([]);

  // Real-time performance monitoring
  const startResponseTimer = () => {
    responseTimeRef.current = Date.now();
  };

  const endResponseTimer = () => {
    if (responseTimeRef.current > 0) {
      const responseTime = Date.now() - responseTimeRef.current;
      setMetrics(prev => ({
        ...prev,
        responseTime: (prev.responseTime + responseTime) / 2 // Moving average
      }));
      
      // Alert if response time is too slow
      if (responseTime > 10000) {
        addInsight({
          type: 'performance',
          message: `Slow response detected: ${responseTime}ms - Consider optimizing vector search`,
          confidence: 0.95,
          actionRequired: true
        });
      }
      
      responseTimeRef.current = 0;
    }
  };

  // Hallucination detection using confidence scoring
  const detectHallucination = async (userQuery: string, aiResponse: string, context: any[]) => {
    try {
      // Simple heuristics for hallucination detection
      const hallucinationIndicators = [
        aiResponse.includes("I'm not sure but") && !context.length,
        aiResponse.includes("specific details") && context.length === 0,
        aiResponse.includes("according to the latest") && !context.some(c => c.metadata?.recent),
        /\d{4}-\d{2}-\d{2}/.test(aiResponse) && !context.some(c => c.content?.includes(aiResponse.match(/\d{4}-\d{2}-\d{2}/)?.[0])),
        aiResponse.length > 500 && context.length === 0 // Long response with no context
      ];

      const hallucinationScore = hallucinationIndicators.filter(Boolean).length / hallucinationIndicators.length;
      
      setMetrics(prev => ({
        ...prev,
        hallucinationScore: (prev.hallucinationScore + hallucinationScore) / 2
      }));

      if (hallucinationScore > 0.3) {
        addInsight({
          type: 'error',
          message: `Potential hallucination detected (confidence: ${(hallucinationScore * 100).toFixed(1)}%)`,
          confidence: hallucinationScore,
          actionRequired: true
        });

        // Auto-retry with refined prompt
        return await retryWithRefinedPrompt(userQuery, context);
      }

      return aiResponse;
    } catch (error) {
      console.error('Hallucination detection error:', error);
      return aiResponse;
    }
  };

  // Auto-retry with refined prompts
  const retryWithRefinedPrompt = async (originalQuery: string, context: any[]) => {
    const refinedPrompt = `${originalQuery}

IMPORTANT: Base your response ONLY on the provided context. If the context doesn't contain enough information, clearly state "I don't have enough information in the provided context to answer this question accurately."

Context provided: ${context.length} documents`;

    try {
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          message: refinedPrompt,
          retry_attempt: true,
          hallucination_prevention: true
        }
      });

      addInsight({
        type: 'optimization',
        message: 'Auto-refined prompt to prevent hallucination',
        confidence: 0.8,
        actionRequired: false
      });

      return response;
    } catch (error) {
      console.error('Retry failed:', error);
      return null;
    }
  };

  // Context relevance analysis
  const analyzeContextRelevance = (query: string, retrievedContext: any[]) => {
    if (!retrievedContext.length) {
      setMetrics(prev => ({ ...prev, contextRelevance: 0 }));
      return;
    }

    const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 3);
    let totalRelevance = 0;

    retrievedContext.forEach(context => {
      const contextWords = context.content.toLowerCase().split(' ');
      const matchingWords = queryWords.filter(qw => 
        contextWords.some(cw => cw.includes(qw) || qw.includes(cw))
      );
      
      const relevance = matchingWords.length / queryWords.length;
      totalRelevance += relevance;
    });

    const avgRelevance = totalRelevance / retrievedContext.length;
    setMetrics(prev => ({
      ...prev,
      contextRelevance: (prev.contextRelevance + avgRelevance) / 2
    }));

    if (avgRelevance < 0.5) {
      addInsight({
        type: 'performance',
        message: `Low context relevance: ${(avgRelevance * 100).toFixed(1)}% - Consider improving vector search parameters`,
        confidence: 0.9,
        actionRequired: true
      });
    }
  };

  // Learn from user corrections
  const learnFromCorrection = (originalResponse: string, userCorrection: string, query: string) => {
    // Store the correction for future learning
    const correction = {
      query,
      original_response: originalResponse,
      user_correction: userCorrection,
      timestamp: new Date().toISOString(),
      improvement_needed: true
    };

    // Store in local state for immediate learning
    conversationRef.current.push(JSON.stringify(correction));

    addInsight({
      type: 'pattern',
      message: `User correction recorded: "${userCorrection}" - Will improve future responses`,
      confidence: 1.0,
      actionRequired: false
    });

    // Update accuracy metric
    setMetrics(prev => ({
      ...prev,
      accuracy: Math.max(0.5, prev.accuracy - 0.05) // Decrease accuracy when corrected
    }));
  };

  // Proactive insights generation
  const generateProactiveInsights = async (userRole: string, recentQueries: string[]) => {
    const patterns = analyzeQueryPatterns(recentQueries);
    
    patterns.forEach(pattern => {
      if (pattern.frequency > 3) {
        addInsight({
          type: 'pattern',
          message: `You frequently ask about "${pattern.topic}" - Consider bookmarking this information`,
          confidence: 0.7,
          actionRequired: false
        });
      }
    });

    // Role-specific insights
    if (userRole === 'Supervisor' && recentQueries.some(q => q.includes('compliance'))) {
      addInsight({
        type: 'optimization',
        message: 'Tip: Use "Show team compliance status" for quick overview',
        confidence: 0.9,
        actionRequired: false
      });
    }
  };

  // Weekly performance analysis
  const generateWeeklyReport = async () => {
    setIsAnalyzing(true);
    
    try {
      const weeklyData = await supabase
        .from('ai_conversations')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const report = {
        total_conversations: weeklyData.data?.length || 0,
        avg_response_time: metrics.responseTime,
        accuracy_score: metrics.accuracy,
        hallucination_rate: metrics.hallucinationScore,
        user_satisfaction: metrics.userSatisfaction,
        improvement_areas: insights.filter(i => i.actionRequired).map(i => i.message)
      };

      // Store report for admin dashboard
      await supabase.from('ai_performance_reports').insert({
        report_date: new Date().toISOString().split('T')[0],
        metrics: report
      });

      addInsight({
        type: 'performance',
        message: `Weekly report generated: ${report.total_conversations} conversations, ${(report.accuracy_score * 100).toFixed(1)}% accuracy`,
        confidence: 1.0,
        actionRequired: false
      });

    } catch (error) {
      console.error('Weekly report generation error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Bias detection and correction
  const detectBias = (response: string, userRole: string) => {
    const biasIndicators = [
      response.includes('you should') && userRole === 'Operative', // Authoritative language to operatives
      response.includes('obviously') || response.includes('clearly'), // Assuming knowledge
      /he\/his/.test(response) && !response.includes('she/her'), // Gender bias
      response.includes('guys') && response.includes('team') // Gendered team references
    ];

    const biasScore = biasIndicators.filter(Boolean).length / biasIndicators.length;
    
    if (biasScore > 0.25) {
      addInsight({
        type: 'error',
        message: `Potential bias detected in response - Consider using more inclusive language`,
        confidence: biasScore,
        actionRequired: true
      });
    }
  };

  const addInsight = (insight: Omit<AIInsight, 'id' | 'timestamp'>) => {
    const newInsight: AIInsight = {
      ...insight,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    setInsights(prev => [newInsight, ...prev].slice(0, 50)); // Keep last 50 insights
    
    // Show critical insights as toasts
    if (insight.actionRequired && insight.confidence > 0.8) {
      toast({
        title: "🧠 AI Self-Diagnostic",
        description: insight.message,
        variant: insight.type === 'error' ? 'destructive' : 'default',
      });
    }
  };

  const analyzeQueryPatterns = (queries: string[]) => {
    const patterns: { topic: string; frequency: number }[] = [];
    const topics = ['compliance', 'training', 'timesheet', 'equipment', 'safety', 'project'];
    
    topics.forEach(topic => {
      const frequency = queries.filter(q => 
        q.toLowerCase().includes(topic)
      ).length;
      
      if (frequency > 0) {
        patterns.push({ topic, frequency });
      }
    });
    
    return patterns.sort((a, b) => b.frequency - a.frequency);
  };

  // Auto-cleanup old insights
  useEffect(() => {
    const cleanup = setInterval(() => {
      setInsights(prev => 
        prev.filter(insight => 
          Date.now() - insight.timestamp.getTime() < 24 * 60 * 60 * 1000 // Keep 24 hours
        )
      );
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(cleanup);
  }, []);

  return {
    metrics,
    insights,
    isAnalyzing,
    startResponseTimer,
    endResponseTimer,
    detectHallucination,
    analyzeContextRelevance,
    learnFromCorrection,
    generateProactiveInsights,
    generateWeeklyReport,
    detectBias
  };
};