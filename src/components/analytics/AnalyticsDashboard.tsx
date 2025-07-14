import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAnalytics, ProjectAnalytics, PredictiveAnalytics, ResourceEfficiency } from '@/hooks/useAnalytics';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Clock, Target, DollarSign,
  Download, AlertTriangle, CheckCircle, Calendar, Zap
} from 'lucide-react';
import { format } from 'date-fns';

interface AnalyticsDashboardProps {
  projectId?: string;
  userRole?: string;
}

export function AnalyticsDashboard({ projectId, userRole }: AnalyticsDashboardProps) {
  const { 
    loading, 
    error, 
    getProjectAnalytics, 
    getPredictiveAnalytics, 
    getResourceEfficiency,
    exportReport 
  } = useAnalytics();

  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [predictive, setPredictive] = useState<PredictiveAnalytics | null>(null);
  const [efficiency, setEfficiency] = useState<ResourceEfficiency | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

  useEffect(() => {
    if (projectId) {
      loadAnalytics();
    }
  }, [projectId, selectedPeriod, dateRange]);

  const loadAnalytics = async () => {
    if (!projectId) return;

    const startDate = dateRange?.from?.toISOString().split('T')[0];
    const endDate = dateRange?.to?.toISOString().split('T')[0];

    const [analyticsData, predictiveData, efficiencyData] = await Promise.all([
      getProjectAnalytics(projectId, startDate, endDate),
      getPredictiveAnalytics(projectId),
      getResourceEfficiency(projectId, parseInt(selectedPeriod))
    ]);

    setAnalytics(analyticsData);
    setPredictive(predictiveData);
    setEfficiency(efficiencyData);
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!analytics) return;
    
    const blob = await exportReport('performance', format, analytics);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${format}.${format === 'csv' ? 'csv' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'over_budget': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConfidenceLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading analytics: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = analytics ? [
    { name: 'Completed', value: analytics.completion.completed_plots, color: '#10b981' },
    { name: 'In Progress', value: analytics.completion.total_plots - analytics.completion.completed_plots, color: '#f59e0b' }
  ] : [];

  const efficiencyChartData = efficiency?.top_performers.map(performer => ({
    name: performer.name.split(' ')[0],
    efficiency: performer.efficiency,
    plots: performer.plots_completed,
    hours: performer.total_hours
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights and performance metrics
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.workforce.active_workers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.workforce.total_hours || 0} total hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.completion.completion_rate || 0}%</div>
                <Progress value={analytics?.completion.completion_rate || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.workforce.productivity_score || 0}</div>
                <p className="text-xs text-muted-foreground">
                  plots per hour ratio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getBudgetStatusColor(analytics?.costs.budget_status || 'on_track')}`} />
                  <span className="capitalize">{analytics?.costs.budget_status?.replace('_', ' ') || 'On Track'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics?.costs.variance_percentage || 0}% variance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Plot Completion</CardTitle>
                <CardDescription>Current project progress</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {chartData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Most efficient team members</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={efficiencyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workforce Metrics</CardTitle>
                <CardDescription>Team performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Active Workers</span>
                  <span className="font-semibold">{analytics?.workforce.active_workers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Hours</span>
                  <span className="font-semibold">{analytics?.workforce.total_hours || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Hours/Day</span>
                  <span className="font-semibold">{Math.round((analytics?.workforce.avg_hours_per_day || 0) * 100) / 100}</span>
                </div>
                <div className="flex justify-between">
                  <span>Productivity Score</span>
                  <span className="font-semibold">{analytics?.workforce.productivity_score || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Completion</CardTitle>
                <CardDescription>Progress tracking metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Plots</span>
                  <span className="font-semibold">{analytics?.completion.total_plots || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="font-semibold">{analytics?.completion.completed_plots || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completion Rate</span>
                  <span className="font-semibold">{analytics?.completion.completion_rate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Completion</span>
                  <span className="font-semibold">{analytics?.completion.avg_completion || 0}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Predictive Analytics
                </CardTitle>
                <CardDescription>AI-powered project forecasting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Current Completion</span>
                  <span className="font-semibold">{predictive?.current_completion || 0}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Predicted Completion</span>
                  <span className="font-semibold">
                    {predictive?.predicted_completion_date 
                      ? format(new Date(predictive.predicted_completion_date), 'MMM dd, yyyy')
                      : 'TBD'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Confidence Level</span>
                  <Badge 
                    variant="outline" 
                    className={getConfidenceLevelColor(predictive?.confidence_level || 'low')}
                  >
                    {predictive?.confidence_level || 'Low'}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Daily Progress Rate</span>
                  <span className="font-semibold">{predictive?.daily_progress_rate || 0} plots/day</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Factors
                </CardTitle>
                <CardDescription>Identified project risks</CardDescription>
              </CardHeader>
              <CardContent>
                {predictive?.risk_factors.length ? (
                  <div className="space-y-2">
                    {predictive.risk_factors.map((risk, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="capitalize">{risk.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>No significant risks detected</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resource Efficiency Summary</CardTitle>
                <CardDescription>Team performance over {efficiency?.period_days || 30} days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{efficiency?.summary.total_workers || 0}</div>
                    <p className="text-sm text-muted-foreground">Active Workers</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{efficiency?.summary.avg_efficiency || 0}</div>
                    <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {efficiency?.summary.efficiency_range.max || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Max Efficiency</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Most efficient team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {efficiency?.top_performers.map((performer, index) => (
                    <div key={performer.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{performer.name}</div>
                        <div className="text-sm text-muted-foreground">{performer.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{performer.efficiency} plots/hour</div>
                        <div className="text-sm text-muted-foreground">
                          {performer.plots_completed} plots, {performer.total_hours}h
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}