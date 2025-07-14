import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Mic, 
  MicOff, 
  ThumbsUp, 
  ThumbsDown, 
  Settings,
  Sparkles,
  Clock,
  User,
  Bot,
  Volume2,
  VolumeX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePersonalizedAI } from '@/hooks/usePersonalizedAI';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  feedback?: 'positive' | 'negative';
  personalized?: boolean;
}

interface PersonalizedAIChatProps {
  onToggle?: () => void;
  isVoiceMode?: boolean;
}

export const PersonalizedAIChat: React.FC<PersonalizedAIChatProps> = ({
  onToggle,
  isVoiceMode = false
}) => {
  const { profile } = useUserProfile();
  const { mobileFeatures } = useMobileOptimization();
  const { 
    preferences, 
    personalizedGreeting, 
    submitFeedback,
    getPersonalizedContext 
  } = usePersonalizedAI();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [responseTime, setResponseTime] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add personalized greeting message
  useEffect(() => {
    if (personalizedGreeting && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        content: `${personalizedGreeting} How can I help you today?`,
        role: 'assistant',
        timestamp: new Date(),
        personalized: true
      }]);
    }
  }, [personalizedGreeting, messages.length]);

  // Send message to personalized AI
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const startTime = Date.now();

    try {
      // Get personalized context
      const context = await getPersonalizedContext();
      
      const { data, error } = await supabase.functions.invoke('ai-personalized-chat', {
        body: {
          message: messageText,
          conversation_id: conversationId,
          context_data: {
            device_type: mobileFeatures.deviceType,
            is_mobile: mobileFeatures.deviceType === 'mobile',
            voice_mode: isVoiceMode,
            user_context: context
          }
        }
      });

      if (error) throw error;

      // Handle streaming response
      const reader = data.getReader();
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true,
        personalized: true
      };

      setMessages(prev => [...prev, assistantMessage]);

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
                assistantMessage.content += data.content;
                if (data.conversation_id) {
                  setConversationId(data.conversation_id);
                }
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...assistantMessage }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Mark as complete
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      // Text-to-speech for voice mode
      if (isVoiceMode && preferences?.voice_enabled && assistantMessage.content) {
        speakResponse(assistantMessage.content);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Communication Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading, 
    conversationId, 
    mobileFeatures, 
    isVoiceMode, 
    preferences?.voice_enabled,
    getPersonalizedContext,
    toast
  ]);

  // Voice recording
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { audio: base64Audio }
              });

              if (error) throw error;

              if (data.text) {
                setInput(data.text);
                await sendMessage(data.text);
              }
            } catch (error) {
              console.error('Voice transcription error:', error);
              toast({
                title: "Voice Recognition Error",
                description: "Failed to transcribe audio. Please try again.",
                variant: "destructive"
              });
            }
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Microphone Access Error",
          description: "Please allow microphone access for voice input.",
          variant: "destructive"
        });
      }
    }
  }, [isRecording, sendMessage, toast]);

  // Text-to-speech
  const speakResponse = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Handle feedback
  const handleFeedback = useCallback(async (
    messageId: string, 
    feedbackType: 'positive' | 'negative'
  ) => {
    if (!conversationId) return;

    try {
      await submitFeedback(
        messageId,
        feedbackType,
        feedbackType === 'positive' ? 'thumbs_up' : 'thumbs_down'
      );

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, feedback: feedbackType }
            : msg
        )
      );

      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping improve the AI assistant!",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  }, [conversationId, submitFeedback, toast]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Personalized AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            {responseTime > 0 && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {responseTime}ms
              </Badge>
            )}
            {isSpeaking && (
              <Button
                variant="ghost"
                size="sm"
                onClick={stopSpeaking}
                className="h-8 w-8 p-0"
              >
                <VolumeX className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {profile && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{profile.role}</Badge>
            {preferences?.preferred_tone && (
              <Badge variant="outline">{preferences.preferred_tone} tone</Badge>
            )}
            {mobileFeatures.deviceType === 'mobile' && (
              <Badge variant="outline">📱 Mobile</Badge>
            )}
          </div>
        )}
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-foreground flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                        {message.isStreaming && (
                          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                        )}
                      </p>
                      {message.personalized && message.role === 'assistant' && (
                        <div className="flex items-center gap-1 mt-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="text-xs text-muted-foreground">Personalized</span>
                        </div>
                      )}
                    </div>
                    
                    {message.role === 'assistant' && !message.isStreaming && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, 'positive')}
                          className={`h-6 w-6 p-0 ${
                            message.feedback === 'positive' 
                              ? 'text-green-600 bg-green-50' 
                              : 'text-muted-foreground hover:text-green-600'
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, 'negative')}
                          className={`h-6 w-6 p-0 ${
                            message.feedback === 'negative' 
                              ? 'text-red-600 bg-red-50' 
                              : 'text-muted-foreground hover:text-red-600'
                          }`}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                        {preferences?.voice_enabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => speakResponse(message.content)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  personalizedGreeting 
                    ? `Ask me anything, ${profile?.firstname || 'there'}...`
                    : "Type your message..."
                }
                disabled={isLoading}
                className="pr-12"
              />
              {preferences?.voice_enabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleRecording}
                  className={`absolute right-1 top-1 h-8 w-8 p-0 ${
                    isRecording ? 'text-red-600 bg-red-50' : ''
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          
          {isLoading && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <div className="animate-pulse">💭</div>
              Thinking with personalized context...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};