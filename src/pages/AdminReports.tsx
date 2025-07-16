
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Users, Building2, FileText, TrendingUp } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';

interface ReportData {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalDrawings: number;
  recentActivity: any[];
  usersByRole: Array<{ role: string; count: number }>;
  projectsByStatus: Array<{ status: string; count: number }>;
}

export const AdminReports: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [reportType, setReportType] = useState('overview');

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['admin-reports', reportType, dateRange],
    queryFn: async () => {
      const startDate = dateRange?.from?.toISOString();
      const endDate = dateRange?.to?.toISOString();

      // Fetch user statistics
      const { data: users, error: usersError } = await supabase
        .from('Users')
        .select('id, role, employmentstatus, airtable_created_time');

      if (usersError) throw usersError;

      // Fetch project statistics
      const { data: projects, error: projectsError } = await supabase
        .from('Projects')
        .select('id, status, airtable_created_time');

      if (projectsError) throw projectsError;

      // Fetch drawing statistics
      const { data: drawings, error: drawingsError } = await supabase
        .from('Drawings')
        .select('id, drawingstatus, airtable_created_time');

      if (drawingsError) throw drawingsError;

      // Calculate statistics
      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.employmentstatus === 'Active').length || 0;
      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'Active').length || 0;
      const totalDrawings = drawings?.length || 0;

      // Group users by role
      const usersByRole = users?.reduce((acc: any[], user) => {
        const existingRole = acc.find(r => r.role === user.role);
        if (existingRole) {
          existingRole.count += 1;
        } else {
          acc.push({ role: user.role || 'Unknown', count: 1 });
        }
        return acc;
      }, []) || [];

      // Group projects by status
      const projectsByStatus = projects?.reduce((acc: any[], project) => {
        const existingStatus = acc.find(s => s.status === project.status);
        if (existingStatus) {
          existingStatus.count += 1;
        } else {
          acc.push({ status: project.status || 'Unknown', count: 1 });
        }
        return acc;
      }, []) || [];

      return {
        totalUsers,
        activeUsers,
        totalProjects,
        activeProjects,
        totalDrawings,
        recentActivity: [],
        usersByRole,
        projectsByStatus,
      } as ReportData;
    },
  });

  const exportReport = () => {
    // Implementation for exporting reports
    console.log('Exporting report...', { reportType, dateRange, reportData });
  };

  const COLORS = ['#ffcf21', '#1d1e3d', '#acb7d1', '#006198', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ajryan-yellow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ajryan-dark">Admin Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and reporting dashboard
          </p>
        </div>
        <Button onClick={exportReport} className="bg-ajryan-yellow hover:bg-ajryan-yellow/90 text-ajryan-dark">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="users">User Analytics</SelectItem>
            <SelectItem value="projects">Project Analytics</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
          </SelectContent>
        </Select>
        <DatePickerWithRange
          date={dateRange}
          onDateChange={setDateRange}
        />
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {reportData?.activeUsers || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              {reportData?.activeProjects || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drawings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.totalDrawings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Technical documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.totalUsers ? Math.round((reportData.activeUsers / reportData.totalUsers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              User activity rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>Distribution of users across different roles</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData?.usersByRole || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(reportData?.usersByRole || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
            <CardDescription>Current status distribution of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData?.projectsByStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ffcf21" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportData?.usersByRole?.map((role, index) => (
                <div key={role.role} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{role.role}</span>
                  <Badge variant="secondary">{role.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportData?.projectsByStatus?.map((status, index) => (
                <div key={status.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{status.status}</span>
                  <Badge variant="secondary">{status.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
