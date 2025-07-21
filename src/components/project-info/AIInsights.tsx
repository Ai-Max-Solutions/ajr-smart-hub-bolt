import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  FileText,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Zap,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AIInsight {
  id: string;
  type: 'warning' | 'suggestion' | 'prediction' | 'compliance';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  metadata?: Record<string, any>;
}

interface AIInsightsProps {
  projectId: string;
  className?: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ 
  projectId, 
  className 
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    generateInsights();
  }, [projectId]);

  const generateInsights = async () => {
    try {
      setLoading(true);
      
      // Mock document data for now - will be replaced with actual DB integration
      const documents = [
        { id: '1', document_type: 'PDF', folder: 'RAMS', expiry_date: '2024-12-31', created_at: '2024-01-01' },
        { id: '2', document_type: 'Drawing', folder: 'Drawings', expiry_date: null, created_at: '2024-01-15' }
      ];

      const generatedInsights: AIInsight[] = [];

      // Check for expiring documents
      const expiringDocs = documents?.filter(doc => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        const monthFromNow = new Date();
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        return expiryDate < monthFromNow;
      });

      if (expiringDocs && expiringDocs.length > 0) {
        generatedInsights.push({
          id: 'expiry-warning',
          type: 'warning',
          title: 'Documents Expiring Soon',
          description: `${expiringDocs.length} document(s) will expire within the next month. Consider updating them to maintain compliance.`,
          priority: 'high',
          actionable: true,
          metadata: { documentCount: expiringDocs.length }
        });
      }

      // Check for missing RAMS documents
      const ramsCount = documents?.filter(doc => 
        doc.document_type === 'RAMS' || doc.folder === 'RAMS'
      ).length || 0;

      if (ramsCount === 0) {
        generatedInsights.push({
          id: 'missing-rams',
          type: 'warning',
          title: 'No RAMS Documents Found',
          description: 'Risk Assessment and Method Statements are critical for project safety. Consider uploading required RAMS documents.',
          priority: 'high',
          actionable: true
        });
      }

      // Suggest document organization
      const uncategorizedDocs = documents?.filter(doc => !doc.folder || doc.folder === 'General').length || 0;
      
      if (uncategorizedDocs > 5) {
        generatedInsights.push({
          id: 'organization-suggestion',
          type: 'suggestion',
          title: 'Improve Document Organization',
          description: `${uncategorizedDocs} documents are uncategorized. Use AI auto-categorization to improve organization and searchability.`,
          priority: 'medium',
          actionable: true,
          metadata: { uncategorizedCount: uncategorizedDocs }
        });
      }

      // Predict upload patterns
      const recentUploads = documents?.filter(doc => {
        const uploadDate = new Date(doc.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return uploadDate > weekAgo;
      }).length || 0;

      if (recentUploads > 10) {
        generatedInsights.push({
          id: 'high-activity',
          type: 'prediction',
          title: 'High Document Activity Detected',
          description: 'Increased document uploads suggest an active project phase. Consider setting up automated compliance checks.',
          priority: 'medium',
          actionable: true,
          metadata: { weeklyUploads: recentUploads }
        });
      }

      // Compliance insights
      const totalDocs = documents?.length || 0;
      if (totalDocs > 0) {
        generatedInsights.push({
          id: 'compliance-status',
          type: 'compliance',
          title: 'Project Compliance Status',
          description: `${totalDocs} documents uploaded. Compliance score: ${Math.min(95, 70 + totalDocs * 2)}%. Consider adding testing certificates and handover documentation.`,
          priority: 'medium',
          actionable: false,
          metadata: { complianceScore: Math.min(95, 70 + totalDocs * 2) }
        });
      }

      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'suggestion': return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'prediction': return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case 'compliance': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  const refreshInsights = async () => {
    setGeneratingInsights(true);
    await generateInsights();
    setGeneratingInsights(false);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshInsights}
            disabled={generatingInsights}
          >
            <Zap className="h-4 w-4 mr-2" />
            {generatingInsights ? 'Analyzing...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              No specific insights available yet. Upload more documents to get AI-powered recommendations.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      {insight.actionable && (
                        <Badge variant="outline" className="text-xs">
                          Actionable
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                </div>
                
                {insight.actionable && (
                  <div className="flex gap-2 ml-8">
                    <Button size="sm" variant="outline">
                      Take Action
                    </Button>
                    <Button size="sm" variant="ghost">
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};