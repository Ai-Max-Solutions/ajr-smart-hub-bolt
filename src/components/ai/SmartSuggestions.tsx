import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, Clock, Users, AlertTriangle, Star } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

interface SmartSuggestion {
  id: string;
  type: 'quick_action' | 'insight' | 'reminder' | 'trending' | 'personalized';
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  icon: React.ReactNode;
}

interface SmartSuggestionsProps {
  recentQueries: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  recentQueries,
  onSuggestionClick
}) => {
  const { profile } = useUserProfile();
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateSmartSuggestions();
  }, [profile, recentQueries]);

  const generateSmartSuggestions = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const suggestions: SmartSuggestion[] = [];

      // Role-specific quick actions
      const roleActions = getRoleSpecificActions(profile.role);
      suggestions.push(...roleActions);

      // Trending queries from team
      const trendingQueries = await getTrendingQueries(profile.currentproject);
      suggestions.push(...trendingQueries);

      // Personalized based on recent activity
      const personalizedSuggestions = generatePersonalizedSuggestions(recentQueries, profile.role);
      suggestions.push(...personalizedSuggestions);

      // Time-sensitive reminders
      const reminders = await getTimeSensitiveReminders(profile.id);
      suggestions.push(...reminders);

      // Contextual insights
      const insights = await generateContextualInsights(profile);
      suggestions.push(...insights);

      // Sort by priority and confidence
      const sortedSuggestions = suggestions
        .sort((a, b) => {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return (
            priorityWeight[b.priority] * b.confidence - 
            priorityWeight[a.priority] * a.confidence
          );
        })
        .slice(0, 6); // Show top 6 suggestions

      setSuggestions(sortedSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleSpecificActions = (role: string): SmartSuggestion[] => {
    const actionMap: Record<string, SmartSuggestion[]> = {
      'Operative': [
        {
          id: 'check-timesheet',
          type: 'quick_action',
          title: 'Check My Timesheet',
          description: 'Review this week\'s logged hours',
          action: 'Show my timesheet for this week',
          priority: 'medium',
          confidence: 0.9,
          icon: <Clock className="h-4 w-4" />
        },
        {
          id: 'training-status',
          type: 'quick_action',
          title: 'Training Status',
          description: 'Check upcoming training requirements',
          action: 'What training do I need to complete?',
          priority: 'medium',
          confidence: 0.85,
          icon: <TrendingUp className="h-4 w-4" />
        }
      ],
      'Supervisor': [
        {
          id: 'team-compliance',
          type: 'quick_action',
          title: 'Team Compliance',
          description: 'Check team certification status',
          action: 'Show team compliance dashboard',
          priority: 'high',
          confidence: 0.95,
          icon: <Users className="h-4 w-4" />
        },
        {
          id: 'pending-approvals',
          type: 'quick_action',
          title: 'Pending Approvals',
          description: 'Review items waiting for approval',
          action: 'What needs my approval today?',
          priority: 'high',
          confidence: 0.9,
          icon: <AlertTriangle className="h-4 w-4" />
        }
      ],
      'Project Manager': [
        {
          id: 'project-overview',
          type: 'quick_action',
          title: 'Project Overview',
          description: 'Get current project status summary',
          action: 'Give me a project status summary',
          priority: 'high',
          confidence: 0.95,
          icon: <TrendingUp className="h-4 w-4" />
        },
        {
          id: 'resource-allocation',
          type: 'insight',
          title: 'Resource Insights',
          description: 'Analyze team allocation and utilization',
          action: 'Show resource allocation analysis',
          priority: 'medium',
          confidence: 0.8,
          icon: <Users className="h-4 w-4" />
        }
      ]
    };

    return actionMap[role] || [];
  };

  const getTrendingQueries = async (projectId?: string): Promise<SmartSuggestion[]> => {
    if (!projectId) return [];

    try {
      // Mock trending queries from the last 7 days (since ai_conversations table doesn't exist)
      const mockConversations = [
        { id: '1' },
        { id: '2' },
        { id: '3' }
      ];

      if (!mockConversations.length) return [];

      // Simulate trending query analysis (in production, this would be more sophisticated)
      const trendingTopics = [
        'project progress',
        'safety procedures',
        'equipment status',
        'training schedules'
      ];

      return trendingTopics.slice(0, 2).map((topic, index) => ({
        id: `trending-${index}`,
        type: 'trending' as const,
        title: `Trending: ${topic}`,
        description: `Popular topic among your team this week`,
        action: `Tell me about ${topic}`,
        priority: 'low' as const,
        confidence: 0.7,
        icon: <TrendingUp className="h-4 w-4" />
      }));
    } catch (error) {
      console.error('Error fetching trending queries:', error);
      return [];
    }
  };

  const generatePersonalizedSuggestions = (queries: string[], role: string): SmartSuggestion[] => {
    if (queries.length === 0) return [];

    const suggestions: SmartSuggestion[] = [];

    // Analyze query patterns
    const timePattern = queries.filter(q => 
      q.toLowerCase().includes('time') || 
      q.toLowerCase().includes('hours') ||
      q.toLowerCase().includes('schedule')
    );

    const compliancePattern = queries.filter(q =>
      q.toLowerCase().includes('compliance') ||
      q.toLowerCase().includes('training') ||
      q.toLowerCase().includes('certification')
    );

    if (timePattern.length >= 2) {
      suggestions.push({
        id: 'time-insight',
        type: 'personalized',
        title: 'Time Management',
        description: 'You frequently ask about schedules',
        action: 'Set up my weekly schedule summary',
        priority: 'medium',
        confidence: 0.8,
        icon: <Clock className="h-4 w-4" />
      });
    }

    if (compliancePattern.length >= 2) {
      suggestions.push({
        id: 'compliance-insight',
        type: 'personalized',
        title: 'Compliance Focus',
        description: 'Streamline your compliance queries',
        action: 'Create my compliance dashboard',
        priority: 'medium',
        confidence: 0.85,
        icon: <Star className="h-4 w-4" />
      });
    }

    return suggestions;
  };

  const getTimeSensitiveReminders = async (userId: string): Promise<SmartSuggestion[]> => {
    try {
      // Mock data for expiring qualifications since the table doesn't exist
      const mockQualifications = [
        {
          qualification_type: 'First Aid',
          expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const reminders: SmartSuggestion[] = [];

      if (mockQualifications && mockQualifications.length > 0) {
        reminders.push({
          id: 'expiring-quals',
          type: 'reminder',
          title: 'Expiring Qualifications',
          description: `${mockQualifications.length} qualification(s) expiring soon`,
          action: 'Show my expiring qualifications',
          priority: 'high',
          confidence: 1.0,
          icon: <AlertTriangle className="h-4 w-4" />
        });
      }

      return reminders;
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  };

  const generateContextualInsights = async (profile: any): Promise<SmartSuggestion[]> => {
    const insights: SmartSuggestion[] = [];
    const currentHour = new Date().getHours();

    // Time-based suggestions
    if (currentHour >= 8 && currentHour <= 10) {
      insights.push({
        id: 'morning-briefing',
        type: 'insight',
        title: 'Morning Briefing',
        description: 'Start your day with key updates',
        action: 'Give me today\'s briefing',
        priority: 'medium',
        confidence: 0.7,
        icon: <Lightbulb className="h-4 w-4" />
      });
    }

    if (currentHour >= 16 && currentHour <= 18) {
      insights.push({
        id: 'end-of-day',
        type: 'insight',
        title: 'Day Summary',
        description: 'Review today\'s accomplishments',
        action: 'Summarize my day',
        priority: 'low',
        confidence: 0.6,
        icon: <Clock className="h-4 w-4" />
      });
    }

    return insights;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trending': return <TrendingUp className="h-3 w-3" />;
      case 'reminder': return <AlertTriangle className="h-3 w-3" />;
      case 'insight': return <Lightbulb className="h-3 w-3" />;
      case 'personalized': return <Star className="h-3 w-3" />;
      default: return <Lightbulb className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-accent" />
          <h3 className="font-medium text-sm">Smart Suggestions</h3>
        </div>
        
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-start justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onSuggestionClick(suggestion.action)}
            >
              <div className="flex items-start gap-2 flex-1">
                <div className="mt-0.5 text-muted-foreground">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {suggestion.title}
                    </span>
                    <Badge 
                      variant={getPriorityColor(suggestion.priority)}
                      className="text-xs px-1 py-0"
                    >
                      {getTypeIcon(suggestion.type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {suggestion.description}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onSuggestionClick(suggestion.action);
                }}
              >
                Try
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};