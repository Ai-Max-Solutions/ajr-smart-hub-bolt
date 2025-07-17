import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, MessageCircle, Loader2, Smartphone, Camera, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SmartSuggestions } from './SmartSuggestions';
import { useAISelfDiagnostics } from '@/hooks/useAISelfDiagnostics';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { useSmartAutomations } from '@/hooks/useSmartAutomations';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

interface AIChatProps {
  onToggle?: () => void;
  isVoiceMode?: boolean;
}

export const AIChat: React.FC<AIChatProps> = ({ onToggle, isVoiceMode = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile();
  
  // Enhanced hooks for legendary features
  const aiDiagnostics = useAISelfDiagnostics();
  const mobileOptimization = useMobileOptimization();
  const smartAutomations = useSmartAutomations();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user) return;

    // Start AI diagnostics timer
    aiDiagnostics.startResponseTimer();
    
    // Update recent queries for smart suggestions
    setRecentQueries(prev => [messageText, ...prev].slice(0, 10));
    setShowSuggestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Cache for offline if needed
    if (mobileOptimization.mobileFeatures.isOffline) {
      mobileOptimization.cacheMessageOffline(messageText, 'Offline - message will be sent when connected');
      toast({
        title: "📱 Offline Mode",
        description: "Message cached - will send when connection restored",
      });
      return;
    }

    // Create streaming assistant message
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Mock security: Check rate limit before proceeding
      const rateLimitOk = true; // Mock: always allow for now
      
      if (!rateLimitOk) {
        throw new Error('Rate limit exceeded. Please wait before sending more messages.');
      }

      // Mock security: Sanitize input (basic check)
      const sanitizedMessage = messageText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      const finalMessage = sanitizedMessage || messageText;

      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          message: finalMessage,
          conversation_id: conversationId,
          user_role: userProfile?.role,
          mobile_optimized: mobileOptimization.mobileFeatures.deviceType === 'mobile',
          connection_type: mobileOptimization.mobileFeatures.connectionType
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Handle streaming response
      const reader = response.data.getReader();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedContent += data.content;
                
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              }
              
              if (data.conversation_id && !conversationId) {
                setConversationId(data.conversation_id);
              }

              // AI self-diagnostics: analyze context relevance
              if (data.context) {
                aiDiagnostics.analyzeContextRelevance(messageText, data.context);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Mark streaming as complete
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

      // AI diagnostics: end timer and check for hallucinations
      aiDiagnostics.endResponseTimer();
      const finalResponse = await aiDiagnostics.detectHallucination(messageText, accumulatedContent, []);
      
      // Bias detection
      if (userProfile?.role) {
        aiDiagnostics.detectBias(accumulatedContent, userProfile.role);
      }

      // Generate proactive insights
      aiDiagnostics.generateProactiveInsights(userProfile?.role || '', recentQueries);

      // Smart automations: check for triggers
      if (messageText.toLowerCase().includes('compliance') && userProfile?.role === 'Supervisor') {
        smartAutomations.monitorPODDiscrepancies();
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });

      // Remove failed assistant message
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
      
      // End timer even on error
      aiDiagnostics.endResponseTimer();
    } finally {
      setIsLoading(false);
      setShowSuggestions(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
    }
  };

  const toggleRecording = async () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Start voice recording with mobile optimization
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: mobileOptimization.mobileFeatures.deviceType === 'mobile'
          }
        });
        
        // Haptic feedback on mobile
        if ('vibrate' in navigator && mobileOptimization.mobileFeatures.deviceType === 'mobile') {
          navigator.vibrate(50);
        }
        
        toast({
          title: "🎤 Voice Recording",
          description: "Speak your question now - optimized for your device",
        });
      } catch (error) {
        toast({
          title: "Microphone Error",
          description: "Unable to access microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Processing...",
        description: "Converting your voice to text",
      });
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'Operative': 'bg-aj-yellow text-aj-navy-deep',
      'Supervisor': 'bg-green-500 text-white', 
      'Project Manager': 'bg-purple-500 text-white',
      'Admin': 'bg-red-500 text-white',
      'Document Controller': 'bg-aj-yellow text-aj-navy-deep',
      'Director': 'bg-indigo-500 text-white'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  // Register mobile gestures
  useEffect(() => {
    if (mobileOptimization.mobileFeatures.deviceType === 'mobile') {
      // Swipe left to repeat last query
      mobileOptimization.registerSwipeGesture({
        direction: 'left',
        action: () => {
          if (recentQueries.length > 0) {
            sendMessage(recentQueries[0]);
            toast({ title: "🔄 Repeated last query" });
          }
        }
      });

      // Swipe right to show suggestions
      mobileOptimization.registerSwipeGesture({
        direction: 'right',
        action: () => {
          setShowSuggestions(true);
          toast({ title: "💡 Smart suggestions shown" });
        }
      });
    }

    return () => {
      if (mobileOptimization.mobileFeatures.deviceType === 'mobile') {
        mobileOptimization.unregisterSwipeGesture('left');
        mobileOptimization.unregisterSwipeGesture('right');
      }
    };
  }, [recentQueries]);

  return (
    <div className={`w-full max-w-2xl mx-auto ${mobileOptimization.mobileFeatures.isPWA ? 'pwa-active' : ''}`}>
      {/* Smart Suggestions */}
      {showSuggestions && messages.length === 0 && (
        <div className="mb-4">
          <SmartSuggestions 
            recentQueries={recentQueries}
            onSuggestionClick={(suggestion) => {
              setInput(suggestion);
              setShowSuggestions(false);
            }}
          />
        </div>
      )}

      {/* PWA Install prompt */}
      {mobileOptimization.deferredPrompt && (
        <div className="mb-4">
          <Card className="border-accent">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Install SmartWork Hub</span>
                </div>
                <Button size="sm" onClick={mobileOptimization.installPWA}>
                  Install
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Offline indicator */}
      {mobileOptimization.mobileFeatures.isOffline && (
        <div className="mb-4">
          <Card className="border-warning offline-indicator">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-warning-foreground">
                <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                <span className="text-sm font-medium">Offline Mode</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className={`w-full h-[600px] flex flex-col mobile-optimized ${
        mobileOptimization.isOneHandedMode ? 'chat-interface' : ''
      }`}>
        <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle className="text-lg">AJ Ryan AI Assistant</CardTitle>
          </div>
          {userProfile && (
            <Badge className={getRoleColor(userProfile.role)}>
              {userProfile.role}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {userProfile?.role === 'Operative' 
            ? "Ask about your timesheets, training, and assigned work"
            : userProfile?.role === 'Director'
            ? "Get strategic insights and company-wide analytics"
            : "Get help with your role-specific tasks and information"
          }
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 gap-4">
        <ScrollArea className="flex-1 h-full" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Welcome to AJ Ryan AI</p>
                <p className="text-sm">Ask me anything about your work, training, or company processes</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                    )}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className={`${mobileOptimization.isOneHandedMode ? 'ai-controls' : ''}`}>
          <form onSubmit={handleSubmit} className="flex gap-2">
            {isVoiceMode && (
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={toggleRecording}
                disabled={isLoading}
                className="touch-target"
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}

            {mobileOptimization.mobileFeatures.deviceType === 'mobile' && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  // Trigger photo analysis (future feature)
                  toast({
                    title: "📸 Photo Analysis",
                    description: "Coming soon - analyze equipment photos",
                  });
                }}
                className="touch-target"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mobileOptimization.mobileFeatures.deviceType === 'mobile' 
                  ? "Ask me..." 
                  : "Ask me anything..."
              }
              disabled={isLoading}
              className="flex-1 text-input"
            />

            {mobileOptimization.mobileFeatures.deviceType === 'mobile' && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={mobileOptimization.toggleOneHandedMode}
                className="touch-target"
                title="Toggle one-handed mode"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading} 
              size="icon"
              className="touch-target"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Mobile swipe hints */}
          {mobileOptimization.mobileFeatures.deviceType === 'mobile' && messages.length === 0 && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              💡 Swipe left to repeat, right for suggestions
            </div>
          )}
        </div>
      </CardContent>
      </Card>

      {/* AI Performance Metrics (for admins) */}
      {userProfile?.role === 'Admin' && (
        <div className="mt-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">AI Performance</span>
                <div className="flex gap-4">
                  <span>Response: {aiDiagnostics.metrics.responseTime}ms</span>
                  <span>Accuracy: {(aiDiagnostics.metrics.accuracy * 100).toFixed(1)}%</span>
                  <span>Context: {(aiDiagnostics.metrics.contextRelevance * 100).toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};