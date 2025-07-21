import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, BarChart3, Calendar, Filter, Plus } from 'lucide-react';

export function ReportsTab() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const reportTypes = [
    {
      id: 'compliance',
      title: 'Compliance Report',
      description: 'Document compliance status across all projects',
      lastGenerated: '2024-01-15T10:30:00Z',
      status: 'Ready',
      icon: FileText,
    },
    {
      id: 'rfi-summary',
      title: 'RFI Summary Report',
      description: 'Analysis of RFI submissions and response times',
      lastGenerated: '2024-01-14T16:45:00Z',
      status: 'Ready',
      icon: BarChart3,
    },
    {
      id: 'document-register',
      title: 'Document Register Export',
      description: 'Complete listing of all project documents',
      lastGenerated: '2024-01-13T09:20:00Z',
      status: 'Ready',
      icon: FileText,
    },
    {
      id: 'expiry-report',
      title: 'Document Expiry Report',
      description: 'Documents expiring within specified timeframe',
      lastGenerated: '2024-01-12T14:15:00Z',
      status: 'Generating',
      icon: Calendar,
    },
    {
      id: 'fieldwire-sync',
      title: 'Fieldwire Sync Status',
      description: 'Status of document synchronization with Fieldwire',
      lastGenerated: '2024-01-15T08:00:00Z',
      status: 'Ready',
      icon: BarChart3,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Generating': return 'bg-yellow-100 text-yellow-800';
      case 'Error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateReport = (reportId: string) => {
    console.log('Generating report:', reportId, 'for period:', selectedPeriod);
    // This would trigger the actual report generation
  };

  const handleDownloadReport = (reportId: string) => {
    console.log('Downloading report:', reportId);
    // This would trigger the actual download
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>
            Generate and download compliance and document management reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <label htmlFor="period" className="text-sm font-medium">
                Reporting Period:
              </label>
              <select
                id="period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate All Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Reports */}
      <div className="grid gap-4">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{report.title}</h3>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {report.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last generated: {new Date(report.lastGenerated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.status === 'Ready' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadReport(report.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    <Button 
                      size="sm"
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={report.status === 'Generating'}
                    >
                      {report.status === 'Generating' ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Templates</CardTitle>
          <CardDescription>
            Create and manage custom report configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Custom Templates</h3>
            <p className="text-muted-foreground mb-4">
              Create custom report templates tailored to your specific needs
            </p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>
            Automatically generated reports sent to stakeholders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Weekly Compliance Summary</h4>
                <p className="text-sm text-muted-foreground">
                  Sent every Monday at 9:00 AM to project managers
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Monthly Document Register</h4>
                <p className="text-sm text-muted-foreground">
                  Sent on the 1st of every month to stakeholders
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4">
            <Calendar className="h-4 w-4 mr-2" />
            Manage Scheduled Reports
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}