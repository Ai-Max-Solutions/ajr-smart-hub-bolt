import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { AssignmentForm } from './AssignmentForm';
import { AssignmentList } from './AssignmentList';
import { useToast } from '@/hooks/use-toast';

interface Plot {
  id: string;
  name: string;
  code: string;
  composite_code: string;
  status: string;
}

interface WorkCategory {
  id: string;
  main_category: string;
  sub_task: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface Assignment {
  plotId: string;
  workCategoryId: string;
  assignedUserId: string;
  estimatedHours: number;
  dueDate: string;
}

interface PlotAssignmentCardProps {
  plot: Plot;
  workCategories: WorkCategory[];
  users: User[];
  assignments: Assignment[];
  onUpdateAssignment: (plotId: string, workCategoryId: string, assignedUserId: string, estimatedHours: number, dueDate: string) => void;
  onRemoveAssignment: (plotId: string, workCategoryId: string) => void;
  onBulkAssignment: (workCategoryId: string, assignedUserId: string, estimatedHours: number, dueDate: string) => void;
  isSelected: boolean;
  onToggleSelection: () => void;
  totalPlotsCount: number;
}

export const PlotAssignmentCard: React.FC<PlotAssignmentCardProps> = ({
  plot,
  workCategories,
  users,
  assignments,
  onUpdateAssignment,
  onRemoveAssignment,
  onBulkAssignment,
  isSelected,
  onToggleSelection,
  totalPlotsCount
}) => {
  const { toast } = useToast();

  const handleAddAssignment = (
    workCategoryId: string,
    assignedUserId: string,
    estimatedHours: number,
    dueDate: string,
    copyToAll: boolean
  ) => {
    console.log("PlotAssignmentCard: handleAddAssignment", {
      plotId: plot.id,
      workCategoryId,
      assignedUserId,
      estimatedHours,
      dueDate,
      copyToAll
    });
    
    try {
      if (copyToAll) {
        console.log("Calling onBulkAssignment with:", { workCategoryId, assignedUserId, estimatedHours, dueDate });
        onBulkAssignment(
          workCategoryId,
          assignedUserId,
          estimatedHours,
          dueDate
        );
        
        toast({
          title: "Bulk Assignment Initiated",
          description: `Assigning to ${totalPlotsCount} plots...`,
        });
      } else {
        console.log("Calling onUpdateAssignment with:", { plotId: plot.id, workCategoryId, assignedUserId, estimatedHours, dueDate });
        onUpdateAssignment(
          plot.id,
          workCategoryId,
          assignedUserId,
          estimatedHours,
          dueDate
        );
        
        toast({
          title: "Assignment Added",
          description: "Assignment has been added to this plot",
        });
      }
    } catch (error) {
      console.error("Error in handleAddAssignment:", error);
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Not Started': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg",
      isSelected ? "ring-2 ring-primary" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => {
                console.log("Plot selection toggled:", plot.id);
                onToggleSelection();
              }}
            />
            <div>
              <CardTitle className="text-lg">{plot.composite_code}</CardTitle>
              <p className="text-sm text-muted-foreground">{plot.name}</p>
            </div>
          </div>
          <Badge 
            variant="secondary"
            className={cn("text-white", getStatusColor(plot.status))}
          >
            {plot.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Existing Assignments */}
        {assignments.length > 0 && (
          <AssignmentList 
            assignments={assignments}
            workCategories={workCategories}
            users={users}
            onRemoveAssignment={(_, workCategoryId) => {
              onRemoveAssignment(plot.id, workCategoryId);
            }}
          />
        )}

        {/* Add New Assignment */}
        <AssignmentForm 
          workCategories={workCategories}
          users={users}
          plotId={plot.id}
          totalPlotsCount={totalPlotsCount}
          onAddAssignment={handleAddAssignment}
        />
      </CardContent>
    </Card>
  );
};
