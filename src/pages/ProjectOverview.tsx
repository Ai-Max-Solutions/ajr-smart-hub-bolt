import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  LayoutGrid, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingDown,
  TrendingUp,
  Brain,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react';

interface PlotUnit {
  id: string;
  name: string;
  code: string;
  composite_code: string;
  status: string;
  completion_percent: number;
  assignments_count: number;
  completed_assignments: number;
  overdue_assignments: number;
  plot: {
    name: string;
    code: string;
  };
  risk_level?: 'low' | 'medium' | 'high';
  delay_risk?: number;
}

interface ProjectStats {
  total_units: number;
  completed_units: number;
  in_progress_units: number;
  not_started_units: number;
  overdue_units: number;
  average_completion: number;
}

interface DelayPrediction {
  unit_id: string;
  unit_name: string;
  risk_level: 'low' | 'medium' | 'high';
  delay_probability: number;
  estimated_delay_days: number;
  factors: string[];
}

const ProjectOverview = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [plotUnits, setPlotUnits] = useState<PlotUnit[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    total_units: 0,
    completed_units: 0,
    in_progress_units: 0,
    not_started_units: 0,
    overdue_units: 0,
    average_completion: 0
  });
  const [delayPredictions, setDelayPredictions] = useState<DelayPrediction[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [showPredictionsDialog, setShowPredictionsDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<PlotUnit | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectOverview();
    }
  }, [projectId]);

  const loadProjectOverview = async () => {
    try {
      // Load plots with their completion data
      const { data: plotsData, error: plotsError } = await supabase
        .from('plots')
        .select(`
          id,
          name,
          code,
          composite_code,
          status,
          handed_over
        `)
        .eq('project_id', projectId);

      if (plotsError) throw plotsError;

      // For each plot, calculate completion metrics
      const unitsWithMetrics = await Promise.all(
        (plotsData || []).map(async (plot) => {
          // Get assignments for this plot
          const { data: assignments } = await supabase
            .from('unit_work_assignments')
            .select('id, status, due_date')
            .eq('plot_id', plot.id);

          const assignmentsCount = assignments?.length || 0;
          const completedAssignments = assignments?.filter(a => a.status === 'completed').length || 0;
          const overdueAssignments = assignments?.filter(a => 
            a.due_date && new Date(a.due_date) < new Date() && a.status !== 'completed'
          ).length || 0;

          const completionPercent = assignmentsCount > 0 ? (completedAssignments / assignmentsCount) * 100 : 0;

          // Calculate risk level based on completion and overdue work
          let riskLevel: 'low' | 'medium' | 'high' = 'low';
          if (overdueAssignments > 0 || completionPercent < 25) {
            riskLevel = 'high';
          } else if (completionPercent < 75) {
            riskLevel = 'medium';
          }

          return {
            ...plot,
            completion_percent: completionPercent,
            assignments_count: assignmentsCount,
            completed_assignments: completedAssignments,
            overdue_assignments: overdueAssignments,
            plot: { name: plot.name, code: plot.code },
            risk_level: riskLevel,
            delay_risk: overdueAssignments > 0 ? Math.min(90, 30 + (overdueAssignments * 15)) : 10
          };
        })
      );

      setPlotUnits(unitsWithMetrics);

      // Calculate project stats
      const totalUnits = unitsWithMetrics.length;
      const completedUnits = unitsWithMetrics.filter(u => u.completion_percent >= 100).length;
      const inProgressUnits = unitsWithMetrics.filter(u => u.completion_percent > 0 && u.completion_percent < 100).length;
      const notStartedUnits = unitsWithMetrics.filter(u => u.completion_percent === 0).length;
      const overdueUnits = unitsWithMetrics.filter(u => u.overdue_assignments > 0).length;
      const averageCompletion = totalUnits > 0 ? 
        unitsWithMetrics.reduce((sum, u) => sum + u.completion_percent, 0) / totalUnits : 0;

      setProjectStats({
        total_units: totalUnits,
        completed_units: completedUnits,
        in_progress_units: inProgressUnits,
        not_started_units: notStartedUnits,
        overdue_units: overdueUnits,
        average_completion: averageCompletion
      });

    } catch (error) {
      console.error('Error loading project overview:', error);
      toast({
        title: "Error",
        description: "Failed to load project overview",
        variant: "destructive"
      });
    }
  };

  const forecastDelays = async () => {
    setIsLoadingPredictions(true);
    
    try {
      // Simulate AI delay prediction
      // In real implementation, would call OpenAI API with project data
      const predictions: DelayPrediction[] = plotUnits
        .filter(unit => unit.risk_level !== 'low')
        .map(unit => {
          const factors = [];
          if (unit.overdue_assignments > 0) factors.push('Overdue assignments');
          if (unit.completion_percent < 50) factors.push('Below 50% completion');
          if (unit.assignments_count > 10) factors.push('High workload');
          if (Math.random() > 0.7) factors.push('Resource constraints');
          if (Math.random() > 0.8) factors.push('Weather dependencies');

          const delayProbability = Math.min(95, unit.delay_risk! + Math.random() * 20);
          const estimatedDelayDays = Math.ceil((delayProbability / 100) * 14);

          return {
            unit_id: unit.id,
            unit_name: unit.name,
            risk_level: unit.risk_level!,
            delay_probability: delayProbability,
            estimated_delay_days: estimatedDelayDays,
            factors
          };
        })
        .sort((a, b) => b.delay_probability - a.delay_probability);

      setDelayPredictions(predictions);
      setShowPredictionsDialog(true);

      toast({
        title: "AI Analysis Complete! 🤖",
        description: `Identified ${predictions.length} units at risk of delays`,
      });

    } catch (error) {
      console.error('Error forecasting delays:', error);
      toast({
        title: "Error",
        description: "Failed to forecast delays",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  const getCompletionColor = (percent: number) => {
    if (percent >= 90) return 'bg-green-500';
    if (percent >= 70) return 'bg-yellow-500';
    if (percent >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Overview</h1>
          <p className="text-muted-foreground">Real-time progress tracking and AI delay prediction</p>
        </div>
        
        <Button 
          onClick={forecastDelays}
          disabled={isLoadingPredictions}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isLoadingPredictions ? (
            <Activity className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          {isLoadingPredictions ? 'Analyzing...' : 'AI Delay Forecast'}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">{projectStats.total_units}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{projectStats.completed_units}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{projectStats.in_progress_units}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Not Started</p>
                <p className="text-2xl font-bold">{projectStats.not_started_units}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{projectStats.overdue_units}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Complete</p>
                <p className="text-2xl font-bold">{projectStats.average_completion.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Unit Progress Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {plotUnits.map((unit) => (
              <Card 
                key={unit.id} 
                className={`cursor-pointer transition-all hover:scale-105 border-2 ${
                  unit.completion_percent >= 90 ? 'border-green-200 bg-green-50 dark:bg-green-950/20' :
                  unit.completion_percent >= 70 ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' :
                  unit.completion_percent >= 40 ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20' :
                  'border-red-200 bg-red-50 dark:bg-red-950/20'
                }`}
                onClick={() => setSelectedUnit(unit)}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{unit.name}</h3>
                      {unit.risk_level && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getRiskColor(unit.risk_level)}`}
                        >
                          {unit.risk_level}
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs font-medium">{unit.completion_percent.toFixed(0)}%</span>
                      </div>
                      <Progress 
                        value={unit.completion_percent} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{unit.completed_assignments}/{unit.assignments_count}</span>
                      {unit.overdue_assignments > 0 && (
                        <span className="text-red-500 font-medium">
                          {unit.overdue_assignments} overdue
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Summary */}
      {delayPredictions.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              High Risk Units ({delayPredictions.filter(p => p.risk_level === 'high').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {delayPredictions.filter(p => p.risk_level === 'high').slice(0, 3).map((prediction) => (
                <div key={prediction.unit_id} className="p-3 bg-white dark:bg-gray-800 rounded border">
                  <h4 className="font-semibold">{prediction.unit_name}</h4>
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Delay Risk:</span>
                      <span className="font-medium text-red-600">
                        {prediction.delay_probability.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Est. Delay:</span>
                      <span className="font-medium">
                        {prediction.estimated_delay_days} days
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Key factors: {prediction.factors.slice(0, 2).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unit Details Dialog */}
      <Dialog open={!!selectedUnit} onOpenChange={() => setSelectedUnit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Unit Details: {selectedUnit?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedUnit && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Progress Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Overall Progress:</span>
                      <span className="font-medium">{selectedUnit.completion_percent.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assignments:</span>
                      <span>{selectedUnit.completed_assignments}/{selectedUnit.assignments_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge>{selectedUnit.status}</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Risk Assessment</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <Badge className={getRiskColor(selectedUnit.risk_level || 'low')}>
                        {selectedUnit.risk_level}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Overdue Work:</span>
                      <span className={selectedUnit.overdue_assignments > 0 ? 'text-red-500 font-medium' : ''}>
                        {selectedUnit.overdue_assignments} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delay Risk:</span>
                      <span className="font-medium">{selectedUnit.delay_risk?.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Progress value={selectedUnit.completion_percent} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delay Predictions Dialog */}
      <Dialog open={showPredictionsDialog} onOpenChange={setShowPredictionsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Delay Forecast Results
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {delayPredictions.map((prediction) => (
              <div key={prediction.unit_id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{prediction.unit_name}</h3>
                      <Badge className={getRiskColor(prediction.risk_level)}>
                        {prediction.risk_level} risk
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Delay Probability:</span>
                        <p className="font-semibold text-lg">{prediction.delay_probability.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Estimated Delay:</span>
                        <p className="font-semibold text-lg">{prediction.estimated_delay_days} days</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Risk Factors:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prediction.factors.map((factor, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {prediction.delay_probability > 70 && (
                      <Badge className="bg-red-500 text-white">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        High Priority
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {delayPredictions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">All Clear! 🎉</h3>
                <p>No significant delay risks detected across the project units.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectOverview;