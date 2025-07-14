import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectAnalytics {
  project_id: string;
  period: {
    start_date: string;
    end_date: string;
  };
  workforce: {
    active_workers: number;
    total_hours: number;
    avg_hours_per_day: number;
    productivity_score: number;
  };
  completion: {
    total_plots: number;
    completed_plots: number;
    completion_rate: number;
    avg_completion: number;
  };
  costs: {
    actual_cost: number;
    planned_cost: number;
    variance_percentage: number;
    budget_status: 'on_track' | 'warning' | 'over_budget';
  };
}

export interface PredictiveAnalytics {
  project_id: string;
  current_completion: number;
  predicted_completion_date: string | null;
  confidence_level: 'high' | 'medium' | 'low';
  daily_progress_rate: number;
  risk_factors: string[];
}

export interface ResourceEfficiency {
  period_days: number;
  project_id: string | null;
  summary: {
    total_workers: number;
    avg_efficiency: number;
    efficiency_range: {
      min: number;
      max: number;
      stddev: number;
    };
  };
  top_performers: Array<{
    user_id: string;
    name: string;
    role: string;
    efficiency: number;
    plots_completed: number;
    total_hours: number;
  }>;
}

export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProjectAnalytics = async (
    projectId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProjectAnalytics | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Since the stored procedure doesn't exist yet, we'll create a basic version
      // using direct queries to existing tables
      
      // Get work tracking data
      const { data: workData, error: workError } = await supabase
        .from('Work_Tracking_History')
        .select(`
          user_id,
          hours_worked,
          work_date,
          plot_id,
          Plots!inner(
            completion_percentage,
            Levels!inner(
              Blocks!inner(
                project
              )
            )
          )
        `)
        .eq('Plots.Levels.Blocks.project', projectId);

      if (workError) throw workError;

      // Calculate basic analytics
      const activeWorkers = new Set(workData?.map(w => w.user_id) || []).size;
      const totalHours = workData?.reduce((sum, w) => sum + (w.hours_worked || 0), 0) || 0;
      const avgHoursPerDay = totalHours > 0 ? totalHours / (workData?.length || 1) : 0;
      
      // Get plots data
      const { data: plotsData, error: plotsError } = await supabase
        .from('Plots')
        .select(`
          completion_percentage,
          Levels!inner(
            Blocks!inner(
              project
            )
          )
        `)
        .eq('Levels.Blocks.project', projectId);

      if (plotsError) throw plotsError;

      const totalPlots = plotsData?.length || 0;
      const completedPlots = plotsData?.filter(p => (p.completion_percentage || 0) >= 100).length || 0;
      const avgCompletion = plotsData?.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / totalPlots || 0;

      const analytics: ProjectAnalytics = {
        project_id: projectId,
        period: {
          start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: endDate || new Date().toISOString().split('T')[0]
        },
        workforce: {
          active_workers: activeWorkers,
          total_hours: totalHours,
          avg_hours_per_day: avgHoursPerDay,
          productivity_score: totalHours > 0 ? Math.round((workData?.length || 0) / totalHours * 100) : 0
        },
        completion: {
          total_plots: totalPlots,
          completed_plots: completedPlots,
          completion_rate: totalPlots > 0 ? Math.round((completedPlots / totalPlots) * 100) : 0,
          avg_completion: Math.round(avgCompletion)
        },
        costs: {
          actual_cost: 0,
          planned_cost: 0,
          variance_percentage: 0,
          budget_status: 'on_track'
        }
      };

      return analytics;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPredictiveAnalytics = async (projectId: string): Promise<PredictiveAnalytics | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get recent work progress
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const { data: workData, error: workError } = await supabase
        .from('Work_Tracking_History')
        .select(`
          work_date,
          plot_id,
          Plots!inner(
            completion_percentage,
            Levels!inner(
              Blocks!inner(
                project
              )
            )
          )
        `)
        .eq('Plots.Levels.Blocks.project', projectId)
        .gte('work_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (workError) throw workError;

      // Calculate daily progress
      const dailyProgress = new Map<string, Set<string>>();
      workData?.forEach(work => {
        const date = work.work_date;
        if (!dailyProgress.has(date)) {
          dailyProgress.set(date, new Set());
        }
        dailyProgress.get(date)?.add(work.plot_id);
      });

      const avgPlotsPerDay = Array.from(dailyProgress.values())
        .reduce((sum, plots) => sum + plots.size, 0) / dailyProgress.size || 0;

      // Get current completion
      const { data: plotsData } = await supabase
        .from('Plots')
        .select(`
          completion_percentage,
          Levels!inner(
            Blocks!inner(
              project
            )
          )
        `)
        .eq('Levels.Blocks.project', projectId);

      const currentCompletion = plotsData?.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / (plotsData?.length || 1) || 0;
      
      const predictive: PredictiveAnalytics = {
        project_id: projectId,
        current_completion: Math.round(currentCompletion),
        predicted_completion_date: avgPlotsPerDay > 0 && currentCompletion < 100 
          ? new Date(Date.now() + ((100 - currentCompletion) / avgPlotsPerDay) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null,
        confidence_level: dailyProgress.size >= 14 && avgPlotsPerDay > 0 ? 'high' : 
                         dailyProgress.size >= 7 ? 'medium' : 'low',
        daily_progress_rate: Math.round(avgPlotsPerDay * 100) / 100,
        risk_factors: [
          ...(avgPlotsPerDay < 1 ? ['low_productivity'] : []),
          ...(currentCompletion < 50 && dailyProgress.size > 30 ? ['behind_schedule'] : [])
        ]
      };

      return predictive;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getResourceEfficiency = async (
    projectId?: string,
    periodDays: number = 30
  ): Promise<ResourceEfficiency | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      
      // Get user efficiency data
      let query = supabase
        .from('Users')
        .select(`
          whalesync_postgres_id,
          fullname,
          role,
          Work_Tracking_History!inner(
            hours_worked,
            plot_id,
            work_date
          )
        `)
        .eq('employmentstatus', 'Active')
        .gte('Work_Tracking_History.work_date', startDate.toISOString().split('T')[0]);

      if (projectId) {
        query = query.eq('currentproject', projectId);
      }

      const { data: userData, error: userError } = await query;
      
      if (userError) throw userError;

      // Calculate efficiency metrics
      const userEfficiency = userData?.map(user => {
        const workHistory = user.Work_Tracking_History || [];
        const uniquePlots = new Set(workHistory.map(w => w.plot_id)).size;
        const totalHours = workHistory.reduce((sum, w) => sum + (w.hours_worked || 0), 0);
        const efficiency = totalHours > 0 ? uniquePlots / totalHours : 0;

        return {
          user_id: user.whalesync_postgres_id,
          name: user.fullname || 'Unknown',
          role: user.role || 'Unknown',
          efficiency: Math.round(efficiency * 1000) / 1000,
          plots_completed: uniquePlots,
          total_hours: totalHours
        };
      }).filter(user => user.total_hours > 0) || [];

      const efficiencies = userEfficiency.map(u => u.efficiency);
      const avgEfficiency = efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length || 0;
      const minEfficiency = Math.min(...efficiencies) || 0;
      const maxEfficiency = Math.max(...efficiencies) || 0;
      
      // Calculate standard deviation
      const variance = efficiencies.reduce((sum, e) => sum + Math.pow(e - avgEfficiency, 2), 0) / efficiencies.length;
      const stddev = Math.sqrt(variance);

      const efficiency: ResourceEfficiency = {
        period_days: periodDays,
        project_id: projectId || null,
        summary: {
          total_workers: userEfficiency.length,
          avg_efficiency: Math.round(avgEfficiency * 1000) / 1000,
          efficiency_range: {
            min: Math.round(minEfficiency * 1000) / 1000,
            max: Math.round(maxEfficiency * 1000) / 1000,
            stddev: Math.round(stddev * 1000) / 1000
          }
        },
        top_performers: userEfficiency
          .sort((a, b) => b.efficiency - a.efficiency)
          .slice(0, 5)
      };

      return efficiency;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (
    reportType: 'performance' | 'compliance' | 'cost' | 'resource',
    format: 'pdf' | 'excel' | 'csv',
    data: any
  ): Promise<Blob | null> => {
    setLoading(true);
    setError(null);
    
    try {
      if (format === 'csv') {
        // Simple CSV export
        const csv = convertToCSV(data, reportType);
        return new Blob([csv], { type: 'text/csv' });
      }
      
      // For PDF and Excel, we'd typically use a library or service
      // For now, return JSON as fallback
      const json = JSON.stringify(data, null, 2);
      return new Blob([json], { type: 'application/json' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getProjectAnalytics,
    getPredictiveAnalytics,
    getResourceEfficiency,
    exportReport
  };
}

function convertToCSV(data: any, reportType: string): string {
  if (reportType === 'performance' && data.workforce) {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Active Workers', data.workforce.active_workers],
      ['Total Hours', data.workforce.total_hours],
      ['Avg Hours Per Day', data.workforce.avg_hours_per_day],
      ['Productivity Score', data.workforce.productivity_score],
      ['Total Plots', data.completion.total_plots],
      ['Completed Plots', data.completion.completed_plots],
      ['Completion Rate %', data.completion.completion_rate]
    ];
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  return 'Data,Value\nNo data available,0';
}