import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  project_id: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

interface RealTimeChatProps {
  projectId: string;
}

const RealTimeChat = ({ projectId }: RealTimeChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock messages for now
    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Hello everyone!',
        project_id: projectId,
        user_id: '1',
        user_name: 'John Doe',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        content: 'Hi John!',
        project_id: projectId,
        user_id: '2',
        user_name: 'Jane Smith',
        created_at: new Date().toISOString()
      }
    ];

    setMessages(mockMessages);
  }, [projectId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const messageData = {
        content: newMessage,
        project_id: projectId,
        user_id: user.id, // Use user.id instead of user.user_id
        user_name: user.email || 'Unknown User'
      };

      // Mock message sending for now
      const newMsg: Message = {
        id: Date.now().toString(),
        ...messageData,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardContent className="overflow-y-auto flex-1 p-4" ref={chatContainerRef}>
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}
            >
              <div className="text-xs text-muted-foreground">{msg.user_name}</div>
              <div
                className={`px-3 py-2 rounded-lg ${msg.user_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
              >
                {msg.content}
              </div>
              <div className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </CardContent>
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </Card>
  );
};

export default RealTimeChat;
