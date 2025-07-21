import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Save, Users, Calendar, Target } from 'lucide-react';
import { PlotAssignmentCard } from './PlotAssignmentCard';
import { AIAssignmentModal } from './AIAssignmentModal';
import { SmartAssignmentEngine } from './SmartAssignmentEngine';
import { InteractiveHeatmap } from './InteractiveHeatmap';
import { Leaderboard } from '../gamification/Leaderboard';

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

export const ProjectUnitsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [plots, setPlots] = useState<Plot[]>([]);
  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedPlots, setSelectedPlots] = useState<string[]>([]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      console.log("Loading project data for projectId:", projectId);
      setLoading(true);
      
      // Load plots
      const { data: plotsData, error: plotsError } = await supabase
        .from('plots')
        .select('*')
        .eq('project_id', projectId)
        .order('plot_sequence_order');

      if (plotsError) {
        console.error("Error loading plots:", plotsError);
        throw plotsError;
      }
      
      console.log("Loaded plots:", plotsData?.length || 0);

      // Load work categories
      const { data: workCategoriesData, error: workCategoriesError } = await supabase
        .from('work_categories')
        .select('*')
        .order('sequence_order');

      if (workCategoriesError) {
        console.error("Error loading work categories:", workCategoriesError);
        throw workCategoriesError;
      }
      
      console.log("Loaded work categories:", workCategoriesData?.length || 0);

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, role')
        .in('role', ['Operative', 'Supervisor', 'PM']);

      if (usersError) {
        console.error("Error loading users:", usersError);
        throw usersError;
      }
      
      console.log("Loaded users:", usersData?.length || 0);

      // Load existing assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('unit_work_assignments')
        .select('*')
        .in('plot_id', plotsData?.map(p => p.id) || []);

      if (assignmentsError) {
        console.error("Error loading assignments:", assignmentsError);
        throw assignmentsError;
      }
      
      console.log("Loaded assignments:", assignmentsData?.length || 0);

      setPlots(plotsData || []);
      setWorkCategories(workCategoriesData || []);
      setUsers(usersData || []);
      
      // Transform assignments to local format
      const localAssignments = assignmentsData?.map(a => ({
        plotId: a.plot_id,
        workCategoryId: a.work_category_id,
        assignedUserId: a.assigned_user_id,
        estimatedHours: a.estimated_hours || 0,
        dueDate: a.due_date || ''
      })) || [];
      
      setAssignments(localAssignments);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = useCallback((plotId: string, workCategoryId: string, assignedUserId: string, estimatedHours: number, dueDate: string) => {
    console.log("updateAssignment called with:", { plotId, workCategoryId, assignedUserId, estimatedHours, dueDate });
    
    setAssignments(prev => {
      const existing = prev.findIndex(a => a.plotId === plotId && a.workCategoryId === workCategoryId);
      const newAssignment = { plotId, workCategoryId, assignedUserId, estimatedHours, dueDate };
      
      if (existing >= 0) {
        console.log("Updating existing assignment at index:", existing);
        const updated = [...prev];
        updated[existing] = newAssignment;
        return updated;
      } else {
        console.log("Adding new assignment");
        return [...prev, newAssignment];
      }
    });
  }, []);

  const handleBulkAssignment = useCallback((workCategoryId: string, assignedUserId: string, estimatedHours: number, dueDate: string) => {
    console.log("handleBulkAssignment called with:", { 
      workCategoryId, 
      assignedUserId, 
      estimatedHours, 
      dueDate, 
      totalPlots: plots.length 
    });
    
    const newAssignments: Assignment[] = [];
    let skippedCount = 0;
    let addedCount = 0;

    plots.forEach(plot => {
      // Check if this plot already has an assignment for this work category
      const existingAssignment = assignments.find(a => 
        a.plotId === plot.id && a.workCategoryId === workCategoryId
      );

      if (!existingAssignment) {
        newAssignments.push({
          plotId: plot.id,
          workCategoryId,
          assignedUserId,
          estimatedHours,
          dueDate
        });
        addedCount++;
      } else {
        skippedCount++;
      }
    });
    
    console.log(`Bulk assignment summary: ${addedCount} added, ${skippedCount} skipped`);

    // Update the assignments state
    setAssignments(prev => {
      console.log("Current assignments:", prev.length);
      console.log("New assignments to add:", newAssignments.length);
      return [...prev, ...newAssignments];
    });

    // Show feedback to user
    const workCategory = workCategories.find(wc => wc.id === workCategoryId);
    const workCategoryName = workCategory ? `${workCategory.main_category} - ${workCategory.sub_task}` : 'Work';
    const userName = users.find(u => u.id === assignedUserId)?.name || 'User';
    
    toast({
      title: "Bulk Assignment Complete",
      description: `${workCategoryName} assigned to ${userName} for ${addedCount} plots${skippedCount > 0 ? ` (${skippedCount} already assigned)` : ''}`,
    });
  }, [plots, assignments, workCategories, users, toast]);

  const removeAssignment = useCallback((plotId: string, workCategoryId: string) => {
    console.log("removeAssignment called for:", { plotId, workCategoryId });
    
    setAssignments(prev => {
      const filtered = prev.filter(a => !(a.plotId === plotId && a.workCategoryId === workCategoryId));
      console.log(`Removed assignment. Previous count: ${prev.length}, new count: ${filtered.length}`);
      return filtered;
    });
    
    toast({
      title: "Assignment Removed",
      description: "The assignment has been removed",
    });
  }, [toast]);

  const saveAssignments = async () => {
    if (assignments.length === 0) {
      toast({
        title: "No Assignments",
        description: "There are no assignments to save",
      });
      return;
    }
    
    try {
      console.log("Saving assignments:", assignments.length);
      setSavingAssignments(true);

      // Delete existing assignments for these plots
      const plotIds = plots.map(p => p.id);
      console.log("Deleting existing assignments for plots:", plotIds.length);
      
      const { error: deleteError } = await supabase
        .from('unit_work_assignments')
        .delete()
        .in('plot_id', plotIds);
        
      if (deleteError) {
        console.error("Error deleting existing assignments:", deleteError);
        throw deleteError;
      }

      // Insert new assignments
      if (assignments.length > 0) {
        const assignmentsToInsert = assignments.map(a => ({
          plot_id: a.plotId,
          work_category_id: a.workCategoryId,
          assigned_user_id: a.assignedUserId,
          estimated_hours: a.estimatedHours,
          due_date: a.dueDate || null,
          ai_suggested: false,
          status: 'assigned' as 'assigned'
        }));
        
        console.log("Inserting new assignments:", assignmentsToInsert.length);

        const { error: insertError } = await supabase
          .from('unit_work_assignments')
          .insert(assignmentsToInsert);

        if (insertError) {
          console.error("Error inserting assignments:", insertError);
          throw insertError;
        }
      }

      toast({
        title: "Success",
        description: `Saved ${assignments.length} work assignments`,
      });

    } catch (error) {
      console.error('Error saving assignments:', error);
      toast({
        title: "Error",
        description: "Failed to save assignments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingAssignments(false);
    }
  };

  const handleAIAssignment = (suggestions: any[]) => {
    console.log("AI assignment suggestions received:", suggestions.length);
    
    // Apply AI suggestions to assignments
    const newAssignments = suggestions.map(s => ({
      plotId: s.plotId,
      workCategoryId: s.workCategoryId,
      assignedUserId: s.userId,
      estimatedHours: s.estimatedHours,
      dueDate: s.dueDate
    }));

    setAssignments(prev => {
      const filtered = prev.filter(a => !suggestions.some(s => s.plotId === a.plotId && s.workCategoryId === a.workCategoryId));
      return [...filtered, ...newAssignments];
    });

    toast({
      title: "AI Assignment Complete",
      description: `Applied ${suggestions.length} AI-suggested assignments`,
    });
  };

  const togglePlotSelection = useCallback((plotId: string) => {
    console.log("Plot selection toggled:", plotId);
    
    setSelectedPlots(prev => 
      prev.includes(plotId) 
        ? prev.filter(id => id !== plotId)
        : [...prev, plotId]
    );
  }, []);

  const selectAllPlots = useCallback(() => {
    console.log("Selecting all plots");
    setSelectedPlots(plots.map(p => p.id));
  }, [plots]);

  const clearSelection = useCallback(() => {
    console.log("Clearing plot selection");
    setSelectedPlots([]);
  }, []);

  if (loading && plots.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading project units...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Assignment for {(user as any)?.name?.split(' ')[0] || 'Mark'}</h1>
          <p className="text-muted-foreground">Drag-drop or AI auto—save hours!</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              console.log("Opening AI modal");
              setShowAIModal(true);
            }}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Auto-Assign (AI)
          </Button>
          <Button
            onClick={saveAssignments}
            disabled={savingAssignments || assignments.length === 0}
            className="gap-2"
          >
            {savingAssignments ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Assignments ({assignments.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{plots.length}</p>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{workCategories.length}</p>
                <p className="text-sm text-muted-foreground">Work Types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Available Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selection Controls */}
      {selectedPlots.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{selectedPlots.length} selected</Badge>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={selectAllPlots}>
                  Select All
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  console.log("Opening AI modal for selected plots");
                  setShowAIModal(true);
                }}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Bulk AI Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Assignment Engine */}
      <SmartAssignmentEngine
        plots={plots}
        workCategories={workCategories}
        users={users}
        projectId={projectId!}
        onApplyAssignments={handleAIAssignment}
      />

      {/* Interactive Heatmap */}
      <InteractiveHeatmap
        plots={plots}
        projectId={projectId!}
        onPlotClick={(plot) => {
          console.log('Plot clicked:', plot);
        }}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Units Grid - Takes 2/3 */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Project Units</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plots.map((plot) => (
              <PlotAssignmentCard
                key={plot.id}
                plot={plot}
                workCategories={workCategories}
                users={users}
                assignments={assignments.filter(a => a.plotId === plot.id)}
                onUpdateAssignment={updateAssignment}
                onRemoveAssignment={removeAssignment}
                onBulkAssignment={handleBulkAssignment}
                isSelected={selectedPlots.includes(plot.id)}
                onToggleSelection={() => togglePlotSelection(plot.id)}
                totalPlotsCount={plots.length}
              />
            ))}
          </div>
        </div>

        {/* Leaderboard - Takes 1/3 */}
        <div className="lg:col-span-1">
          <Leaderboard projectId={projectId} timeframe="week" />
        </div>
      </div>

      {/* AI Assignment Modal */}
      <AIAssignmentModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        plots={selectedPlots.length > 0 ? plots.filter(p => selectedPlots.includes(p.id)) : plots}
        workCategories={workCategories}
        users={users}
        onApplyAssignments={handleAIAssignment}
      />
    </div>
  );
};
