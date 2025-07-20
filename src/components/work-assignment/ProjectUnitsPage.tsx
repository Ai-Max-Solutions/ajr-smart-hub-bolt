import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Save, Users, Calendar, Target } from 'lucide-react';
import { PlotAssignmentCard } from './PlotAssignmentCard';
import { AIAssignmentModal } from './AIAssignmentModal';

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
  
  const [plots, setPlots] = useState<Plot[]>([]);
  const [workCategories, setWorkCategories] = useState<WorkCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedPlots, setSelectedPlots] = useState<string[]>([]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load plots
      const { data: plotsData, error: plotsError } = await supabase
        .from('plots')
        .select('*')
        .eq('project_id', projectId)
        .order('plot_sequence_order');

      if (plotsError) throw plotsError;

      // Load work categories
      const { data: workCategoriesData, error: workCategoriesError } = await supabase
        .from('work_categories')
        .select('*')
        .order('sequence_order');

      if (workCategoriesError) throw workCategoriesError;

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, role')
        .in('role', ['Operative', 'Supervisor', 'PM']);

      if (usersError) throw usersError;

      // Load existing assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('unit_work_assignments')
        .select('*')
        .in('plot_id', plotsData?.map(p => p.id) || []);

      if (assignmentsError) throw assignmentsError;

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

  const updateAssignment = (plotId: string, workCategoryId: string, assignedUserId: string, estimatedHours: number, dueDate: string) => {
    setAssignments(prev => {
      const existing = prev.findIndex(a => a.plotId === plotId && a.workCategoryId === workCategoryId);
      const newAssignment = { plotId, workCategoryId, assignedUserId, estimatedHours, dueDate };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newAssignment;
        return updated;
      } else {
        return [...prev, newAssignment];
      }
    });
  };

  const removeAssignment = (plotId: string, workCategoryId: string) => {
    setAssignments(prev => prev.filter(a => !(a.plotId === plotId && a.workCategoryId === workCategoryId)));
  };

  const saveAssignments = async () => {
    try {
      setLoading(true);

      // Delete existing assignments for these plots
      const plotIds = plots.map(p => p.id);
      await supabase
        .from('unit_work_assignments')
        .delete()
        .in('plot_id', plotIds);

      // Insert new assignments
      const assignmentsToInsert = assignments.map(a => ({
        plot_id: a.plotId,
        work_category_id: a.workCategoryId,
        assigned_user_id: a.assignedUserId,
        estimated_hours: a.estimatedHours,
        due_date: a.dueDate || null,
        ai_suggested: false,
        status: 'assigned' as 'assigned'
      }));

      if (assignmentsToInsert.length > 0) {
        const { error } = await supabase
          .from('unit_work_assignments')
          .insert(assignmentsToInsert);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Saved ${assignments.length} work assignments`,
      });

    } catch (error) {
      console.error('Error saving assignments:', error);
      toast({
        title: "Error",
        description: "Failed to save assignments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAIAssignment = (suggestions: any[]) => {
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

  const togglePlotSelection = (plotId: string) => {
    setSelectedPlots(prev => 
      prev.includes(plotId) 
        ? prev.filter(id => id !== plotId)
        : [...prev, plotId]
    );
  };

  const selectAllPlots = () => {
    setSelectedPlots(plots.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPlots([]);
  };

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
          <h1 className="text-3xl font-bold">Work Assignment</h1>
          <p className="text-muted-foreground">Assign work types to project units</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAIModal(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Auto-Assign (AI)
          </Button>
          <Button
            onClick={saveAssignments}
            disabled={loading || assignments.length === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Assignments ({assignments.length})
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
                onClick={() => setShowAIModal(true)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Bulk AI Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Units Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {plots.map((plot) => (
          <PlotAssignmentCard
            key={plot.id}
            plot={plot}
            workCategories={workCategories}
            users={users}
            assignments={assignments.filter(a => a.plotId === plot.id)}
            onUpdateAssignment={updateAssignment}
            onRemoveAssignment={removeAssignment}
            isSelected={selectedPlots.includes(plot.id)}
            onToggleSelection={() => togglePlotSelection(plot.id)}
          />
        ))}
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