import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Mic, 
  MicOff, 
  Send, 
  Star, 
  Clock, 
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  FileText,
  AlertTriangle,
  Smartphone,
  Wifi,
  WifiOff,
  Sparkles,
  RefreshCw,
  Camera,
  Volume2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { supabase } from '@/integrations/supabase/client';

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
}

interface SmartPromptLibraryProps {
  onPromptExecuted?: (response: string) => void;
}

export const SmartPromptLibrary: React.FC<SmartPromptLibraryProps> = ({ onPromptExecuted }) => {
  const { toast } = useToast();
  const { profile: userProfile } = useUserProfile();
  const { 
    mobileFeatures, 
    isOneHandedMode, 
    optimizeAudioForMobile,
    cacheMessageOffline 
  } = useMobileOptimization();

  const [prompts, setPrompts] = useState<SmartPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<SmartPrompt | null>(null);
  const [inputText, setInputText] = useState('');
  const [contextData, setContextData] = useState<Record<string, any>>({});
  const [executing, setExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);

  // Category colors for visual organization
  const getCategoryColor = (category: string) => {
    const colors = {
      timesheet: 'bg-blue-500/10 text-blue-700 border-blue-200',
      compliance: 'bg-red-500/10 text-red-700 border-red-200',
      safety: 'bg-orange-500/10 text-orange-700 border-orange-200',
      team: 'bg-green-500/10 text-green-700 border-green-200',
      planning: 'bg-purple-500/10 text-purple-700 border-purple-200',
      finance: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      performance: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
      system: 'bg-gray-500/10 text-gray-700 border-gray-200',
      delivery: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      progress: 'bg-teal-500/10 text-teal-700 border-teal-200'
    };
    return colors[category as keyof typeof colors] || colors.system;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      timesheet: Clock,
      compliance: Shield,
      safety: AlertTriangle,
      team: Users,
      planning: BarChart3,
      finance: TrendingUp,
      performance: BarChart3,
      system: Smartphone,
      delivery: FileText,
      progress: TrendingUp
    };
    const IconComponent = icons[category as keyof typeof icons] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  // Load role-specific smart prompts
  useEffect(() => {
    const loadSmartPrompts = async () => {
      if (!userProfile?.role) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .rpc('get_role_smart_prompts', { p_role: userProfile.role });

        if (error) throw error;

        const processedPrompts = (data || []).map((prompt: any) => ({
          ...prompt,
          context_fields: Array.isArray(prompt.context_fields) ? prompt.context_fields : 
                         typeof prompt.context_fields === 'string' ? JSON.parse(prompt.context_fields) : []
        }));
        setPrompts(processedPrompts);
        console.log(`Loaded ${processedPrompts.length} smart prompts for ${userProfile.role}`);
      } catch (error) {
        console.error('Error loading smart prompts:', error);
        toast({
          title: "Error Loading Prompts",
          description: "Could not load smart prompts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadSmartPrompts();
  }, [userProfile?.role, toast]);

  // Monitor offline status
  useEffect(() => {
    setShowOfflineIndicator(mobileFeatures.isOffline);
    if (mobileFeatures.isOffline) {
      toast({
        title: "📱 Offline Mode",
        description: "Cached responses available. Changes will sync when online.",
      });
    }
  }, [mobileFeatures.isOffline, toast]);

  // Initialize voice recording
  const initializeVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: mobileFeatures.connectionType === 'slow-2g' ? 16000 : 44100
        }
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const optimizedBlob = await optimizeAudioForMobile(audioBlob);
          await processVoiceInput(optimizedBlob);
        }
        setAudioChunks([]);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      return recorder;
    } catch (error) {
      console.error('Error initializing voice recording:', error);
      toast({
        title: "Voice Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
      return null;
    }
  }, [audioChunks, optimizeAudioForMobile, toast, mobileFeatures.connectionType]);

  // Process voice input using OpenAI Whisper
  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64 for edge function
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data.text) {
          setInputText(data.text);
          toast({
            title: "🎤 Voice Captured",
            description: `Transcribed: "${data.text.substring(0, 50)}..."`,
          });
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast({
        title: "Voice Processing Error",
        description: "Could not process voice input. Please try typing instead.",
        variant: "destructive"
      });
    }
  };

  // Toggle voice recording
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    } else {
      const recorder = await initializeVoiceRecording();
      if (recorder) {
        recorder.start();
        setIsRecording(true);
        
        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }
  };

  // Execute smart prompt
  const executeSmartPrompt = async (prompt: SmartPrompt, customInput?: string) => {
    const input = customInput || inputText || prompt.example_input || '';
    
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide input for the prompt or use voice input.",
        variant: "destructive"
      });
      return;
    }

    try {
      setExecuting(true);
      setExecutionProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setExecutionProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.functions.invoke('smart-prompt-execute', {
        body: {
          template_id: prompt.id,
          input_text: input,
          context: contextData,
          mobile_device: mobileFeatures.deviceType === 'mobile',
          voice_input: isRecording,
          offline_mode: mobileFeatures.isOffline
        }
      });

      clearInterval(progressInterval);
      setExecutionProgress(100);

      if (error) throw error;

      if (data.success) {
        setLastResponse(data.response);
        onPromptExecuted?.(data.response);
        
        // Cache offline if needed
        if (mobileFeatures.isOffline) {
          cacheMessageOffline(input, data.response);
        }

        toast({
          title: `✨ ${prompt.title}`,
          description: `Completed in ${data.execution_time_ms}ms • ${data.tokens_used} tokens`,
        });

        // Clear input after successful execution
        setInputText('');
        setSelectedPrompt(null);
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('Error executing smart prompt:', error);
      toast({
        title: "Execution Error",
        description: error instanceof Error ? error.message : "Could not execute prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExecuting(false);
      setExecutionProgress(0);
    }
  };

  // Quick execute prompt (one-tap)
  const quickExecutePrompt = (prompt: SmartPrompt) => {
    if (prompt.example_input) {
      executeSmartPrompt(prompt, prompt.example_input);
    } else {
      setSelectedPrompt(prompt);
      setInputText('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Sparkles className="h-8 w-8 mx-auto text-primary animate-pulse mb-2" />
          <p className="text-sm text-muted-foreground">Loading your smart prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with offline indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Smart Prompt Library</h2>
          <p className="text-sm text-muted-foreground">
            {prompts.length} role-specific prompts for {userProfile?.role}
          </p>
        </div>
        {showOfflineIndicator && (
          <Badge variant="outline" className="text-orange-600">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        )}
      </div>

      {/* Quick Action Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <Card 
            key={prompt.id} 
            className={`
              cursor-pointer transition-all duration-200 hover:shadow-md
              ${mobileFeatures.deviceType === 'mobile' ? 'min-h-[120px]' : 'min-h-[100px]'}
              ${selectedPrompt?.id === prompt.id ? 'ring-2 ring-primary' : ''}
            `}
            onClick={() => quickExecutePrompt(prompt)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(prompt.category)}
                  <CardTitle className="text-sm font-medium line-clamp-1">
                    {prompt.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-muted-foreground">
                    {prompt.avg_rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs w-fit ${getCategoryColor(prompt.category)}`}
              >
                {prompt.category}
              </Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {prompt.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{prompt.usage_count} uses</span>
                {prompt.requires_context && (
                  <Badge variant="secondary" className="text-xs">
                    Context
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Prompt Interface */}
      {selectedPrompt && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon(selectedPrompt.category)}
                {selectedPrompt.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPrompt(null)}
              >
                ✕
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedPrompt.description}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Context Fields */}
            {selectedPrompt.requires_context && selectedPrompt.context_fields.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Additional Context</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedPrompt.context_fields.map((field) => (
                    <Input
                      key={field}
                      placeholder={field.replace('_', ' ').toUpperCase()}
                      value={contextData[field] || ''}
                      onChange={(e) => setContextData(prev => ({
                        ...prev,
                        [field]: e.target.value
                      }))}
                      className={mobileFeatures.deviceType === 'mobile' ? 'text-base' : ''}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Your Input</h4>
                {selectedPrompt.example_input && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInputText(selectedPrompt.example_input || '')}
                    className="text-xs"
                  >
                    Use Example
                  </Button>
                )}
              </div>
              <div className="relative">
                <Textarea
                  placeholder={selectedPrompt.example_input || "Enter your request..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={`
                    min-h-[100px] resize-none
                    ${mobileFeatures.deviceType === 'mobile' ? 'text-base' : ''}
                  `}
                />
                
                {/* Voice Input Button - Mobile Optimized */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`
                    absolute top-2 right-2 h-8 w-8 p-0
                    ${isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}
                    ${mobileFeatures.deviceType === 'mobile' ? 'h-10 w-10' : ''}
                  `}
                  onClick={toggleVoiceRecording}
                  disabled={executing}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Execution Progress */}
            {executing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing your request...
                </div>
                <Progress value={executionProgress} className="h-2" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => executeSmartPrompt(selectedPrompt)}
                disabled={executing || !inputText.trim()}
                className={`
                  flex-1
                  ${mobileFeatures.deviceType === 'mobile' ? 'h-12 text-base' : ''}
                `}
              >
                <Send className="h-4 w-4 mr-2" />
                Execute Prompt
              </Button>
              
              {selectedPrompt.example_input && (
                <Button
                  variant="outline"
                  onClick={() => executeSmartPrompt(selectedPrompt, selectedPrompt.example_input)}
                  disabled={executing}
                  className={`
                    ${mobileFeatures.deviceType === 'mobile' ? 'h-12' : ''}
                  `}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Response Display */}
      {lastResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm">
                {lastResponse}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Status Bar */}
      {mobileFeatures.deviceType === 'mobile' && (
        <div className="flex items-center justify-between text-xs text-muted-foreground p-2 bg-muted/30 rounded">
          <div className="flex items-center gap-2">
            {mobileFeatures.isOffline ? (
              <WifiOff className="h-3 w-3" />
            ) : (
              <Wifi className="h-3 w-3" />
            )}
            <span>{mobileFeatures.connectionType}</span>
          </div>
          
          {mobileFeatures.batteryLevel && (
            <div className="flex items-center gap-1">
              <span>{Math.round(mobileFeatures.batteryLevel)}%</span>
              {mobileFeatures.isLowPower && (
                <AlertTriangle className="h-3 w-3 text-orange-500" />
              )}
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Smartphone className="h-3 w-3" />
            {isOneHandedMode && <span>One-handed</span>}
          </div>
        </div>
      )}
    </div>
  );
};