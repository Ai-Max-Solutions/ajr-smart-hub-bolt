
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users,
  Wrench
} from 'lucide-react';

interface Plot {
  id: string;
  code: string;
  name: string;
  unit_type: string;
  status: string;
  composite_code: string;
  plot_sequence_order: number;
  handed_over: boolean;
  project_id: string;
  block_id?: string;
  level_id?: string;
}

interface WorkAssignment {
  id: string;
  status: 'assigned' | 'in_progress' | 'completed';
  work_category_id: string;
  assigned_user_id: string;
  estimated_hours: number;
  work_categories: {
    main_category: string;
    sub_task: string;
  };
  users: {
    name: string;
  };
}

interface SmartUnitCardProps {
  plot: Plot;
}

export const SmartUnitCard: React.FC<SmartUnitCardProps> = ({ plot }) => {
  // Fetch work assignments for this plot
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['unit-assignments', plot.id],
    queryFn: async (): Promise<WorkAssignment[]> => {
      const { data, error } = await supabase
        .from('unit_work_assignments')
        .select(`
          id,
          status,
          work_category_id,
          assigned_user_id,
          estimated_hours,
          work_categories (
            main_category,
            sub_task
          ),
          users (
            name
          )
        `)
        .eq('plot_id', plot.id);

      if (error) throw error;
      return data || [];
    },
    retry: 2,
  });

  const assignedCount = assignments.filter(a => a.status === 'assigned').length;
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const totalAssignments = assignments.length;

  const completionPercentage = totalAssignments > 0 
    ? Math.round((completedCount / totalAssignments) * 100) 
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'assigned':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getUniqueUsers = () => {
    const userNames = assignments
      .filter(a => a.users?.name)
      .map(a => a.users.name)
      .filter((name, index, arr) => arr.indexOf(name) === index);
    return userNames.slice(0, 3); // Show max 3 users
  };

  const uniqueUsers = getUniqueUsers();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {plot.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{plot.composite_code || plot.code}</span>
              {plot.unit_type && (
                <>
                  <span>•</span>
                  <span>{plot.unit_type}</span>
                </>
              )}
            </div>
          </div>
          {plot.handed_over && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Handed Over
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {totalAssignments > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        )}

        {/* Assignment Counts */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className={`text-lg font-semibold ${getStatusColor('assigned')}`}>
              {assignedCount}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Assigned
            </div>
          </div>
          <div className="space-y-1">
            <div className={`text-lg font-semibold ${getStatusColor('in_progress')}`}>
              {inProgressCount}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              In Progress
            </div>
          </div>
          <div className="space-y-1">
            <div className={`text-lg font-semibold ${getStatusColor('completed')}`}>
              {completedCount}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </div>
          </div>
        </div>

        {/* Assigned Users */}
        {uniqueUsers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>Assigned Team</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {uniqueUsers.map((userName, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {userName}
                </Badge>
              ))}
              {assignments.length > uniqueUsers.length && (
                <Badge variant="outline" className="text-xs">
                  +{assignments.length - uniqueUsers.length} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Work Types Preview */}
        {assignments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wrench className="h-3 w-3" />
              <span>Work Types</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {assignments.slice(0, 2).map(a => a.work_categories?.main_category).join(', ')}
              {assignments.length > 2 && ` +${assignments.length - 2} more`}
            </div>
          </div>
        )}

        {/* No assignments state */}
        {totalAssignments === 0 && !isLoading && (
          <div className="text-center py-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No work assigned yet</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
