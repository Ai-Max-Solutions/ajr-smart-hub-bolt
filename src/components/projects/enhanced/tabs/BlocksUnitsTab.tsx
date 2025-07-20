import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Home,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface BlocksUnitsTabProps {
  projectId: string;
  plots: Plot[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
}

export const BlocksUnitsTab: React.FC<BlocksUnitsTabProps> = ({
  projectId,
  plots,
  searchQuery,
  onSearchChange,
  isLoading
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitData, setNewUnitData] = useState({
    name: '',
    code: '',
    unit_type: 'Residential'
  });

  const createUnitMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; unit_type: string }) => {
      const { error } = await supabase
        .from('plots')
        .insert({
          project_id: projectId,
          name: data.name,
          code: data.code,
          unit_type: data.unit_type,
          status: 'Not Started',
          handed_over: false,
          plot_sequence_order: plots.length + 1
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots', projectId] });
      setIsAddingUnit(false);
      setNewUnitData({ name: '', code: '', unit_type: 'Residential' });
      toast({
        title: "Unit Added",
        description: "New unit has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create unit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Plot> }) => {
      const { error } = await supabase
        .from('plots')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-progress', projectId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update unit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('plots')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-progress', projectId] });
      toast({
        title: "Unit Deleted",
        description: "Unit has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete unit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const reorderUnitsMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { error } = await supabase
        .rpc('update_plot_order', { 
          plot_ids: orderedIds, 
          project_id_param: projectId 
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots', projectId] });
      toast({
        title: "Order Updated",
        description: "Unit order has been saved successfully.",
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

    const items = Array.from(plots);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const orderedIds = items.map(item => item.id);
    reorderUnitsMutation.mutate(orderedIds);
  };

  const handleHandoverChange = (plotId: string, handed_over: boolean) => {
    updateUnitMutation.mutate({
      id: plotId,
      data: { handed_over }
    });
  };

  const handleDeleteUnit = (plotId: string, plotName: string) => {
    if (window.confirm(`Are you sure you want to delete unit "${plotName}"? This action cannot be undone.`)) {
      deleteUnitMutation.mutate(plotId);
    }
  };

  const handleAddUnit = () => {
    if (!newUnitData.name.trim() || !newUnitData.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Unit name and code are required.",
        variant: "destructive",
      });
      return;
    }

    createUnitMutation.mutate(newUnitData);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'not started':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const handedOverCount = plots.filter(p => p.handed_over).length;
  const progressPercentage = plots.length > 0 ? (handedOverCount / plots.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with Search and Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search units by name, code, or composite code..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setIsAddingUnit(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Units Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold">{plots.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Handed Over</p>
              <p className="text-2xl font-bold text-green-600">{handedOverCount}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-blue-600">{plots.length - handedOverCount}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Progress</p>
              <div className="flex items-center gap-2">
                <Progress value={progressPercentage} className="flex-1" />
                <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Unit Form */}
      {isAddingUnit && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Name</label>
                <Input
                  value={newUnitData.name}
                  onChange={(e) => setNewUnitData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Apartment 101"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Code</label>
                <Input
                  value={newUnitData.code}
                  onChange={(e) => setNewUnitData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g., A101"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Type</label>
                <select
                  value={newUnitData.unit_type}
                  onChange={(e) => setNewUnitData(prev => ({ ...prev, unit_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Retail">Retail</option>
                  <option value="Office">Office</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingUnit(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddUnit} 
                disabled={createUnitMutation.isPending}
              >
                Add Unit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Units List */}
      <Card>
        <CardHeader>
          <CardTitle>Units ({plots.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : plots.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No units found</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="units">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {plots.map((plot, index) => (
                      <Draggable key={plot.id} draggableId={plot.id} index={index}>
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
                            
                            <div className="flex items-center gap-2">
                              {getStatusIcon(plot.status)}
                              <div>
                                <p className="font-medium">{plot.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {plot.composite_code || plot.code}
                                </p>
                              </div>
                            </div>

                            <Badge variant="outline">{plot.unit_type}</Badge>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={plot.handed_over}
                                onCheckedChange={(checked) => 
                                  handleHandoverChange(plot.id, checked as boolean)
                                }
                              />
                              <span className="text-sm">Handed Over</span>
                            </div>

                            <div className="ml-auto flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteUnit(plot.id, plot.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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