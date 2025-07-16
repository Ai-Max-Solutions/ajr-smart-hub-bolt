import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TimesheetData {
  id: string;
  week_commencing: string;
  status: string;
  project: {
    code: string;
    name: string;
    client: string;
  };
  entries: {
    id: string;
    hours: number;
    plot: {
      name: string;
      level: string;
    };
    work_category: {
      main_category: string;
      sub_task: string;
    };
    notes: string;
  }[];
}

interface ProjectData {
  id: string;
  code: string;
  name: string;
  client: string;
  start_date: string;
  end_date: string;
}

export const TimesheetDashboard = () => {
  const [timesheets, setTimesheets] = useState<TimesheetData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('code');

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Fetch timesheets with related data
      const { data: timesheetsData, error: timesheetsError } = await supabase
        .from('timesheets')
        .select(`
          *,
          projects!inner(code, name, client),
          timesheet_entries(
            id,
            hours,
            notes,
            plots!inner(name, level),
            work_categories!inner(main_category, sub_task)
          )
        `)
        .order('week_commencing', { ascending: false });

      if (timesheetsError) throw timesheetsError;

      const formattedTimesheets = timesheetsData?.map(ts => ({
        id: ts.id,
        week_commencing: ts.week_commencing,
        status: ts.status,
        project: ts.projects,
        entries: ts.timesheet_entries || []
      })) || [];

      setTimesheets(formattedTimesheets);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'Submitted':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
    }
  };

  const getTotalHours = (entries: any[]) => {
    return entries.reduce((sum, entry) => sum + parseFloat(entry.hours), 0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Timesheet Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Timesheet Dashboard</h2>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{project.code}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(project.start_date).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-medium">{project.name}</h4>
                <p className="text-sm text-muted-foreground">{project.client}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timesheets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Timesheets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timesheets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No timesheets found</p>
            ) : (
              timesheets.map((timesheet) => (
                <div key={timesheet.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">
                        Week of {new Date(timesheet.week_commencing).toLocaleDateString()}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {timesheet.project.code} - {timesheet.project.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {getTotalHours(timesheet.entries)} hours
                      </span>
                      {getStatusBadge(timesheet.status)}
                    </div>
                  </div>
                  
                  {timesheet.entries.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Entries:</h5>
                      {timesheet.entries.slice(0, 3).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                          <div>
                            <span className="font-medium">{entry.plot.name}</span>
                            <span className="text-muted-foreground ml-2">
                              {entry.work_category.main_category} - {entry.work_category.sub_task}
                            </span>
                          </div>
                          <span className="font-medium">{entry.hours}h</span>
                        </div>
                      ))}
                      {timesheet.entries.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{timesheet.entries.length - 3} more entries
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};