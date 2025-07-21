import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: string[];
}

interface GrokChatProps {
  projectId: string;
  documentId: string | null;
  compact?: boolean;
}

export function GrokChat({ projectId, documentId, compact = false }: GrokChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      content: `Hello! I'm Grok, your AI assistant for project documentation. I can help you:

• Search and analyze documents in this project
• Answer questions about RAMS, drawings, and technical manuals
• Compare different versions of documents
• Provide summaries of key information

What would you like to know about the project documents?`,
      role: 'assistant',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Store the query in history
      await supabase
        .from('rag_query_history' as any)
        .insert({
          user_id: user.id,
          project_id: projectId,
          document_id: documentId,
          query_text: userMessage.content,
          query_type: documentId ? 'document_specific' : 'general'
        });

      // For now, simulate AI response (will be replaced with actual RAG implementation)
      const simulatedResponse = await simulateGrokResponse(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: simulatedResponse.content,
        role: 'assistant',
        timestamp: new Date(),
        sources: simulatedResponse.sources
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact your system administrator.',
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateGrokResponse = async (query: string): Promise<{ content: string; sources?: string[] }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('rams') || lowerQuery.includes('risk') || lowerQuery.includes('safety')) {
      return {
        content: `Based on the RAMS documents in your project, here are the key safety considerations:

• **High Risk Activities**: Working at height, electrical work, and confined space entry
• **Required PPE**: Hard hats, safety harnesses, and electrical protection equipment
• **Emergency Procedures**: Emergency assembly points are clearly marked on site plans
• **Permit Requirements**: Hot work permits required for welding and cutting operations

The RAMS documents emphasize the importance of daily safety briefings and proper equipment inspection before use.`,
        sources: ['RAMS_Project_Safety_Plan_v2.1.pdf', 'Site_Emergency_Procedures.pdf']
      };
    }

    if (lowerQuery.includes('drawing') || lowerQuery.includes('technical') || lowerQuery.includes('plan')) {
      return {
        content: `I found several technical drawings for this project:

• **Architectural Plans**: Floor plans for all levels (Blocks A-C)
• **MEP Drawings**: Electrical, plumbing, and HVAC layouts
• **Structural Details**: Foundation and steel frame specifications
• **As-Built Status**: 75% of drawings have been updated to as-built status

The latest revisions show modifications to the electrical distribution on Level 2, Block B. Would you like me to highlight the specific changes?`,
        sources: ['Architectural_Plans_Rev_C.pdf', 'MEP_Drawings_Rev_B.pdf', 'Structural_Details_Rev_A.pdf']
      };
    }

    if (lowerQuery.includes('completion') || lowerQuery.includes('progress') || lowerQuery.includes('status')) {
      return {
        content: `Based on the latest project documentation:

• **Overall Progress**: 68% complete
• **Current Phase**: Mechanical and electrical installation
• **Critical Path**: HVAC system commissioning
• **Upcoming Milestones**: 
  - Final electrical testing (Next week)
  - Building handover preparations (In 3 weeks)

Recent inspection reports show all work is meeting quality standards. The project remains on track for the scheduled completion date.`,
        sources: ['Weekly_Progress_Report.pdf', 'Quality_Inspection_Checklist.pdf']
      };
    }

    // Default response
    return {
      content: `I understand you're asking about "${query}". I can help you find information in your project documents, but I'll need to implement the full RAG functionality to provide detailed answers.

In the meantime, I can help you with:
• Searching for specific documents
• Understanding project status
• Safety and compliance questions
• Technical drawing queries

Could you provide more specific details about what you're looking for?`
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={compact ? 'h-full' : 'h-[600px]'}>
      {!compact && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Grok AI Assistant</span>
            {documentId && <Badge variant="outline">Document-specific</Badge>}
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={`p-0 h-full flex flex-col ${compact ? 'pt-0' : ''}`}>
        {/* Messages */}
        <ScrollArea 
          ref={scrollAreaRef}
          className={`flex-1 p-4 ${compact ? 'h-64' : 'h-96'}`}
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                          <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((source, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about project documents..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {!compact && (
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}