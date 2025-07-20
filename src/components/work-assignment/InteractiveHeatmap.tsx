import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Plot {
  id: string;
  name: string;
  code: string;
  composite_code: string;
  status: string;
}

interface PlotProgress {
  plotId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTask: number;
  progressPercentage: number;
  riskLevel: 'low' | 'medium' | 'high';
  nextDueDate: string | null;
}

interface InteractiveHeatmapProps {
  plots: Plot[];
  projectId: string;
  onPlotClick: (plot: Plot) => void;
}

export const InteractiveHeatmap: React.FC<InteractiveHeatmapProps> = ({
  plots,
  projectId,
  onPlotClick
}) => {
  const [plotProgress, setPlotProgress] = useState<Record<string, PlotProgress>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);

  useEffect(() => {
    loadPlotProgress();
  }, [plots, projectId]);

  const loadPlotProgress = async () => {
    try {
      setLoading(true);

      const plotIds = plots.map(p => p.id);
      if (plotIds.length === 0) return;

      // Get assignments and logs for all plots
      const { data: assignments } = await supabase
        .from('unit_work_assignments')
        .select(`
          id,
          plot_id,
          status,
          due_date,
          work_logs:unit_work_logs(status)
        `)
        .in('plot_id', plotIds);

      const progressData: Record<string, PlotProgress> = {};

      plots.forEach(plot => {
        const plotAssignments = assignments?.filter(a => a.plot_id === plot.id) || [];
        const totalTasks = plotAssignments.length;
        const completedTasks = plotAssignments.filter(a => 
          a.work_logs?.some(log => log.status === 'completed')
        ).length;
        const inProgressTasks = plotAssignments.filter(a => 
          a.status === 'in_progress'
        ).length;
        
        // Check for overdue tasks
        const now = new Date();
        const overdueTask = plotAssignments.filter(a => 
          a.due_date && new Date(a.due_date) < now && a.status !== 'completed'
        ).length;

        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        // Risk calculation
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (overdueTask > 0) riskLevel = 'high';
        else if (progressPercentage < 50 && inProgressTasks === 0) riskLevel = 'medium';

        // Next due date
        const upcomingTasks = plotAssignments
          .filter(a => a.due_date && a.status !== 'completed')
          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
        
        const nextDueDate = upcomingTasks.length > 0 ? upcomingTasks[0].due_date : null;

        progressData[plot.id] = {
          plotId: plot.id,
          totalTasks,
          completedTasks,
          inProgressTasks,
          overdueTask,
          progressPercentage: Math.round(progressPercentage),
          riskLevel,
          nextDueDate
        };
      });

      setPlotProgress(progressData);
    } catch (error) {
      console.error('Error loading plot progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number, riskLevel: string) => {
    if (riskLevel === 'high') return 'bg-red-500';
    if (riskLevel === 'medium') return 'bg-orange-500';
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const getProgressIntensity = (percentage: number) => {
    if (percentage === 100) return 'opacity-100';
    if (percentage >= 75) return 'opacity-80';
    if (percentage >= 50) return 'opacity-60';
    if (percentage >= 25) return 'opacity-40';
    if (percentage > 0) return 'opacity-20';
    return 'opacity-10';
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case 'medium': return <Clock className="h-3 w-3 text-orange-600" />;
      default: return <CheckCircle className="h-3 w-3 text-green-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading progress data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Interactive Progress Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>75%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>50-74%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>At Risk</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Overdue</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {plots.map((plot) => {
              const progress = plotProgress[plot.id];
              if (!progress) return null;

              return (
                <Tooltip key={plot.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        relative aspect-square rounded-lg cursor-pointer transition-all hover:scale-110 hover:shadow-lg
                        ${getProgressColor(progress.progressPercentage, progress.riskLevel)}
                        ${getProgressIntensity(progress.progressPercentage)}
                        ${selectedPlot === plot.id ? 'ring-2 ring-primary ring-offset-2' : ''}
                      `}
                      onClick={() => {
                        setSelectedPlot(plot.id);
                        onPlotClick(plot);
                      }}
                    >
                      {/* Plot Code */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-lg">
                          {plot.code}
                        </span>
                      </div>

                      {/* Risk Indicator */}
                      {progress.riskLevel !== 'low' && (
                        <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1">
                          {getRiskIcon(progress.riskLevel)}
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-lg overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-300"
                          style={{ width: `${progress.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <div className="font-medium">{plot.composite_code}</div>
                      <div className="text-sm text-muted-foreground">{plot.name}</div>
                      <div className="text-xs">
                        <div>Progress: {progress.progressPercentage}%</div>
                        <div>Tasks: {progress.completedTasks}/{progress.totalTasks}</div>
                        {progress.inProgressTasks > 0 && (
                          <div>In Progress: {progress.inProgressTasks}</div>
                        )}
                        {progress.overdueTask > 0 && (
                          <div className="text-red-600">Overdue: {progress.overdueTask}</div>
                        )}
                        {progress.nextDueDate && (
                          <div>Next Due: {new Date(progress.nextDueDate).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Selected Plot Details */}
          {selectedPlot && plotProgress[selectedPlot] && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">
                  {plots.find(p => p.id === selectedPlot)?.composite_code} - Selected Plot Details
                </h4>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onPlotClick(plots.find(p => p.id === selectedPlot)!)}
                  className="gap-1"
                >
                  <Eye className="h-3 w-3" />
                  View Details
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Progress</div>
                  <div className="font-medium">{plotProgress[selectedPlot].progressPercentage}%</div>
                  <Progress value={plotProgress[selectedPlot].progressPercentage} className="h-2 mt-1" />
                </div>
                <div>
                  <div className="text-muted-foreground">Tasks Completed</div>
                  <div className="font-medium">
                    {plotProgress[selectedPlot].completedTasks} / {plotProgress[selectedPlot].totalTasks}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">In Progress</div>
                  <div className="font-medium">{plotProgress[selectedPlot].inProgressTasks}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Risk Level</div>
                  <div className="flex items-center gap-1">
                    {getRiskIcon(plotProgress[selectedPlot].riskLevel)}
                    <span className="font-medium capitalize">{plotProgress[selectedPlot].riskLevel}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default InteractiveHeatmap;