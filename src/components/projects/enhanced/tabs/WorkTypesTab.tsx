import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Home,
  Check,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkCategory {
  id: string;
  main_category: string;
  sub_task: string;
  sequence_order: number;
}

interface WorkTypesTabProps {
  workCategories: WorkCategory[];
  isLoading: boolean;
}

export const WorkTypesTab: React.FC<WorkTypesTabProps> = ({
  workCategories,
  isLoading
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newWorkType, setNewWorkType] = useState({
    main_category: '',
    sub_task: ''
  });
  const [editData, setEditData] = useState({
    main_category: '',
    sub_task: ''
  });

  const createWorkTypeMutation = useMutation({
    mutationFn: async (data: { main_category: string; sub_task: string }) => {
      const { error } = await supabase
        .from('work_categories')
        .insert({
          main_category: data.main_category,
          sub_task: data.sub_task,
          sequence_order: workCategories.length + 1
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-categories'] });
      setIsAdding(false);
      setNewWorkType({ main_category: '', sub_task: '' });
      toast({
        title: "Work Type Added",
        description: "New work type has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create work type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateWorkTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WorkCategory> }) => {
      const { error } = await supabase
        .from('work_categories')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-categories'] });
      setEditingId(null);
      toast({
        title: "Work Type Updated",
        description: "Work type has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update work type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteWorkTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('work_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-categories'] });
      toast({
        title: "Work Type Deleted",
        description: "Work type has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete work type: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const reorderWorkTypesMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { error } = await supabase
        .rpc('update_work_category_order', { 
          category_ids: orderedIds
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-categories'] });
      toast({
        title: "Order Updated",
        description: "Work type order has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update order: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(workCategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const orderedIds = items.map(item => item.id);
    reorderWorkTypesMutation.mutate(orderedIds);
  };

  const handleAdd = () => {
    if (!newWorkType.main_category.trim() || !newWorkType.sub_task.trim()) {
      toast({
        title: "Validation Error",
        description: "Main category and sub task are required.",
        variant: "destructive",
      });
      return;
    }

    createWorkTypeMutation.mutate(newWorkType);
  };

  const handleEdit = (workType: WorkCategory) => {
    setEditingId(workType.id);
    setEditData({
      main_category: workType.main_category,
      sub_task: workType.sub_task
    });
  };

  const handleSaveEdit = () => {
    if (!editData.main_category.trim() || !editData.sub_task.trim()) {
      toast({
        title: "Validation Error",
        description: "Main category and sub task are required.",
        variant: "destructive",
      });
      return;
    }

    updateWorkTypeMutation.mutate({
      id: editingId!,
      data: editData
    });
  };

  const handleDelete = (id: string, mainCategory: string, subTask: string) => {
    if (window.confirm(`Are you sure you want to delete "${mainCategory} - ${subTask}"? This action cannot be undone.`)) {
      deleteWorkTypeMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Work Types</h3>
          <p className="text-sm text-muted-foreground">
            Manage work categories and sub-tasks for your project
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Work Type
        </Button>
      </div>

      {/* Add Work Type Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Work Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Main Category</label>
                <Input
                  value={newWorkType.main_category}
                  onChange={(e) => setNewWorkType(prev => ({ ...prev, main_category: e.target.value }))}
                  placeholder="e.g., Electrical, Plumbing, Carpentry"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sub Task</label>
                <Input
                  value={newWorkType.sub_task}
                  onChange={(e) => setNewWorkType(prev => ({ ...prev, sub_task: e.target.value }))}
                  placeholder="e.g., Installation, Testing, Finishing"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAdd} 
                disabled={createWorkTypeMutation.isPending}
              >
                Add Work Type
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Types List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Work Types ({workCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : workCategories.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No work types configured</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="work-types">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {workCategories.map((workType, index) => (
                      <Draggable key={workType.id} draggableId={workType.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-4 p-4 border rounded-lg bg-background ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            {editingId === workType.id ? (
                              <>
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <Input
                                    value={editData.main_category}
                                    onChange={(e) => setEditData(prev => ({ ...prev, main_category: e.target.value }))}
                                    placeholder="Main Category"
                                  />
                                  <Input
                                    value={editData.sub_task}
                                    onChange={(e) => setEditData(prev => ({ ...prev, sub_task: e.target.value }))}
                                    placeholder="Sub Task"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{workType.main_category}</Badge>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="font-medium">{workType.sub_task}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEdit(workType)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDelete(workType.id, workType.main_category, workType.sub_task)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
};