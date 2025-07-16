
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  userPerformance: any[];
  projectProgress: any[];
  workingHours: any[];
  completionRates: any[];
  topPerformers: any[];
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

      // Fetch user performance data
      const { data: userPerformanceData, error: userPerfError } = await supabase
        .from('timesheets')
        .select(`
          user_id,
          total_hours,
          Users (
            id,
            fullname,
            role
          )
        `)
        .gte('week_start_date', startDate.toISOString().split('T')[0])
        .eq('status', 'approved');

      if (userPerfError) throw userPerfError;

      // Process user performance data
      const userStats = new Map();
      userPerformanceData?.forEach(timesheet => {
        const userId = timesheet.user_id;
        const user = timesheet.Users;
        
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            id: user?.id,
            name: user?.fullname,
            role: user?.role,
            totalHours: 0,
            weekCount: 0
          });
        }
        
        const stats = userStats.get(userId);
        stats.totalHours += timesheet.total_hours || 0;
        stats.weekCount += 1;
      });

      const processedUserPerformance = Array.from(userStats.values()).map(stats => ({
        ...stats,
        averageHours: stats.totalHours / Math.max(stats.weekCount, 1)
      }));

      // Fetch project progress data
      const { data: projectData, error: projectError } = await supabase
        .from('Projects')
        .select('id, projectname, status, startdate, plannedenddate')
        .in('status', ['Active', 'In Progress', 'Completed']);

      if (projectError) throw projectError;

      // Fetch work tracking history for completion rates
      const { data: workTrackingData, error: workError } = await supabase
        .from('Work_Tracking_History')
        .select('plot_id, work_date, hours_worked, user_id')
        .gte('work_date', startDate.toISOString().split('T')[0]);

      if (workError) throw workError;

      // Process working hours data by day
      const dailyHours = new Map();
      workTrackingData?.forEach(entry => {
        const date = entry.work_date;
        if (!dailyHours.has(date)) {
          dailyHours.set(date, 0);
        }
        dailyHours.set(date, dailyHours.get(date) + (entry.hours_worked || 0));
      });

      const workingHours = Array.from(dailyHours.entries()).map(([date, hours]) => ({
        date,
        hours
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Calculate top performers based on total hours
      const topPerformers = processedUserPerformance
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, 5);

      setData({
        userPerformance: processedUserPerformance,
        projectProgress: projectData || [],
        workingHours,
        completionRates: [], // Will be calculated based on plot completion
        topPerformers
      });

    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  return {
    data,
    loading,
    error,
    refresh: fetchAnalyticsData,
    exportData
  };
};
