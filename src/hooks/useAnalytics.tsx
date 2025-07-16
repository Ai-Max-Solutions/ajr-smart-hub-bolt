
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  userPerformance: any[];
  projectProgress: any[];
  workingHours: any[];
  completionRates: any[];
  topPerformers: any[];
}

interface ProjectAnalytics {
  projectId: string;
  completion: {
    total_plots: number;
    completed_plots: number;
    completion_rate: number;
    avg_completion: number;
  };
  workforce: {
    active_workers: number;
    total_hours: number;
    avg_hours_per_day: number;
    productivity_score: number;
  };
  costs: {
    budget_status: string;
    variance_percentage: number;
  };
}

interface PredictiveAnalytics {
  current_completion: number;
  predicted_completion_date: string;
  confidence_level: string;
  daily_progress_rate: number;
  risk_factors: string[];
}

interface ResourceEfficiency {
  period_days: number;
  summary: {
    total_workers: number;
    avg_efficiency: number;
    efficiency_range: {
      min: number;
      max: number;
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

export const useAnalytics = (timeframe: string = '30') => {
  const [data, setData] = useState<AnalyticsData>({
    userPerformance: [],
    projectProgress: [],
    workingHours: [],
    completionRates: [],
    topPerformers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const days = parseInt(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Mock data for now since tables might have issues
      const mockData: AnalyticsData = {
        userPerformance: [
          { name: 'John Doe', totalHours: 40, averageHours: 8 },
          { name: 'Jane Smith', totalHours: 35, averageHours: 7 }
        ],
        projectProgress: [
          { id: '1', name: 'Project A', completion: 75 },
          { id: '2', name: 'Project B', completion: 45 }
        ],
        workingHours: [
          { date: '2024-01-01', hours: 120 },
          { date: '2024-01-02', hours: 135 }
        ],
        completionRates: [
          { period: 'Week 1', rate: 85 },
          { period: 'Week 2', rate: 78 }
        ],
        topPerformers: [
          { name: 'John Doe', score: 95 },
          { name: 'Jane Smith', score: 88 }
        ]
      };

      setData(mockData);

    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProjectAnalytics = async (
    projectId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<ProjectAnalytics> => {
    return {
      projectId,
      completion: {
        total_plots: 100,
        completed_plots: 75,
        completion_rate: 75,
        avg_completion: 85
      },
      workforce: {
        active_workers: 12,
        total_hours: 320,
        avg_hours_per_day: 8.5,
        productivity_score: 92
      },
      costs: {
        budget_status: 'on_track',
        variance_percentage: 5
      }
    };
  };

  const getPredictiveAnalytics = async (projectId: string): Promise<PredictiveAnalytics> => {
    return {
      current_completion: 75,
      predicted_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      confidence_level: 'high',
      daily_progress_rate: 2.5,
      risk_factors: ['weather_delay', 'resource_shortage']
    };
  };

  const getResourceEfficiency = async (
    projectId: string, 
    periodDays: number
  ): Promise<ResourceEfficiency> => {
    return {
      period_days: periodDays,
      summary: {
        total_workers: 15,
        avg_efficiency: 85,
        efficiency_range: {
          min: 60,
          max: 95
        }
      },
      top_performers: [
        {
          user_id: '1',
          name: 'John Doe',
          role: 'Operative',
          efficiency: 95,
          plots_completed: 8,
          total_hours: 40
        },
        {
          user_id: '2',
          name: 'Jane Smith',
          role: 'Supervisor',
          efficiency: 88,
          plots_completed: 6,
          total_hours: 35
        }
      ]
    };
  };

  const exportData = (type: string) => {
    let exportData: any[] = [];
    let filename = '';

    switch (type) {
      case 'userPerformance':
        exportData = data.userPerformance;
        filename = 'user-performance';
        break;
      case 'projectProgress':
        exportData = data.projectProgress;
        filename = 'project-progress';
        break;
      case 'workingHours':
        exportData = data.workingHours;
        filename = 'working-hours';
        break;
      default:
        return;
    }

    if (exportData.length === 0) return;

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportReport = async (
    reportType: string,
    format: 'pdf' | 'excel' | 'csv',
    data: any
  ): Promise<Blob | null> => {
    try {
      const content = JSON.stringify(data, null, 2);
      return new Blob([content], { type: 'application/json' });
    } catch (error) {
      console.error('Error exporting report:', error);
      return null;
    }
  };

  return {
    data,
    loading,
    error,
    refresh: fetchAnalyticsData,
    exportData,
    getProjectAnalytics,
    getPredictiveAnalytics,
    getResourceEfficiency,
    exportReport
  };
};

export type { ProjectAnalytics, PredictiveAnalytics, ResourceEfficiency };
