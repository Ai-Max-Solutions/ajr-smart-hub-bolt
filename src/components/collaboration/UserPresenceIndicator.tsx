import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserPresence } from '@/hooks/useUserPresence';
import { Users, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserPresenceIndicatorProps {
  className?: string;
  showOffline?: boolean;
}

const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({ 
  className, 
  showOffline = false 
}) => {
  const { presenceData, onlineUsers } = useUserPresence();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Busy';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const displayUsers = showOffline 
    ? Object.values(presenceData)
    : onlineUsers;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Status
          <Badge variant="outline" className="ml-auto">
            {onlineUsers.length} online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          {displayUsers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users online</p>
            </div>
          ) : (
            <div className="space-y-1">
              {displayUsers.map((presence) => (
                <div
                  key={presence.user_id}
                  className="p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(presence.user?.fullname || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <Circle 
                          className={`h-3 w-3 border-2 border-background rounded-full ${getStatusColor(presence.status)}`}
                          fill="currentColor"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {presence.user?.fullname || 'Unknown User'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {presence.user?.role || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {getStatusText(presence.status)}
                        </span>
                        {presence.status !== 'offline' && (
                          <span className="text-xs text-muted-foreground">
                            • {formatDistanceToNow(new Date(presence.last_seen), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {presence.custom_status && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {presence.custom_status}
                        </p>
                      )}
                      {presence.current_location && presence.status === 'online' && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          📍 {presence.current_location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UserPresenceIndicator;