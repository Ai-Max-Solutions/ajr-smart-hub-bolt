import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Eye, MessageSquare, Clock, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DocumentAnalyticsProps {
  projectId: string;
}

export function DocumentAnalytics({ projectId }: DocumentAnalyticsProps) {
  const [analytics, setAnalytics] = useState({
    documentStats: {
      totalDocuments: 0,
      totalQueries: 0,
      avgResponseTime: 0,
      uniqueUsers: 0
    },
    queryTrends: [],
    documentPopularity: [],
    userActivity: []
  });

  useEffect(() => {
    // Simulate analytics data - in real implementation, fetch from Supabase
    const mockData = {
      documentStats: {
        totalDocuments: 47,
        totalQueries: 523,
        avgResponseTime: 1.2,
        uniqueUsers: 12
      },
      queryTrends: [
        { date: '2024-01-15', queries: 23, responses: 21 },
        { date: '2024-01-16', queries: 31, responses: 29 },
        { date: '2024-01-17', queries: 28, responses: 26 },
        { date: '2024-01-18', queries: 42, responses: 38 },
        { date: '2024-01-19', queries: 35, responses: 33 },
        { date: '2024-01-20', queries: 38, responses: 36 },
        { date: '2024-01-21', queries: 45, responses: 42 }
      ],
      documentPopularity: [
        { name: 'Safety Protocols', views: 89, queries: 34 },
        { name: 'Electrical RAMS', views: 67, queries: 28 },
        { name: 'Site Plans', views: 45, queries: 19 },
        { name: 'Equipment Manual', views: 38, queries: 15 },
        { name: 'Quality Standards', views: 29, queries: 12 }
      ],
      userActivity: [
        { user: 'Site Manager', queries: 87, documents: 23 },
        { user: 'Safety Officer', queries: 65, documents: 18 },
        { user: 'Electrician', queries: 43, documents: 12 },
        { user: 'Engineer', queries: 38, documents: 15 },
        { user: 'Supervisor', queries: 29, documents: 9 }
      ]
    };
    
    setAnalytics(mockData);
  }, [projectId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{analytics.documentStats.totalDocuments}</p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.documentStats.totalQueries}</p>
                <p className="text-sm text-muted-foreground">Queries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.documentStats.avgResponseTime}s</p>
                <p className="text-sm text-muted-foreground">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.documentStats.uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Document Intelligence</span>
            <Badge variant="outline">AI Analytics</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="trends" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trends">Query Trends</TabsTrigger>
              <TabsTrigger value="popularity">Document Popularity</TabsTrigger>
              <TabsTrigger value="users">User Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trends" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.queryTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip labelFormatter={(label) => formatDate(label)} />
                    <Line type="monotone" dataKey="queries" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="responses" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#8884d8] rounded-full"></div>
                  <span>Total Queries</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#82ca9d] rounded-full"></div>
                  <span>Successful Responses</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="popularity" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.documentPopularity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8884d8" />
                    <Bar dataKey="queries" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Most Viewed Documents</h4>
                  {analytics.documentPopularity.slice(0, 3).map((doc, index) => (
                    <div key={doc.name} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{doc.name}</span>
                      <div className="flex items-center space-x-2">
                        <Eye className="h-3 w-3" />
                        <span className="text-sm font-medium">{doc.views}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Most Queried Documents</h4>
                  {analytics.documentPopularity
                    .sort((a, b) => b.queries - a.queries)
                    .slice(0, 3)
                    .map((doc, index) => (
                    <div key={doc.name} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{doc.name}</span>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-3 w-3" />
                        <span className="text-sm font-medium">{doc.queries}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.userActivity} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="user" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="queries" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">User Engagement Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.userActivity.map((user) => (
                    <div key={user.user} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{user.user}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.documents} documents accessed
                        </p>
                      </div>
                      <Badge variant="outline">
                        {user.queries} queries
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}