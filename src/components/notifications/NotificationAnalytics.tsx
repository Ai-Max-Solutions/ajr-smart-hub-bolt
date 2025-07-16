import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  total_notifications: number;
  unread_count: number;
  high_priority_unread: number;
  compliance_overdue: number;
  avg_response_time_hours: number;
  ai_predictions_accurate: number;
  by_priority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  by_type: {
    compliance: number;
    safety: number;
    training: number;
    document: number;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export const NotificationAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, projectFilter]);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // For now, we'll create mock data since the function doesn't exist yet
      // In a real implementation, you would call the actual function
      const mockData: AnalyticsData = {
        total_notifications: 156,
        unread_count: 23,
        high_priority_unread: 7,
        compliance_overdue: 3,
        avg_response_time_hours: 2.4,
        ai_predictions_accurate: 142,
        by_priority: {
          critical: 12,
          high: 34,
          medium: 78,
          low: 32
        },
        by_type: {
          compliance: 45,
          safety: 38,
          training: 42,
          document: 31
        }
      };

      setData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const priorityData = Object.entries(data.by_priority).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: key === 'critical' ? '#ef4444' : key === 'high' ? '#f97316' : key === 'medium' ? '#eab308' : '#22c55e'
  }));

  const typeData = Object.entries(data.by_type).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value
  }));

  const responseRate = data.total_notifications > 0 
    ? ((data.total_notifications - data.unread_count) / data.total_notifications * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.projectname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">{responseRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{data.avg_response_time_hours.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{data.high_priority_unread}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{data.compliance_overdue}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Accuracy</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.total_notifications > 0 
                    ? Math.round((data.ai_predictions_accurate / data.total_notifications) * 100)
                    : 0
                  }%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{data.total_notifications}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-medium text-green-800">High AI Prediction Accuracy</h4>
                <p className="text-sm text-green-600">
                  AI predictions are {Math.round((data.ai_predictions_accurate / data.total_notifications) * 100)}% accurate, 
                  helping prevent compliance issues
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>

            {data.compliance_overdue > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-800">Overdue Compliance Items</h4>
                  <p className="text-sm text-red-600">
                    {data.compliance_overdue} compliance items are overdue and need immediate attention
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            )}

            {data.avg_response_time_hours < 4 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-blue-800">Fast Response Times</h4>
                  <p className="text-sm text-blue-600">
                    Average response time of {data.avg_response_time_hours.toFixed(1)} hours shows good engagement
                  </p>
                </div>
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};