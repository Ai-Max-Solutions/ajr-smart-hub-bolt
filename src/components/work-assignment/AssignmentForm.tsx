
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface AssignmentFormProps {
  workCategories: WorkCategory[];
  users: User[];
  plotId: string;
  totalPlotsCount: number;
  onAddAssignment: (
    workCategoryId: string,
    assignedUserId: string,
    estimatedHours: number,
    dueDate: string,
    copyToAll: boolean
  ) => void;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  workCategories,
  users,
  plotId,
  totalPlotsCount,
  onAddAssignment
}) => {
  const { toast } = useToast();
  const [workCategoryId, setWorkCategoryId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [dueDate, setDueDate] = useState<Date>();
  const [copyToAllPlots, setCopyToAllPlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    workCategory?: string;
    assignedUser?: string;
    hours?: string;
  }>({});

  // Validate form fields
  const validateForm = () => {
    console.log("Validating form with:", { workCategoryId, assignedUserId, estimatedHours });
    const errors: {
      workCategory?: string;
      assignedUser?: string;
      hours?: string;
    } = {};
    
    if (!workCategoryId) {
      errors.workCategory = "Please select a work type";
    }
    
    if (!assignedUserId) {
      errors.assignedUser = "Please select a user";
    }
    
    if (estimatedHours <= 0) {
      errors.hours = "Hours must be greater than 0";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAssignment = () => {
    console.log("handleAddAssignment called with:", {
      workCategoryId,
      assignedUserId,
      estimatedHours,
      dueDate,
      copyToAllPlots
    });
    
    if (!validateForm()) {
      console.log("Form validation failed", formErrors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Format the date for submission
      const formattedDueDate = dueDate ? format(dueDate, 'yyyy-MM-dd') : '';
      
      // Call the parent handler
      onAddAssignment(
        workCategoryId,
        assignedUserId,
        estimatedHours,
        formattedDueDate,
        copyToAllPlots
      );
      
      // Reset form after successful submission
      resetForm();
      
      console.log("Assignment added successfully");
      
    } catch (error) {
      console.error("Error adding assignment:", error);
      toast({
        title: "Error",
        description: "Failed to add assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setWorkCategoryId('');
    setAssignedUserId('');
    setEstimatedHours(8);
    setDueDate(undefined);
    setCopyToAllPlots(false);
    setFormErrors({});
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg">
      <h4 className="text-sm font-medium">Add New Assignment</h4>
      
      <div className="grid grid-cols-1 gap-3">
        {/* Work Category Selection */}
        <div>
          <label className={cn(
            "text-xs mb-1 block", 
            formErrors.workCategory ? "text-destructive" : "text-muted-foreground"
          )}>
            Work Type*
          </label>
          <Select 
            value={workCategoryId} 
            onValueChange={(value) => {
              console.log("Work category selected:", value);
              setWorkCategoryId(value);
              setFormErrors(prev => ({ ...prev, workCategory: undefined }));
            }}
          >
            <SelectTrigger className={cn(
              formErrors.workCategory ? "border-destructive" : ""
            )}>
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
          {formErrors.workCategory && (
            <p className="text-xs text-destructive mt-1">{formErrors.workCategory}</p>
          )}
        </div>

        {/* User Assignment */}
        <div>
          <label className={cn(
            "text-xs mb-1 block", 
            formErrors.assignedUser ? "text-destructive" : "text-muted-foreground"
          )}>
            Assign To*
          </label>
          <Select 
            value={assignedUserId} 
            onValueChange={(value) => {
              console.log("User selected:", value);
              setAssignedUserId(value);
              setFormErrors(prev => ({ ...prev, assignedUser: undefined }));
            }}
          >
            <SelectTrigger className={cn(
              formErrors.assignedUser ? "border-destructive" : ""
            )}>
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
          {formErrors.assignedUser && (
            <p className="text-xs text-destructive mt-1">{formErrors.assignedUser}</p>
          )}
        </div>

        {/* Hours and Due Date */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={cn(
              "text-xs block mb-1", 
              formErrors.hours ? "text-destructive" : "text-muted-foreground"
            )}>
              Est. Hours*
            </label>
            <Input
              type="number"
              value={estimatedHours}
              onChange={(e) => {
                const value = Number(e.target.value);
                console.log("Hours changed:", value);
                setEstimatedHours(value);
                if (value > 0) {
                  setFormErrors(prev => ({ ...prev, hours: undefined }));
                }
              }}
              min={0.5}
              step={0.5}
              className={cn(
                formErrors.hours ? "border-destructive" : ""
              )}
            />
            {formErrors.hours && (
              <p className="text-xs text-destructive mt-1">{formErrors.hours}</p>
            )}
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "MMM dd") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    console.log("Date selected:", date);
                    setDueDate(date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Copy to All Plots Checkbox */}
        {totalPlotsCount > 1 && (
          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <Checkbox 
              id="copyToAll"
              checked={copyToAllPlots}
              onCheckedChange={(checked) => {
                const isChecked = checked === true;
                console.log("Copy to all toggled:", isChecked);
                setCopyToAllPlots(isChecked);
              }}
            />
            <div className="flex items-center gap-2 flex-1">
              <Copy className="h-4 w-4 text-blue-600" />
              <label 
                htmlFor="copyToAll" 
                className="text-sm font-medium text-blue-900 cursor-pointer"
              >
                Copy to all plots ({totalPlotsCount - 1} others)
              </label>
            </div>
          </div>
        )}
        
        {copyToAllPlots && (
          <p className="text-xs text-muted-foreground bg-amber-50 p-2 rounded border border-amber-200">
            ⚠️ This assignment will be added to all {totalPlotsCount} plots in the project. 
            Existing assignments for the same work type will be skipped.
          </p>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleAddAssignment}
          disabled={isSubmitting}
          className="w-full"
          size="sm"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Processing...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {copyToAllPlots ? `Add to All ${totalPlotsCount} Plots` : 'Add Assignment'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
