import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Truck, 
  Camera,
  Sparkles,
  Brain,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AIInsight {
  id: string;
  type: 'suggestion' | 'alert' | 'trend' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: 'hire' | 'pod' | 'compliance' | 'efficiency';
  actionable: boolean;
  timestamp: Date;
}

export const AIInsightsDashboard = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    // Mock AI insights - in production, these would come from AI analysis
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Optimize Equipment Hire Schedule',
        description: 'AI detected 23% cost savings possible by adjusting hire timing based on weather patterns',
        confidence: 87,
        impact: 'high',
        category: 'hire',
        actionable: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: '2',
        type: 'alert',
        title: 'POD Processing Anomaly',
        description: '3 consecutive PODs had OCR confidence below 85% - manual review recommended',
        confidence: 94,
        impact: 'medium',
        category: 'pod',
        actionable: true,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: '3',
        type: 'trend',
        title: 'Equipment Usage Pattern',
        description: 'Excavator usage peaked 40% above average on Tuesdays over last month',
        confidence: 92,
        impact: 'medium',
        category: 'hire',
        actionable: false,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: '4',
        type: 'suggestion',
        title: 'Compliance Reminder Automation',
        description: 'Enable auto-reminders for CSCS renewals to reduce expiration incidents by ~60%',
        confidence: 78,
        impact: 'high',
        category: 'compliance',
        actionable: true,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
      }
    ];

    setInsights(mockInsights);
  }, [selectedPeriod]);

  // Chart data
  const hireActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Hire Requests',
        data: [12, 19, 15, 8, 14, 6, 9],
        borderColor: 'hsl(var(--accent))',
        backgroundColor: 'hsla(var(--accent), 0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: 'hsl(var(--aj-yellow))',
        pointBorderColor: 'hsl(var(--accent))',
      }
    ]
  };

  const podAccuracyData = {
    labels: ['Excellent (95%+)', 'Good (85-94%)', 'Needs Review (<85%)'],
    datasets: [
      {
        data: [78, 18, 4],
        backgroundColor: [
          'hsl(var(--success))',
          'hsl(var(--aj-yellow))',
          'hsl(var(--destructive))',
        ],
        borderWidth: 0,
      }
    ]
  };

  const efficiencyData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Time Saved (hrs)',
        data: [5.2, 7.8, 12.3, 15.6],
        backgroundColor: 'hsl(var(--accent))',
        borderRadius: 4,
      }
    ]
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'alert': return AlertTriangle;
      case 'trend': return BarChart3;
      case 'suggestion': return Brain;
      default: return Sparkles;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-success';
      case 'alert': return 'text-destructive';
      case 'trend': return 'text-accent';
      case 'suggestion': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge className="bg-destructive/10 text-destructive">High Impact</Badge>;
      case 'medium': return <Badge variant="secondary">Medium Impact</Badge>;
      case 'low': return <Badge variant="outline">Low Impact</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-ai rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Insights Dashboard</h2>
            <p className="text-muted-foreground">
              Smart analysis and recommendations for your operations
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Accuracy</p>
                <p className="text-2xl font-bold">94.2%</p>
              </div>
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-xs text-success">+2.3% this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-2xl font-bold">15.6h</p>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-xs text-success">+26% from automation</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
              <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-warning" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">
                {insights.filter(i => i.actionable).length} actionable
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold">£2.3k</p>
              </div>
              <div className="w-10 h-10 bg-aj-yellow/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-aj-yellow" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-success">This month from AI suggestions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hire Activity Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-accent" />
              Hire Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <Line 
                data={hireActivityData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* POD OCR Accuracy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-accent" />
              POD OCR Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <Doughnut 
                data={podAccuracyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      position: 'bottom' as const,
                      labels: { 
                        font: { size: 12 }
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Latest AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              const colorClass = getInsightColor(insight.type);
              
              return (
                <div 
                  key={insight.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className={`mt-1 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      {getImpactBadge(insight.impact)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">
                        Confidence: {insight.confidence}%
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(insight.timestamp).toLocaleTimeString()}
                      </span>
                      {insight.actionable && (
                        <Badge variant="outline" className="text-xs">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>
                  {insight.actionable && (
                    <Button variant="outline" size="sm">
                      Act on This
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};