import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp, Users, Clock, CheckCircle } from 'lucide-react';
import { MiniKanban } from './MiniKanban';
import { ConfettiTrigger } from './ConfettiTrigger';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Plot {
  id: string;
  name: string;
  code: string;
  unit_type: string;
  status: string;
  handed_over: boolean;
}

interface SmartUnitCardProps {
  plot: Plot;
  projectId: string;
}

export const SmartUnitCard: React.FC<SmartUnitCardProps> = ({ plot, projectId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch completion percentage
  const { data: completion } = useQuery({
    queryKey: ['plot-completion', plot.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_plot_completion', {
        p_plot_id: plot.id
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch work assignments for this plot
  const { data: assignments = [] } = useQuery({
    queryKey: ['work-assignments', plot.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unit_work_assignments')
        .select(`
          *,
          work_categories (
            id,
            main_category,
            sub_task
          ),
          users (
            id,
            name,
            avatar_url
          )
        `)
        .eq('plot_id', plot.id);
      
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Set up real-time subscription for assignments
  useEffect(() => {
    const channel = supabase
      .channel(`unit-assignments-${plot.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'unit_work_assignments',
          filter: `plot_id=eq.${plot.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['work-assignments', plot.id] });
          queryClient.invalidateQueries({ queryKey: ['plot-completion', plot.id] });
          
          // Show toast notification
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Assignment updated—smash it, Mark! 🚀",
              description: `New work assigned to Unit ${plot.code}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: "Progress updated—efficiency win! ⚡",
              description: `Unit ${plot.code} assignment status changed`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [plot.id, plot.code, queryClient, toast]);

  useEffect(() => {
    if (completion !== undefined) {
      setCompletionPercentage(completion * 100);
    }
  }, [completion]);

  const isCompleted = completionPercentage >= 100;

  // Calculate assignment counts
  const assignedCount = assignments.filter(a => a.status === 'assigned').length;
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length;  
  const completedCount = assignments.filter(a => a.status === 'completed').length;

  // Get unique assignees
  const uniqueAssignees = assignments.reduce((acc, assignment) => {
    if (assignment.users && !acc.find(u => u.id === assignment.users.id)) {
      acc.push(assignment.users);
    }
    return acc;
  }, [] as any[]);

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${isCompleted ? 'border-green-500 bg-green-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              Unit {plot.code} – {plot.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={plot.handed_over ? 'default' : 'secondary'}>
                {plot.handed_over ? 'Handed Over' : plot.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {plot.unit_type}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Completion</div>
              <div className="font-semibold text-lg">
                {Math.round(completionPercentage)}%
              </div>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        <Progress 
          value={completionPercentage} 
          className={`h-2 transition-all duration-500 ${isCompleted ? 'bg-green-100' : ''}`}
        />
        
        {/* Assignment Summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-4">
            {/* Assignment Counts */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-yellow-500" />
                <span className="text-sm font-medium">{assignedCount}</span>
                <span className="text-xs text-muted-foreground">assigned</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-blue-500" />
                <span className="text-sm font-medium">{inProgressCount}</span>
                <span className="text-xs text-muted-foreground">active</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-sm font-medium">{completedCount}</span>
                <span className="text-xs text-muted-foreground">done</span>
              </div>
            </div>
          </div>
          
          {/* Assignee Avatars */}
          <div className="flex items-center gap-1">
            {uniqueAssignees.slice(0, 3).map((user, index) => (
              <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-xs">
                  {user.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {uniqueAssignees.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                +{uniqueAssignees.length - 3}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <MiniKanban plotId={plot.id} />
        </CardContent>
      )}

      {isCompleted && <ConfettiTrigger />}
    </Card>
  );
};