import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Clock } from 'lucide-react';
import { AvatarDropdown } from './AvatarDropdown';
import { AIDelayWarning } from './AIDelayWarning';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  };
  users: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface DelayData {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  days_overdue: number;
  avg_hours: number;
  estimated_hours: number;
}

interface WorkTypeBubbleProps {
  assignment: WorkAssignment;
  plotId: string;
}

export const WorkTypeBubble: React.FC<WorkTypeBubbleProps> = ({ assignment, plotId }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch delay prediction
  const { data: delayData } = useQuery({
    queryKey: ['delay-prediction', assignment.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('predict_task_delay', {
        p_assignment_id: assignment.id
      });
      if (error) throw error;
      return data as unknown as DelayData;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const getStatusColor = () => {
    switch (assignment.status) {
      case 'completed':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      default:
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    }
  };

  const isAtRisk = delayData?.risk_level === 'HIGH' || delayData?.risk_level === 'MEDIUM';

  return (
    <TooltipProvider>
      <div className={`relative p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getStatusColor()}`}>
        {/* Risk Warning */}
        {isAtRisk && (
          <AIDelayWarning 
            riskLevel={delayData.risk_level}
            reason={delayData.reason}
            assignmentId={assignment.id}
          />
        )}

        {/* Main Content */}
        <div className="space-y-2">
          <div className="text-sm font-medium leading-tight">
            {assignment.work_categories.sub_task}
          </div>
          
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                    <AvatarImage src={assignment.users.avatar_url || undefined} />
                    <AvatarFallback className="text-xs font-medium">
                      {assignment.users.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to reassign • {assignment.users.name}</p>
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {assignment.estimated_hours && (
                <>
                  <Clock className="h-3 w-3" />
                  <span>{assignment.estimated_hours}h</span>
                </>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <Badge 
            variant="outline" 
            className="text-xs capitalize"
          >
            {assignment.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Avatar Dropdown */}
        {showDropdown && (
          <AvatarDropdown 
            assignmentId={assignment.id}
            workCategoryId={assignment.work_category_id}
            plotId={plotId}
            currentUserId={assignment.assigned_user_id}
            onClose={() => setShowDropdown(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};