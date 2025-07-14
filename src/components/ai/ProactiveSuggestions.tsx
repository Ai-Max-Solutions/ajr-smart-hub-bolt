import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Lightbulb, 
  X, 
  ExternalLink, 
  MessageCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { usePersonalizedAI } from '@/hooks/usePersonalizedAI';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';

interface ProactiveSuggestionsProps {
  onSuggestionClick?: (suggestion: any) => void;
  maxSuggestions?: number;
}

export const ProactiveSuggestions: React.FC<ProactiveSuggestionsProps> = ({
  onSuggestionClick,
  maxSuggestions = 3
}) => {
  const { profile } = useUserProfile();
  const { suggestions, patterns, markSuggestionShown } = usePersonalizedAI();
  const { toast } = useToast();
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Filter and sort suggestions
  const activeSuggestions = suggestions
    .filter(s => !dismissedSuggestions.has(s.id))
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, maxSuggestions);

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'morning_summary':
        return <Clock className="h-4 w-4" />;
      case 'compliance_reminder':
        return <AlertTriangle className="h-4 w-4" />;
      case 'pattern_based':
        return <TrendingUp className="h-4 w-4" />;
      case 'predictive':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  // Get color for suggestion type
  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'morning_summary':
        return 'text-blue-600 border-blue-200';
      case 'compliance_reminder':
        return 'text-orange-600 border-orange-200';
      case 'pattern_based':
        return 'text-green-600 border-green-200';
      case 'predictive':
        return 'text-purple-600 border-purple-200';
      default:
        return 'text-gray-600 border-gray-200';
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: any) => {
    try {
      // Mark as shown
      await markSuggestionShown(suggestion.id);
      
      // Execute action based on type
      if (suggestion.action_type === 'open_chat' && onSuggestionClick) {
        onSuggestionClick(suggestion);
      } else if (suggestion.action_type === 'external_link' && suggestion.action_data?.url) {
        window.open(suggestion.action_data.url, '_blank');
      }

      toast({
        title: "Suggestion Applied",
        description: suggestion.title,
        duration: 3000
      });
    } catch (error) {
      console.error('Error handling suggestion click:', error);
    }
  };

  // Dismiss suggestion
  const handleDismiss = async (suggestionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await markSuggestionShown(suggestionId);
      setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  // Format time until suggestion expires
  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (activeSuggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-primary" />
          Smart Suggestions
          <Badge variant="secondary" className="ml-auto">
            {activeSuggestions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {activeSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`relative p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getSuggestionColor(suggestion.suggestion_type)}`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDismiss(suggestion.id, e)}
                className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>

              <div className="flex items-start gap-3 pr-8">
                <div className="flex-shrink-0 mt-0.5">
                  {getSuggestionIcon(suggestion.suggestion_type)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm leading-tight">
                    {suggestion.title}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {suggestion.content}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.suggestion_type.replace('_', ' ')}
                      </Badge>
                      
                      {suggestion.confidence_score >= 0.8 && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          High confidence
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {suggestion.action_type === 'open_chat' && (
                        <MessageCircle className="h-3 w-3" />
                      )}
                      {suggestion.action_type === 'external_link' && (
                        <ExternalLink className="h-3 w-3" />
                      )}
                      <span>Expires {getTimeUntilExpiry(suggestion.expires_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {patterns.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <h5 className="text-sm font-medium text-muted-foreground mb-2">
              Your Usage Patterns
            </h5>
            <div className="flex flex-wrap gap-2">
              {patterns.slice(0, 3).map((pattern, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs"
                >
                  {pattern.pattern_type.replace('_', ' ')} 
                  ({Math.round(pattern.confidence_level * 100)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};