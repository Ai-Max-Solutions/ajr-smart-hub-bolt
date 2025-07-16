
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
  completionRate: number;
  averageHours: number;
  activeUsers: number;
}

interface PredictiveAnalytics {
  riskFactors: any[];
  predictions: any[];
  recommendations: string[];
}

interface ResourceEfficiency {
  utilizationRate: number;
  efficiency: number;
  recommendations: string[];
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

  const getProjectAnalytics = async (projectId: string): Promise<ProjectAnalytics> => {
    return {
      projectId,
      completionRate: 75,
      averageHours: 8.5,
      activeUsers: 12
    };
  };

  const getPredictiveAnalytics = async (): Promise<PredictiveAnalytics> => {
    return {
      riskFactors: [],
      predictions: [],
      recommendations: ['Increase resource allocation', 'Review timelines']
    };
  };

  const getResourceEfficiency = async (): Promise<ResourceEfficiency> => {
    return {
      utilizationRate: 85,
      efficiency: 92,
      recommendations: ['Optimize scheduling', 'Reduce downtime']
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

  const exportReport = (format: 'csv' | 'pdf' = 'csv') => {
    exportData('userPerformance');
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
