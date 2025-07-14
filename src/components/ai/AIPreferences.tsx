import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Volume2, 
  MessageSquare, 
  Lightbulb, 
  Clock,
  Zap,
  User
} from 'lucide-react';
import { usePersonalizedAI } from '@/hooks/usePersonalizedAI';
import { useUserProfile } from '@/hooks/useUserProfile';

export const AIPreferences: React.FC = () => {
  const { profile } = useUserProfile();
  const { preferences, updatePreferences } = usePersonalizedAI();

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Loading preferences...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI Assistant Preferences
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{profile?.role}</Badge>
          <Badge variant="outline">{profile?.primaryskill || 'General'}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Communication Style */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Communication Style</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="greeting-style">Greeting Style</Label>
              <Select
                value={preferences.greeting_style}
                onValueChange={(value: 'formal' | 'friendly' | 'casual') => 
                  updatePreferences({ greeting_style: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select greeting style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal & Professional</SelectItem>
                  <SelectItem value="friendly">Friendly & Professional</SelectItem>
                  <SelectItem value="casual">Casual & Relaxed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">AI Tone</Label>
              <Select
                value={preferences.preferred_tone}
                onValueChange={(value: 'professional' | 'encouraging' | 'direct') => 
                  updatePreferences({ preferred_tone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="encouraging">Encouraging & Positive</SelectItem>
                  <SelectItem value="direct">Direct & Efficient</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="response-length">Response Length</Label>
              <Select
                value={preferences.response_length}
                onValueChange={(value: 'brief' | 'balanced' | 'detailed') => 
                  updatePreferences({ response_length: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select response length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief & Concise</SelectItem>
                  <SelectItem value="balanced">Balanced Detail</SelectItem>
                  <SelectItem value="detailed">Detailed & Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terminology">Trade Terminology Level</Label>
              <Select
                value={preferences.trade_terminology_level}
                onValueChange={(value: 'basic' | 'standard' | 'advanced') => 
                  updatePreferences({ trade_terminology_level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select terminology level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Terms</SelectItem>
                  <SelectItem value="standard">Standard Trade Terms</SelectItem>
                  <SelectItem value="advanced">Advanced Technical Terms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Voice & Audio */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Voice & Audio</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="voice-enabled">Voice Input & Output</Label>
              <p className="text-sm text-muted-foreground">
                Enable voice commands and audio responses
              </p>
            </div>
            <Switch
              id="voice-enabled"
              checked={preferences.voice_enabled}
              onCheckedChange={(checked) => updatePreferences({ voice_enabled: checked })}
            />
          </div>
        </div>

        <Separator />

        {/* Proactive Features */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Proactive Intelligence</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="proactive-suggestions">Smart Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                  Get proactive suggestions based on your work patterns
                </p>
              </div>
              <Switch
                id="proactive-suggestions"
                checked={preferences.proactive_suggestions}
                onCheckedChange={(checked) => updatePreferences({ proactive_suggestions: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="morning-summary">Morning Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a personalized morning briefing
                </p>
              </div>
              <Switch
                id="morning-summary"
                checked={preferences.morning_summary}
                onCheckedChange={(checked) => updatePreferences({ morning_summary: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-frequency">Notification Frequency</Label>
            <Select
              value={preferences.notification_frequency}
              onValueChange={(value: 'minimal' | 'normal' | 'frequent') => 
                updatePreferences({ notification_frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal - Only urgent</SelectItem>
                <SelectItem value="normal">Normal - Balanced notifications</SelectItem>
                <SelectItem value="frequent">Frequent - All suggestions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Quick Stats */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Personalization Status</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <User className="h-4 w-4 mx-auto mb-1 text-primary" />
              <div className="text-sm font-medium">Profile</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <MessageSquare className="h-4 w-4 mx-auto mb-1 text-primary" />
              <div className="text-sm font-medium">Learning</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
              <div className="text-sm font-medium">Patterns</div>
              <div className="text-xs text-muted-foreground">Analyzing</div>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <Lightbulb className="h-4 w-4 mx-auto mb-1 text-primary" />
              <div className="text-sm font-medium">Suggestions</div>
              <div className="text-xs text-muted-foreground">Enabled</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};