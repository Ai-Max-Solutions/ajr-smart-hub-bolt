import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, Calendar, Target, Percent
} from 'lucide-react';

interface CostData {
  category: string;
  planned: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

interface CostAnalyticsDashboardProps {
  projectId?: string;
}

export function CostAnalyticsDashboard({ projectId }: CostAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  // Sample data - in real implementation, this would come from the database
  const [costData] = useState<CostData[]>([
    { category: 'Labor', planned: 50000, actual: 52000, variance: 2000, variancePercentage: 4 },
    { category: 'Materials', planned: 30000, actual: 28500, variance: -1500, variancePercentage: -5 },
    { category: 'Equipment', planned: 20000, actual: 21500, variance: 1500, variancePercentage: 7.5 },
    { category: 'Subcontractors', planned: 15000, actual: 16000, variance: 1000, variancePercentage: 6.7 },
    { category: 'Other', planned: 5000, actual: 4800, variance: -200, variancePercentage: -4 }
  ]);

  const [trendData] = useState([
    { month: 'Jan', planned: 100000, actual: 98000 },
    { month: 'Feb', planned: 110000, actual: 115000 },
    { month: 'Mar', planned: 120000, actual: 118000 },
    { month: 'Apr', planned: 130000, actual: 135000 },
    { month: 'May', planned: 125000, actual: 122500 },
    { month: 'Jun', planned: 140000, actual: 145000 }
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const totalPlanned = costData.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = costData.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalActual - totalPlanned;
  const totalVariancePercentage = (totalVariance / totalPlanned) * 100;

  const getBudgetStatus = () => {
    if (Math.abs(totalVariancePercentage) <= 5) return { status: 'on_track', color: 'text-green-600', bg: 'bg-green-500' };
    if (Math.abs(totalVariancePercentage) <= 15) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-500' };
  };

  const budgetStatus = getBudgetStatus();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cost Analytics</h1>
          <p className="text-muted-foreground">
            Budget tracking and cost analysis
          </p>
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
            <SelectItem value="180">Last 6 months</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPlanned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Planned expenditure
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Spent</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalActual.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current expenditure
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            {totalVariance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalVariance >= 0 ? '+' : ''}${totalVariance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Budget variance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${budgetStatus.bg}`} />
              <span className={`font-semibold ${budgetStatus.color}`}>
                {Math.abs(totalVariancePercentage).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {budgetStatus.status === 'on_track' ? 'On track' : 
               budgetStatus.status === 'warning' ? 'Monitor closely' : 'Action required'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual</CardTitle>
                <CardDescription>Planned vs actual spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Bar dataKey="planned" fill="#3b82f6" name="Planned" />
                    <Bar dataKey="actual" fill="#10b981" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
                <CardDescription>Actual spending breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="actual"
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    >
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4">
            {costData.map((category, index) => (
              <Card key={category.category}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                    <Badge 
                      variant={category.variance >= 0 ? "destructive" : "default"}
                      className={category.variance >= 0 ? "" : "bg-green-500 hover:bg-green-600"}
                    >
                      {category.variance >= 0 ? '+' : ''}${category.variance.toLocaleString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Planned: ${category.planned.toLocaleString()}</span>
                      <span>Actual: ${category.actual.toLocaleString()}</span>
                    </div>
                    
                    <Progress 
                      value={(category.actual / category.planned) * 100} 
                      className="h-2"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Utilization: {((category.actual / category.planned) * 100).toFixed(1)}%
                      </span>
                      <span className={`text-sm font-medium ${
                        category.variancePercentage >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {category.variancePercentage >= 0 ? '+' : ''}{category.variancePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trends</CardTitle>
              <CardDescription>Budget vs actual spending over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Area 
                    type="monotone" 
                    dataKey="planned" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                    name="Planned"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stackId="2" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                    name="Actual"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Variance Analysis</CardTitle>
                <CardDescription>Budget variance by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Bar 
                      dataKey="variance" 
                      fill="#3b82f6"
                      name="Variance"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Budget performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {totalVariancePercentage <= 5 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : totalVariancePercentage <= 15 ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <div className="font-medium">
                      Overall Budget Status: {budgetStatus.status.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.abs(totalVariancePercentage).toFixed(1)}% variance from planned budget
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Categories Over Budget:</div>
                  {costData.filter(cat => cat.variance > 0).map(cat => (
                    <div key={cat.category} className="flex justify-between text-sm">
                      <span>{cat.category}</span>
                      <span className="text-red-600">+{cat.variancePercentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Categories Under Budget:</div>
                  {costData.filter(cat => cat.variance < 0).map(cat => (
                    <div key={cat.category} className="flex justify-between text-sm">
                      <span>{cat.category}</span>
                      <span className="text-green-600">{cat.variancePercentage.toFixed(1)}%</span>
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