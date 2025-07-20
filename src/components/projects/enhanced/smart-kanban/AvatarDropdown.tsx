import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SuggestedUser {
  user_id: string;
  user_name: string;
  suggestion_score: number;
  reason: string;
}

interface AvatarDropdownProps {
  assignmentId: string;
  workCategoryId: string;
  plotId: string;
  currentUserId: string;
  onClose: () => void;
}

export const AvatarDropdown: React.FC<AvatarDropdownProps> = ({
  assignmentId,
  workCategoryId,
  plotId,
  currentUserId,
  onClose
}) => {
  const queryClient = useQueryClient();

  // Fetch suggested users
  const { data: suggestedUsers = [], isLoading } = useQuery({
    queryKey: ['suggested-users', workCategoryId, plotId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('ai_suggest_user_for_task', {
        p_work_category_id: workCategoryId,
        p_plot_id: plotId
      });
      if (error) throw error;
      return data as SuggestedUser[];
    },
  });

  // Reassign user mutation
  const reassignMutation = useMutation({
    mutationFn: async (newUserId: string) => {
      const { error } = await supabase
        .from('unit_work_assignments')
        .update({ assigned_user_id: newUserId })
        .eq('id', assignmentId);
      
      if (error) throw error;
      return newUserId;
    },
    onSuccess: (newUserId) => {
      const newUser = suggestedUsers.find(u => u.user_id === newUserId);
      toast.success(`Reassigned to ${newUser?.user_name} — flowing again!`);
      queryClient.invalidateQueries({ queryKey: ['work-assignments', plotId] });
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to reassign task');
      console.error('Reassignment error:', error);
    }
  });

  const handleUserSelect = (userId: string) => {
    if (userId !== currentUserId) {
      reassignMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <Card className="absolute top-full left-0 mt-2 w-64 z-50 shadow-lg">
        <CardContent className="p-3">
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-2 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="absolute top-full left-0 mt-2 w-72 z-50 shadow-lg border-2">
      <CardContent className="p-3">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            AI Suggested Reassignment
          </div>
          
          {suggestedUsers.slice(0, 5).map((user, index) => (
            <div
              key={user.user_id}
              onClick={() => handleUserSelect(user.user_id)}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                user.user_id === currentUserId ? 'bg-accent' : ''
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} />
                <AvatarFallback className="text-xs">
                  {user.user_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {user.user_name}
                  </span>
                  {user.user_id === currentUserId && (
                    <Check className="h-3 w-3 text-green-600" />
                  )}
                  {index === 0 && user.user_id !== currentUserId && (
                    <Star className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.round(user.suggestion_score)}% match
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.reason}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};