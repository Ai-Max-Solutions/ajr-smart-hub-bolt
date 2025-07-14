import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Plus,
  Download 
} from 'lucide-react';

interface TimesheetEntry {
  id: string;
  weekEnding: string;
  project: string;
  hoursWorked: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  totalEarnings?: number;
}

const MyTimesheets = () => {
  const [timesheets] = useState<TimesheetEntry[]>([
    {
      id: '1',
      weekEnding: '21 July 2025',
      project: 'Woodberry Down Phase 2',
      hoursWorked: 42,
      status: 'approved',
      submittedDate: '22 July 2025',
      approvedDate: '23 July 2025',
      approvedBy: 'Jane Doe',
      totalEarnings: 756.00
    },
    {
      id: '2',
      weekEnding: '14 July 2025',
      project: 'Woodberry Down Phase 2',
      hoursWorked: 38,
      status: 'approved',
      submittedDate: '15 July 2025',
      approvedDate: '16 July 2025',
      approvedBy: 'Jane Doe',
      totalEarnings: 684.00
    },
    {
      id: '3',
      weekEnding: '7 July 2025',
      project: 'Woodberry Down Phase 2',
      hoursWorked: 40,
      status: 'submitted',
      submittedDate: '8 July 2025'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Timesheets</h1>
            <p className="text-muted-foreground">
              Track your weekly hours and submit timesheets for approval
            </p>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            New Timesheet
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">0 hrs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Week</p>
                  <p className="text-2xl font-bold">42 hrs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Month Total</p>
                  <p className="text-2xl font-bold">160 hrs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timesheets List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Timesheets</CardTitle>
            <CardDescription>
              View and manage your submitted timesheets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timesheets.map((timesheet) => (
                <div key={timesheet.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(timesheet.status)}
                      <div>
                        <h4 className="font-semibold">Week ending {timesheet.weekEnding}</h4>
                        <p className="text-sm text-muted-foreground">{timesheet.project}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold">{timesheet.hoursWorked} hours</p>
                        {timesheet.totalEarnings && (
                          <p className="text-sm text-muted-foreground">
                            £{timesheet.totalEarnings.toFixed(2)}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(timesheet.status)}
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                  
                  {timesheet.status === 'approved' && timesheet.approvedBy && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Approved by {timesheet.approvedBy} on {timesheet.approvedDate}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Timesheets must be submitted by Tuesday 5pm for the previous week. 
              Contact your supervisor if you need assistance or have questions about your hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyTimesheets;