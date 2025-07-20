import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkTypeBubble } from './WorkTypeBubble';

interface WorkAssignment {
  id: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'disputed';
  estimated_hours: number | null;
  work_category_id: string;
  assigned_user_id: string;
  due_date: string | null;
  work_categories: {
    id: string;
    main_category: string;
    sub_task: string;
  } | null;
  users: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

interface MiniKanbanProps {
  plotId: string;
}

export const MiniKanban: React.FC<MiniKanbanProps> = ({ plotId }) => {
  const queryClient = useQueryClient();

  // Fetch work assignments for this plot
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['work-assignments', plotId],
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
        .eq('plot_id', plotId);
      
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`work-assignments-${plotId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'unit_work_assignments',
          filter: `plot_id=eq.${plotId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['work-assignments', plotId] });
          queryClient.invalidateQueries({ queryKey: ['plot-completion', plotId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [plotId, queryClient]);

  const getAssignmentsByStatus = (status: string) => {
    return assignments.filter(assignment => assignment.status === status);
  };

  const assignedTasks = getAssignmentsByStatus('assigned');
  const inProgressTasks = getAssignmentsByStatus('in_progress');
  const completedTasks = getAssignmentsByStatus('completed');

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Assigned Column */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <h4 className="font-medium text-sm">Assigned</h4>
          <span className="text-xs text-muted-foreground">({assignedTasks.length})</span>
        </div>
        <div className="space-y-2">
          {assignedTasks.map(assignment => (
            <WorkTypeBubble 
              key={assignment.id} 
              assignment={assignment}
              plotId={plotId}
            />
          ))}
        </div>
      </div>

      {/* In Progress Column */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <h4 className="font-medium text-sm">In Progress</h4>
          <span className="text-xs text-muted-foreground">({inProgressTasks.length})</span>
        </div>
        <div className="space-y-2">
          {inProgressTasks.map(assignment => (
            <WorkTypeBubble 
              key={assignment.id} 
              assignment={assignment}
              plotId={plotId}
            />
          ))}
        </div>
      </div>

      {/* Completed Column */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <h4 className="font-medium text-sm">Completed</h4>
          <span className="text-xs text-muted-foreground">({completedTasks.length})</span>
        </div>
        <div className="space-y-2">
          {completedTasks.map(assignment => (
            <WorkTypeBubble 
              key={assignment.id} 
              assignment={assignment}
              plotId={plotId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};