import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Clock, User } from 'lucide-react';

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
  isSelected: boolean;
  onToggleSelection: () => void;
}

export const PlotAssignmentCard: React.FC<PlotAssignmentCardProps> = ({
  plot,
  workCategories,
  users,
  assignments,
  onUpdateAssignment,
  onRemoveAssignment,
  isSelected,
  onToggleSelection
}) => {
  const [newWorkCategoryId, setNewWorkCategoryId] = useState('');
  const [newAssignedUserId, setNewAssignedUserId] = useState('');
  const [newEstimatedHours, setNewEstimatedHours] = useState(8);
  const [newDueDate, setNewDueDate] = useState<Date>();

  const handleAddAssignment = () => {
    if (newWorkCategoryId && newAssignedUserId) {
      onUpdateAssignment(
        plot.id,
        newWorkCategoryId,
        newAssignedUserId,
        newEstimatedHours,
        newDueDate ? format(newDueDate, 'yyyy-MM-dd') : ''
      );
      
      // Reset form
      setNewWorkCategoryId('');
      setNewAssignedUserId('');
      setNewEstimatedHours(8);
      setNewDueDate(undefined);
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

  const getWorkCategoryName = (id: string) => {
    const category = workCategories.find(c => c.id === id);
    return category ? `${category.main_category} - ${category.sub_task}` : 'Unknown';
  };

  const getUserName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : 'Unknown';
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
              onCheckedChange={onToggleSelection}
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
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Current Assignments</h4>
            {assignments.map((assignment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                  onClick={() => onRemoveAssignment(plot.id, assignment.workCategoryId)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Assignment */}
        <div className="space-y-3 p-3 border rounded-lg">
          <h4 className="text-sm font-medium">Add New Assignment</h4>
          
          <div className="grid grid-cols-1 gap-3">
            <Select value={newWorkCategoryId} onValueChange={setNewWorkCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>
              <SelectContent>
                {workCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.main_category} - {category.sub_task}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={newAssignedUserId} onValueChange={setNewAssignedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Assign to user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Est. Hours</label>
                <Input
                  type="number"
                  value={newEstimatedHours}
                  onChange={(e) => setNewEstimatedHours(Number(e.target.value))}
                  min={0.5}
                  step={0.5}
                />
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDueDate ? format(newDueDate, "MMM dd") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newDueDate}
                      onSelect={setNewDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              onClick={handleAddAssignment}
              disabled={!newWorkCategoryId || !newAssignedUserId}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
