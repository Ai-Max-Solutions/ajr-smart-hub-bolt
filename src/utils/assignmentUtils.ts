
/**
 * Utility functions for work assignments
 */

/**
 * Validates assignment data before saving
 * @param assignment The assignment object to validate
 * @returns Object with validation results
 */
export const validateAssignment = (assignment: {
  plotId: string;
  workCategoryId: string;
  assignedUserId: string;
  estimatedHours: number;
  dueDate: string;
}) => {
  const errors: Record<string, string> = {};
  
  if (!assignment.plotId) {
    errors.plotId = "Plot ID is required";
  }
  
  if (!assignment.workCategoryId) {
    errors.workCategoryId = "Work category is required";
  }
  
  if (!assignment.assignedUserId) {
    errors.assignedUserId = "Assigned user is required";
  }
  
  if (!assignment.estimatedHours || assignment.estimatedHours <= 0) {
    errors.estimatedHours = "Estimated hours must be greater than 0";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Handles debug logging for assignment operations
 */
export const logAssignmentDebug = (operation: string, data: any) => {
  console.log(`[Assignment Debug] ${operation}:`, data);
  
  // Additional context that may help diagnose issues
  console.log(`[Assignment Debug] Browser Info:`, {
    userAgent: navigator.userAgent,
    windowSize: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Checks if an assignment exists in a collection
 */
export const assignmentExists = (
  assignments: Array<{
    plotId: string;
    workCategoryId: string;
  }>,
  plotId: string,
  workCategoryId: string
) => {
  return assignments.some(a => 
    a.plotId === plotId && 
    a.workCategoryId === workCategoryId
  );
};

/**
 * Formats assignment data for display or debugging
 */
export const formatAssignmentForDisplay = (
  assignment: {
    plotId: string;
    workCategoryId: string;
    assignedUserId: string;
    estimatedHours: number;
    dueDate: string;
  },
  plots: Array<{ id: string; name: string; composite_code: string }>,
  workCategories: Array<{ id: string; main_category: string; sub_task: string }>,
  users: Array<{ id: string; name: string; role: string }>
) => {
  const plot = plots.find(p => p.id === assignment.plotId);
  const workCategory = workCategories.find(wc => wc.id === assignment.workCategoryId);
  const user = users.find(u => u.id === assignment.assignedUserId);
  
  return {
    plot: plot ? `${plot.composite_code} (${plot.name})` : 'Unknown Plot',
    workCategory: workCategory ? `${workCategory.main_category} - ${workCategory.sub_task}` : 'Unknown Work',
    assignedTo: user ? `${user.name} (${user.role})` : 'Unknown User',
    estimatedHours: assignment.estimatedHours,
    dueDate: assignment.dueDate || 'No due date'
  };
};
