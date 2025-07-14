import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Send, 
  Loader2, 
  Mic, 
  MicOff, 
  Sparkles, 
  MessageSquare,
  Check,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AIDABSAssistantProps {
  open: boolean;
  onClose: () => void;
  onUseContent: (title: string, content: string) => void;
  projectName?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIDABSAssistant = ({ open, onClose, onUseContent, projectName }: AIDABSAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{title: string; content: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      // Initialize with welcome message
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi! I'm your AI DABS assistant. I can help you create professional Daily Access Briefing System notices${projectName ? ` for ${projectName}` : ''}. 

Just tell me what you need to communicate to your operatives - I'll make it sound professional and structured. You can:
• Type rough notes about safety updates, access restrictions, or site changes
• Use voice input to speak your thoughts naturally
• Ask me to refine or adjust the content

What would you like to include in today's DABS briefing?`,
        timestamp: new Date()
      }]);
      setGeneratedContent(null);
    }
  }, [open, projectName]);

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { audio: base64Audio }
              });

              if (error) throw error;
              
              if (data?.text) {
                setInputText(prev => prev + ' ' + data.text);
                toast({
                  title: "Voice input added",
                  description: "Speech has been converted to text",
                });
              }
            } catch (error) {
              console.error('Voice to text error:', error);
              toast({
                title: "Error",
                description: "Failed to convert speech to text",
                variant: "destructive",
              });
            }
          };
          
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        setIsRecording(true);
        mediaRecorder.start();

        // Stop recording after 30 seconds
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
          }
        }, 30000);

      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Error",
          description: "Could not access microphone",
          variant: "destructive",
        });
      }
    } else {
      setIsRecording(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-dabs-assistant', {
        body: {
          message: userMessage.content,
          projectName: projectName || 'General Site',
          userRole: user?.role || 'Manager',
          conversationHistory: messages.slice(-4) // Last 4 messages for context
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If AI generated structured content, save it
      if (data.generatedContent) {
        setGeneratedContent(data.generatedContent);
      }

    } catch (error) {
      console.error('Error calling AI assistant:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      
      // Add error message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUseGeneratedContent = () => {
    if (generatedContent) {
      onUseContent(generatedContent.title, generatedContent.content);
      onClose();
      toast({
        title: "Content Applied",
        description: "AI-generated content has been added to your DABS form",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" />
            AI DABS Assistant
            {projectName && (
              <Badge variant="outline" className="ml-2">
                {projectName}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Generated Content Preview */}
          {generatedContent && (
            <Card className="border-accent bg-accent/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="font-medium text-accent">Generated DABS Content</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${generatedContent.title}\n\n${generatedContent.content}`)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUseGeneratedContent}
                      className="btn-accent"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Use This Content
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <strong className="text-sm">Title:</strong>
                    <p className="text-sm mt-1">{generatedContent.title}</p>
                  </div>
                  <div>
                    <strong className="text-sm">Content:</strong>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{generatedContent.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <Bot className="w-4 h-4 mt-1 text-accent flex-shrink-0" />
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                  <Bot className="w-4 h-4 text-accent" />
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe what you need to communicate to operatives..."
                className="min-h-[60px] pr-12"
                disabled={isLoading}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleVoiceInput}
                className={`absolute right-2 top-2 ${isRecording ? 'text-destructive' : ''}`}
                disabled={isLoading}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: Be specific about safety requirements, access restrictions, or site changes for best results
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIDABSAssistant;