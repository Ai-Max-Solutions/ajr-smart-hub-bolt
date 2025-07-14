import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Mic, 
  BarChart3, 
  Shield, 
  Users, 
  FileText,
  TrendingUp,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { AIChat } from './AIChat';
import { VoiceInterface } from './VoiceInterface';
import { SmartPromptLibrary } from './SmartPromptLibrary';
import { PersonalizedAIChat } from './PersonalizedAIChat';
import { ProactiveSuggestions } from './ProactiveSuggestions';
import { AIPreferences } from './AIPreferences';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { usePersonalizedAI } from '@/hooks/usePersonalizedAI';

export const AIDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastPromptResponse, setLastPromptResponse] = useState<string>('');
  const [showPreferences, setShowPreferences] = useState(false);
  const { profile: userProfile } = useUserProfile();
  const { mobileFeatures, isOneHandedMode } = useMobileOptimization();
  const { personalizedGreeting, isLoading: aiLoading } = usePersonalizedAI();

  const getRoleFeatures = (role: string) => {
    const features = {
      'Operative': [
        { icon: FileText, title: 'My Timesheets', description: 'View and ask about your timesheet data' },
        { icon: Shield, title: 'Training Status', description: 'Check your compliance and training records' },
        { icon: BarChart3, title: 'My Performance', description: 'Track your work progress and metrics' }
      ],
      'Supervisor': [
        { icon: Users, title: 'Team Management', description: 'Manage your team and assignments' },
        { icon: Shield, title: 'Safety Oversight', description: 'Monitor team safety and compliance' },
        { icon: FileText, title: 'Project Documents', description: 'Access RAMS and project documentation' }
      ],
      'Project Manager': [
        { icon: BarChart3, title: 'Project Analytics', description: 'Comprehensive project performance data' },
        { icon: Users, title: 'Resource Planning', description: 'Manage teams and resource allocation' },
        { icon: TrendingUp, title: 'Progress Tracking', description: 'Monitor project milestones and delivery' }
      ],
      'Admin': [
        { icon: Users, title: 'User Management', description: 'Manage users, roles, and permissions' },
        { icon: Shield, title: 'Security & Compliance', description: 'Monitor system security and compliance' },
        { icon: FileText, title: 'Audit Logs', description: 'Access comprehensive audit trails' }
      ],
      'Document Controller': [
        { icon: FileText, title: 'Document Management', description: 'Manage RAMS, drawings, and approvals' },
        { icon: Shield, title: 'Version Control', description: 'Track document versions and changes' },
        { icon: BarChart3, title: 'Document Analytics', description: 'Monitor document usage and compliance' }
      ],
      'Director': [
        { icon: TrendingUp, title: 'Strategic Analytics', description: 'Company-wide performance insights' },
        { icon: BarChart3, title: 'Executive Dashboard', description: 'Key performance indicators and trends' },
        { icon: AlertTriangle, title: 'Risk Management', description: 'Monitor organizational risks and compliance' }
      ]
    };

    return features[role as keyof typeof features] || features['Operative'];
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'Operative': 'text-blue-600 border-blue-200 bg-blue-50',
      'Supervisor': 'text-green-600 border-green-200 bg-green-50',
      'Project Manager': 'text-purple-600 border-purple-200 bg-purple-50',
      'Admin': 'text-red-600 border-red-200 bg-red-50',
      'Document Controller': 'text-yellow-600 border-yellow-200 bg-yellow-50',
      'Director': 'text-indigo-600 border-indigo-200 bg-indigo-50'
    };
    return colors[role as keyof typeof colors] || 'text-gray-600 border-gray-200 bg-gray-50';
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-pulse">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          </div>
          <p className="text-muted-foreground">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  const roleFeatures = getRoleFeatures(userProfile.role);

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isOneHandedMode ? 'one-handed-mode' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AJ Ryan AI Assistant</h1>
          <p className="text-muted-foreground">
            {personalizedGreeting || 'Intelligent support tailored for your role and responsibilities'}
          </p>
          {mobileFeatures.deviceType === 'mobile' && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                📱 Mobile Optimized
              </Badge>
              {mobileFeatures.isOffline && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  Offline Mode
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getRoleColor(userProfile.role)}>
            {userProfile.role}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreferences(!showPreferences)}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Proactive Suggestions */}
      <ProactiveSuggestions 
        onSuggestionClick={(suggestion) => {
          if (suggestion.action_type === 'open_chat') {
            setActiveTab('chat');
          }
        }}
        maxSuggestions={3}
      />

      {/* AI Preferences Panel */}
      {showPreferences && (
        <div className="mb-6">
          <AIPreferences />
        </div>
      )}

      {/* Role-specific features overview */}
      {!showPreferences && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {roleFeatures.map((feature, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <feature.icon className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${mobileFeatures.deviceType === 'mobile' ? 'grid-cols-3' : 'grid-cols-3'}`}>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <div className="relative">
              <MessageCircle className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-primary to-primary-foreground rounded-full animate-pulse" />
            </div>
            {mobileFeatures.deviceType === 'mobile' ? 'AI Chat' : 'Personalized Chat'}
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            {mobileFeatures.deviceType === 'mobile' ? 'Prompts' : 'Smart Prompts'}
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            {mobileFeatures.deviceType === 'mobile' ? 'Voice' : 'Voice Assistant'}
            {isSpeaking && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <PersonalizedAIChat 
            isVoiceMode={false}
            onToggle={() => setShowPreferences(!showPreferences)}
          />
        </TabsContent>

        <TabsContent value="prompts" className="mt-6">
          <SmartPromptLibrary 
            onPromptExecuted={(response) => {
              setLastPromptResponse(response);
              // Optionally switch to chat tab to show full response
              if (response.length > 500) {
                setActiveTab('chat');
              }
            }}
          />
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <VoiceInterface onSpeakingChange={setIsSpeaking} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {userProfile.role === 'Operative' && (
              <>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">My Timesheets</div>
                    <div className="text-sm text-muted-foreground">View recent entries</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Training Status</div>
                    <div className="text-sm text-muted-foreground">Check compliance</div>
                  </div>
                </Button>
              </>
            )}
            
            {(userProfile.role === 'Supervisor' || userProfile.role === 'Project Manager') && (
              <>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Team Overview</div>
                    <div className="text-sm text-muted-foreground">View team status</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Project Progress</div>
                    <div className="text-sm text-muted-foreground">Track milestones</div>
                  </div>
                </Button>
              </>
            )}
            
            {userProfile.role === 'Director' && (
              <>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Company Analytics</div>
                    <div className="text-sm text-muted-foreground">Strategic insights</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Risk Assessment</div>
                    <div className="text-sm text-muted-foreground">Monitor compliance</div>
                  </div>
                </Button>
              </>
            )}

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Help & Support</div>
                <div className="text-sm text-muted-foreground">Get assistance</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};