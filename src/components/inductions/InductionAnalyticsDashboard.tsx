import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Globe,
  Accessibility,
  BarChart3,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalInductions: number;
  completedInductions: number;
  avgCompletionTime: number;
  completionRate: number;
  languageDistribution: { language: string; count: number; percentage: number }[];
  accessibilityUsage: { feature: string; usage_count: number }[];
  completionTrends: { date: string; completions: number; starts: number }[];
  quizPerformance: { score_range: string; count: number }[];
  retryPatterns: { step: string; retry_count: number }[];
}

const InductionAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const { toast } = useToast();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Get basic induction summary
      const { data: summary, error: summaryError } = await supabase
        .rpc('get_induction_analytics_summary');

      if (summaryError) throw summaryError;

      // Get detailed analytics
      const [
        languageData,
        accessibilityData,
        trendsData,
        quizData,
        retryData
      ] = await Promise.all([
        getLanguageDistribution(),
        getAccessibilityUsage(),
        getCompletionTrends(),
        getQuizPerformance(),
        getRetryPatterns()
      ]);

      setAnalyticsData({
        totalInductions: summary[0]?.total_inductions || 0,
        completedInductions: summary[0]?.completed_inductions || 0,
        avgCompletionTime: summary[0]?.avg_completion_time_minutes || 0,
        completionRate: summary[0]?.completion_rate_percentage || 0,
        languageDistribution: languageData,
        accessibilityUsage: accessibilityData,
        completionTrends: trendsData,
        quizPerformance: quizData,
        retryPatterns: retryData
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageDistribution = async () => {
    const { data, error } = await supabase
      .from('induction_progress')
      .select('language_preference')
      .not('language_preference', 'is', null);

    if (error) throw error;

    const languageCounts = data.reduce((acc, item) => {
      const lang = item.language_preference || 'en';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(languageCounts).reduce((sum, count) => sum + count, 0);

    return Object.entries(languageCounts).map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  };

  const getAccessibilityUsage = async () => {
    const { data, error } = await supabase
      .from('learning_analytics')
      .select('metric_data')
      .eq('metric_type', 'accessibility_used');

    if (error) throw error;

    const featureCounts = data.reduce((acc, item) => {
      const features = item.metric_data?.features || [];
      features.forEach((feature: string) => {
        acc[feature] = (acc[feature] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(featureCounts).map(([feature, usage_count]) => ({
      feature,
      usage_count
    }));
  };

  const getCompletionTrends = async () => {
    const { data, error } = await supabase
      .from('induction_progress')
      .select('created_at, completed_at, status')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Group by date
    const dailyData = data.reduce((acc, item) => {
      const startDate = new Date(item.created_at).toDateString();
      if (!acc[startDate]) {
        acc[startDate] = { starts: 0, completions: 0 };
      }
      acc[startDate].starts++;
      
      if (item.status === 'completed' && item.completed_at) {
        const completeDate = new Date(item.completed_at).toDateString();
        if (!acc[completeDate]) {
          acc[completeDate] = { starts: 0, completions: 0 };
        }
        acc[completeDate].completions++;
      }
      return acc;
    }, {} as Record<string, { starts: number; completions: number }>);

    return Object.entries(dailyData).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString(),
      starts: data.starts,
      completions: data.completions
    })).slice(-14); // Last 14 days
  };

  const getQuizPerformance = async () => {
    const { data, error } = await supabase
      .from('post_demo_quiz')
      .select('score_percentage');

    if (error) throw error;

    const scoreRanges = [
      { range: '90-100%', min: 90, max: 100 },
      { range: '75-89%', min: 75, max: 89 },
      { range: '60-74%', min: 60, max: 74 },
      { range: '0-59%', min: 0, max: 59 }
    ];

    return scoreRanges.map(range => ({
      score_range: range.range,
      count: data.filter(item => 
        item.score_percentage >= range.min && item.score_percentage <= range.max
      ).length
    }));
  };

  const getRetryPatterns = async () => {
    const { data, error } = await supabase
      .from('learning_analytics')
      .select('metric_data')
      .eq('metric_type', 'retry_pattern');

    if (error) throw error;

    const stepRetries = data.reduce((acc, item) => {
      const step = item.metric_data?.step || 'unknown';
      acc[step] = (acc[step] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stepRetries).map(([step, retry_count]) => ({
      step,
      retry_count
    }));
  };

  const exportAnalytics = async () => {
    try {
      const csvData = [
        ['Metric', 'Value'],
        ['Total Inductions', analyticsData?.totalInductions || 0],
        ['Completed Inductions', analyticsData?.completedInductions || 0],
        ['Completion Rate', `${analyticsData?.completionRate || 0}%`],
        ['Average Completion Time', `${analyticsData?.avgCompletionTime || 0} minutes`],
        ['', ''],
        ['Language Distribution', ''],
        ...analyticsData?.languageDistribution.map(lang => [lang.language, `${lang.count} (${lang.percentage}%)`]) || [],
        ['', ''],
        ['Quiz Performance', ''],
        ...analyticsData?.quizPerformance.map(quiz => [quiz.score_range, quiz.count]) || []
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `induction-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Analytics data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-12 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Induction Analytics</h1>
          <p className="text-muted-foreground">QR Scan Demo Training Performance</p>
        </div>
        <Button onClick={exportAnalytics} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inductions</p>
                <p className="text-3xl font-bold text-primary">{analyticsData.totalInductions}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600">{analyticsData.completionRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Completion Time</p>
                <p className="text-3xl font-bold text-blue-600">{Math.round(analyticsData.avgCompletionTime)}m</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Math.round(((analyticsData.quizPerformance.find(q => q.score_range === '75-89%')?.count || 0) + 
                              (analyticsData.quizPerformance.find(q => q.score_range === '90-100%')?.count || 0)) / 
                             analyticsData.totalInductions * 100)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quiz Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Quiz Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.quizPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="score_range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Retry Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Most Challenging Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.retryPatterns.map((pattern, index) => (
                    <div key={pattern.step} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium capitalize">{pattern.step.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={(pattern.retry_count / Math.max(...analyticsData.retryPatterns.map(p => p.retry_count))) * 100} 
                          className="w-20" 
                        />
                        <span className="text-sm text-muted-foreground">{pattern.retry_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Language Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.languageDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ language, percentage }) => `${language.toUpperCase()} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.languageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Language Details */}
            <Card>
              <CardHeader>
                <CardTitle>Language Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.languageDistribution.map((lang, index) => (
                    <div key={lang.language} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="font-medium uppercase">{lang.language}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{lang.count} users</span>
                        <Badge variant="secondary">{lang.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Accessibility className="mr-2 h-5 w-5" />
                Accessibility Feature Usage
              </CardTitle>
            </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.accessibilityUsage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="feature" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="usage_count" fill="hsl(var(--accent))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion Trends (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.completionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="starts" 
                    stroke="hsl(var(--primary))" 
                    name="Inductions Started"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completions" 
                    stroke="hsl(var(--accent))" 
                    name="Inductions Completed"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InductionAnalyticsDashboard;