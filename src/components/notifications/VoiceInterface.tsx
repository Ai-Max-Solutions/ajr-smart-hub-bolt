import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInterfaceProps {
  onCommand: (command: string, notificationId?: string) => void;
}

interface VoiceCommand {
  intent: 'read' | 'acknowledge' | 'dismiss' | 'escalate' | 'sign';
  confidence: number;
  notificationId?: string;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          setLastCommand(transcript);
          processVoiceCommand(transcript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: 'Voice recognition error',
            description: 'Please try again',
            variant: 'destructive'
          });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    } else {
      console.warn('Speech recognition not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Process voice commands using AI
  const processVoiceCommand = async (transcript: string) => {
    try {
      setIsProcessing(true);

      // Simple command parsing (in production, this would use more sophisticated NLP)
      const command = parseVoiceCommand(transcript);
      
      if (command) {
        // Log voice interaction
        await supabase
          .from('voice_interaction_logs')
          .insert({
            command_text: transcript,
            intent_detected: command.intent,
            confidence_score: command.confidence,
            action_successful: true,
            background_noise_level: 'low', // This would be detected from audio analysis
            location_context: 'office', // This could be determined from device context
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform
            }
          });

        // Execute command
        onCommand(command.intent, command.notificationId);

        // Provide voice feedback
        if (speechEnabled) {
          speakResponse(command.intent);
        }

        toast({
          title: 'Voice command executed',
          description: `Command: ${command.intent}`,
          duration: 2000
        });
      } else {
        throw new Error('Command not recognized');
      }
    } catch (error: any) {
      console.error('Error processing voice command:', error);
      
      // Log failed interaction
      await supabase
        .from('voice_interaction_logs')
        .insert({
          command_text: transcript,
          intent_detected: 'unknown',
          confidence_score: 0,
          action_successful: false,
          error_message: error.message
        });

      toast({
        title: 'Voice command failed',
        description: 'Could not understand the command',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse voice commands
  const parseVoiceCommand = (transcript: string): VoiceCommand | null => {
    const text = transcript.toLowerCase().trim();
    
    // Command patterns
    const patterns = [
      { regex: /mark.*read|read.*notification/i, intent: 'read' as const, confidence: 0.8 },
      { regex: /acknowledge|confirm|got it|understood/i, intent: 'acknowledge' as const, confidence: 0.8 },
      { regex: /dismiss|close|ignore/i, intent: 'dismiss' as const, confidence: 0.7 },
      { regex: /escalate|urgent|priority/i, intent: 'escalate' as const, confidence: 0.7 },
      { regex: /sign|approve|accept/i, intent: 'sign' as const, confidence: 0.8 }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        return {
          intent: pattern.intent,
          confidence: pattern.confidence
        };
      }
    }

    return null;
  };

  // Text-to-speech response
  const speakResponse = (intent: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;

    const responses = {
      read: 'Notification marked as read',
      acknowledge: 'Notification acknowledged',
      dismiss: 'Notification dismissed',
      escalate: 'Notification escalated',
      sign: 'Document signed'
    };

    const utterance = new SpeechSynthesisUtterance(responses[intent as keyof typeof responses] || 'Command executed');
    utterance.rate = 0.8;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  // Start voice recording
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  // Stop voice recording
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (!speechEnabled) {
      speakResponse('read'); // Test speech
    }
  };

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  if (!isSupported) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <MicOff className="h-5 w-5 text-orange-600" />
            <span className="text-sm text-orange-800">
              Voice commands not supported in this browser
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className="min-w-[100px]"
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Listen
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={toggleSpeech}
              >
                {speechEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </div>

            {isListening && (
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm text-muted-foreground">Listening...</span>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Processing...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Voice Commands Active
            </Badge>
            {lastCommand && (
              <Badge variant="secondary" className="text-xs max-w-48 truncate">
                Last: "{lastCommand}"
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          <p><strong>Voice Commands:</strong></p>
          <p>• "Mark as read" - Mark notification as read</p>
          <p>• "Acknowledge" - Acknowledge notification</p>
          <p>• "Dismiss" - Dismiss notification</p>
          <p>• "Sign" - Sign document</p>
        </div>
      </CardContent>
    </Card>
  );
};