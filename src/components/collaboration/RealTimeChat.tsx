import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRealTimeChat } from '@/hooks/useRealTimeChat';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Send, Users, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RealTimeChatProps {
  className?: string;
  initialRoomId?: string;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({ className, initialRoomId }) => {
  const { user } = useAuth();
  const { rooms, messages, loading, fetchMessages, sendMessage, markAsRead } = useRealTimeChat();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId || null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedRoom = rooms.find(room => room.id === selectedRoomId);
  const roomMessages = selectedRoomId ? messages[selectedRoomId] || [] : [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  // Load messages when room is selected
  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(selectedRoomId);
      markAsRead(selectedRoomId);
    }
  }, [selectedRoomId, fetchMessages, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoomId || sending) return;

    setSending(true);
    try {
      await sendMessage(selectedRoomId, newMessage);
      setNewMessage('');
    } finally {
      setSending(false);
    }
  };

  const getMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Team Chat
          {selectedRoom && (
            <Badge variant="outline" className="ml-auto">
              {selectedRoom.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex h-96">
          {/* Room List */}
          <div className="w-1/3 border-r">
            <div className="p-3 border-b">
              <Button size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
            <ScrollArea className="h-80">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full p-3 text-left hover:bg-muted transition-colors ${
                    selectedRoomId === room.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium truncate">{room.name}</span>
                    </div>
                    {room.unread_count ? (
                      <Badge variant="destructive" className="h-5 w-5 text-xs p-0 flex items-center justify-center">
                        {room.unread_count}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {room.description || `${room.room_type} chat`}
                  </p>
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedRoom ? (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {roomMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${
                          message.user_id === user?.user_id ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(message.user?.fullname || 'Unknown')}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-[70%] ${
                            message.user_id === user?.user_id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          } rounded-lg p-2`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {message.user?.fullname || 'Unknown User'}
                            </span>
                            <span className="text-xs opacity-70">
                              {getMessageTime(message.created_at)}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sending}
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a chat room to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeChat;