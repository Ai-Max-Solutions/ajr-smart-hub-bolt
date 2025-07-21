
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Clock, CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Assignment {
  plotId: string;
  workCategoryId: string;
  assignedUserId: string;
  estimatedHours: number;
  dueDate: string;
}

interface WorkCategory {
  id: string;
  main_category: string;
  sub_task: string;
}

interface AssignmentUser {
  id: string;
  name: string;
  role: string;
}

interface AssignmentListProps {
  assignments: Assignment[];
  workCategories: WorkCategory[];
  users: AssignmentUser[];
  onRemoveAssignment: (plotId: string, workCategoryId: string) => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  workCategories,
  users,
  onRemoveAssignment
}) => {
  // Helper functions
  const getWorkCategoryName = (id: string) => {
    const category = workCategories.find(c => c.id === id);
    return category ? `${category.main_category} - ${category.sub_task}` : 'Unknown';
  };

  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : 'Unknown';
  };

  if (assignments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Current Assignments</h4>
      {assignments.map((assignment, index) => (
        <div 
          key={`${assignment.plotId}-${assignment.workCategoryId}-${index}`} 
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {getWorkCategoryName(assignment.workCategoryId)}
            </p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {getUserName(assignment.assignedUserId)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {assignment.estimatedHours}h
              </span>
              {assignment.dueDate && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {format(new Date(assignment.dueDate), 'MMM dd')}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log("Removing assignment:", assignment.plotId, assignment.workCategoryId);
              onRemoveAssignment(assignment.plotId, assignment.workCategoryId);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};
