import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Download,
  Upload,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  recentUploads: number;
  expiringDocuments: number;
  mostAccessedDocs: Array<{
    name: string;
    views: number;
    folder: string;
  }>;
  folderStats: Array<{
    folder: string;
    count: number;
    percentage: number;
  }>;
  uploadTrend: Array<{
    date: string;
    count: number;
  }>;
}

interface DocumentAnalyticsProps {
  projectId: string;
  className?: string;
}

export const DocumentAnalytics: React.FC<DocumentAnalyticsProps> = ({ 
  projectId, 
  className 
}) => {
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock document data for now - will be replaced with actual DB integration
      const documents = [
        { id: '1', folder: 'RAMS', expiry_date: '2024-12-31', created_at: '2024-01-01' },
        { id: '2', folder: 'Drawings', expiry_date: null, created_at: '2024-01-15' },
        { id: '3', folder: 'Health & Safety', expiry_date: '2024-06-30', created_at: '2024-02-01' }
      ];

      // Calculate statistics
      const totalDocuments = documents?.length || 0;
      const recentUploads = documents?.filter(doc => {
        const uploadDate = new Date(doc.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return uploadDate > weekAgo;
      }).length || 0;

      const expiringDocuments = documents?.filter(doc => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        const monthFromNow = new Date();
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        return expiryDate < monthFromNow;
      }).length || 0;

      // Folder statistics
      const folderCounts: Record<string, number> = {};
      documents?.forEach(doc => {
        const folder = doc.folder || 'Uncategorized';
        folderCounts[folder] = (folderCounts[folder] || 0) + 1;
      });

      const folderStats = Object.entries(folderCounts).map(([folder, count]) => ({
        folder,
        count,
        percentage: (count / totalDocuments) * 100
      })).sort((a, b) => b.count - a.count);

      // Mock additional data for demo
      const mostAccessedDocs = [
        { name: 'RAMS Document v2.pdf', views: 45, folder: 'RAMS' },
        { name: 'Site Layout Drawing.dwg', views: 32, folder: 'Drawings' },
        { name: 'Safety Inspection Report.pdf', views: 28, folder: 'Health & Safety' }
      ];

      const uploadTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 5) + 1
        };
      }).reverse();

      setStats({
        totalDocuments,
        totalSize: totalDocuments * 2.5, // Mock size calculation
        recentUploads,
        expiringDocuments,
        mostAccessedDocs,
        folderStats,
        uploadTrend
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Document Analytics
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

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Upload className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.recentUploads}</p>
                <p className="text-sm text-muted-foreground">Recent Uploads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.expiringDocuments}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSize.toFixed(1)}MB</p>
                <p className="text-sm text-muted-foreground">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Folder Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Folder Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.folderStats.slice(0, 5).map((folder, index) => (
                <div key={folder.folder} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{folder.folder}</span>
                    <span className="text-muted-foreground">
                      {folder.count} ({folder.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={folder.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Accessed Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Most Accessed Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.mostAccessedDocs.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {doc.folder}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {doc.views} views
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};