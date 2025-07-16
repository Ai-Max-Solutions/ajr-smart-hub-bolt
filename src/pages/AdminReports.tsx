import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ReportBuilder } from '@/components/analytics/ReportBuilder';
import { cn } from '@/lib/utils';

interface ReportFilter {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  reportType: string;
  department: string;
  project: string;
}

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: { start: null, end: null },
    reportType: 'all',
    department: 'all',
    project: 'all'
  });

  const { data, loading, exportData } = useAnalytics('30');

  const reportTypes = [
    { value: 'all', label: 'All Reports' },
    { value: 'timesheet', label: 'Timesheet Reports' },
    { value: 'project', label: 'Project Reports' },
    { value: 'user', label: 'User Reports' },
    { value: 'performance', label: 'Performance Reports' }
  ];

  const departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'construction', label: 'Construction' },
    { value: 'management', label: 'Management' },
    { value: 'admin', label: 'Administration' }
  ];

  const handleExport = (type: string) => {
    exportData(type);
  };

  const generateReport = () => {
    console.log('Generating report with filters:', filters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Admin Reports</h1>
          <p className="text-muted-foreground">Generate and manage system reports</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
          className="flex-1"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'builder' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('builder')}
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-2" />
          Report Builder
        </Button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Report Filters</CardTitle>
              <CardDescription>Configure filters for your reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !filters.dateRange.start && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.start ? format(filters.dateRange.start, "PPP") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.start}
                          onSelect={(date) => setFilters(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, start: date }
                          }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !filters.dateRange.end && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.end ? format(filters.dateRange.end, "PPP") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.end}
                          onSelect={(date) => setFilters(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, end: date }
                          }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Report Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select
                    value={filters.reportType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={filters.department}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">&nbsp;</label>
                  <Button onClick={generateReport} className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.userPerformance.length}</div>
                <p className="text-xs text-muted-foreground">Active employees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.projectProgress.length}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.workingHours.reduce((sum, day) => sum + day.hours, 0)}
                </div>
                <p className="text-xs text-muted-foreground">This period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">+2% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>Download reports in various formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleExport('userPerformance')}
                  className="flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  User Performance
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('projectProgress')}
                  className="flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Project Progress
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('workingHours')}
                  className="flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Working Hours
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'builder' && (
        <ReportBuilder />
      )}
    </div>
  );
};

export default AdminReports;
