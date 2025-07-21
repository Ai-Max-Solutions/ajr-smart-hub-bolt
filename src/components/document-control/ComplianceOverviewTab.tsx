import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, AlertTriangle, Clock, FileText, TrendingUp } from 'lucide-react';

export function ComplianceOverviewTab() {
  // Mock compliance data
  const complianceData = {
    compliant: 85,
    nearExpiry: 12,
    expired: 3,
    totalDocuments: 100,
    pendingRfis: 7,
    complianceScore: 85,
  };

  const recentActivity = [
    {
      id: '1',
      type: 'document_uploaded',
      message: 'New RAMS document uploaded for Plot 5A',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'success',
    },
    {
      id: '2',
      type: 'document_expiring',
      message: 'Method Statement MS-001 expires in 5 days',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'warning',
    },
    {
      id: '3',
      type: 'rfi_submitted',
      message: 'RFI-123 submitted for clarification on Plot 3B',
      timestamp: '2024-01-15T08:45:00Z',
      status: 'info',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_uploaded': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'document_expiring': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'rfi_submitted': return <FileText className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-l-green-500';
      case 'warning': return 'border-l-yellow-500';
      case 'error': return 'border-l-red-500';
      case 'info': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Compliance RAG Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant Documents</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{complianceData.compliant}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((complianceData.compliant / complianceData.totalDocuments) * 100)}% of total documents
            </p>
            <Progress 
              value={(complianceData.compliant / complianceData.totalDocuments) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Near Expiry</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{complianceData.nearExpiry}</div>
            <p className="text-xs text-muted-foreground">
              Documents expiring within 30 days
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              View Details
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{complianceData.expired}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate action
            </p>
            <Button size="sm" variant="destructive" className="mt-2">
              Take Action
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Overall Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Compliance Score</CardTitle>
          <CardDescription>
            Project-wide document compliance rating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">{complianceData.complianceScore}%</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">+3% this week</span>
              </div>
            </div>
            <Badge 
              className={complianceData.complianceScore >= 90 ? 'bg-green-100 text-green-800' : 
                         complianceData.complianceScore >= 70 ? 'bg-yellow-100 text-yellow-800' : 
                         'bg-red-100 text-red-800'}
            >
              {complianceData.complianceScore >= 90 ? 'Excellent' : 
               complianceData.complianceScore >= 70 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
          <Progress value={complianceData.complianceScore} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0%</span>
            <span>Target: 95%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common document control tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-xs">Upload RAMS</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-xs">Review Expiring</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <CheckCircle className="h-6 w-6" />
              <span className="text-xs">Approve RFI</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-xs">Generate Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest document control actions and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex items-start gap-3 p-3 border-l-4 bg-muted/50 rounded-r ${getActivityColor(activity.status)}`}
              >
                <div className="mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Activity
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}