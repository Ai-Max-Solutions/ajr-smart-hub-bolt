import { useState, useEffect } from 'react';
import { Brain, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIInsightsProps {
  projectId: string;
}

interface Insight {
  id: string;
  type: 'summary' | 'risk' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  relatedDocuments: string[];
  actionable: boolean;
}

export function AIInsights({ projectId }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    generateInsights();
  }, [projectId]);

  const generateInsights = async () => {
    setIsGenerating(true);
    
    // Simulate AI insight generation
    setTimeout(() => {
      const mockInsights: Insight[] = [
        {
          id: '1',
          type: 'risk',
          title: 'Potential Safety Compliance Gap',
          description: 'Analysis of recent documents indicates potential gaps in electrical safety protocols. The current RAMS document version 3.1 may not fully address new equipment requirements mentioned in the latest technical specifications.',
          confidence: 87,
          priority: 'high',
          relatedDocuments: ['Electrical RAMS v3.1', 'Equipment Specifications 2024'],
          actionable: true
        },
        {
          id: '2',
          type: 'recommendation',
          title: 'Document Consolidation Opportunity',
          description: 'Multiple overlapping safety procedures found across 4 different documents. Consolidating these could reduce confusion and improve compliance rates by an estimated 23%.',
          confidence: 92,
          priority: 'medium',
          relatedDocuments: ['Site Safety Manual', 'Electrical Safety Guide', 'Emergency Procedures', 'PPE Guidelines'],
          actionable: true
        },
        {
          id: '3',
          type: 'summary',
          title: 'Project Documentation Health Score',
          description: 'Overall documentation completeness is at 94%. Recent uploads have improved coverage of quality control procedures. Missing: Updated fire safety protocols for new building sections.',
          confidence: 96,
          priority: 'medium',
          relatedDocuments: ['Quality Control Manual', 'Fire Safety Protocols'],
          actionable: false
        },
        {
          id: '4',
          type: 'trend',
          title: 'Increasing Focus on Environmental Compliance',
          description: 'Document analysis shows 340% increase in environmental compliance references over the past 3 months. This aligns with new regulations coming into effect Q2 2024.',
          confidence: 89,
          priority: 'low',
          relatedDocuments: ['Environmental Impact Assessment', 'Waste Management Plan', 'Sustainability Report'],
          actionable: false
        },
        {
          id: '5',
          type: 'recommendation',
          title: 'Training Material Updates Required',
          description: 'AI analysis detected outdated procedures in training materials that conflict with current site protocols. Updating these could prevent potential safety incidents.',
          confidence: 94,
          priority: 'high',
          relatedDocuments: ['Induction Training Manual', 'Site Safety Protocols v4.2'],
          actionable: true
        }
      ];
      
      setInsights(mockInsights);
      setLastUpdated(new Date());
      setIsGenerating(false);
    }, 2000);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'summary': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const filterInsightsByType = (type: string) => {
    return insights.filter(insight => insight.type === type);
  };

  if (isGenerating && insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI-Powered Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Analyzing project documents...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>AI-Powered Insights</span>
              <Badge variant="outline">Beta</Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {lastUpdated && (
                <span className="text-sm text-muted-foreground">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateInsights}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  'Refresh Insights'
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({insights.length})</TabsTrigger>
              <TabsTrigger value="risk">Risks ({filterInsightsByType('risk').length})</TabsTrigger>
              <TabsTrigger value="recommendation">Actions ({filterInsightsByType('recommendation').length})</TabsTrigger>
              <TabsTrigger value="summary">Summary ({filterInsightsByType('summary').length})</TabsTrigger>
              <TabsTrigger value="trend">Trends ({filterInsightsByType('trend').length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-4">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </TabsContent>
            
            <TabsContent value="risk" className="space-y-4 mt-4">
              {filterInsightsByType('risk').map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </TabsContent>
            
            <TabsContent value="recommendation" className="space-y-4 mt-4">
              {filterInsightsByType('recommendation').map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </TabsContent>
            
            <TabsContent value="summary" className="space-y-4 mt-4">
              {filterInsightsByType('summary').map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </TabsContent>
            
            <TabsContent value="trend" className="space-y-4 mt-4">
              {filterInsightsByType('trend').map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'summary': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Alert className="p-4">
      <div className="flex items-start space-x-3">
        {getInsightIcon(insight.type)}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{insight.title}</h4>
            <div className="flex items-center space-x-2">
              <Badge variant={getPriorityColor(insight.priority) as any}>
                {insight.priority}
              </Badge>
              {insight.actionable && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Actionable
                </Badge>
              )}
            </div>
          </div>
          
          <AlertDescription className="text-sm">
            {insight.description}
          </AlertDescription>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <Progress value={insight.confidence} className="w-20" />
              <span className="text-xs font-medium">{insight.confidence}%</span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {insight.relatedDocuments.length} related document{insight.relatedDocuments.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {insight.relatedDocuments.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {insight.relatedDocuments.slice(0, 3).map((doc) => (
                <Badge key={doc} variant="outline" className="text-xs">
                  {doc}
                </Badge>
              ))}
              {insight.relatedDocuments.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{insight.relatedDocuments.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}