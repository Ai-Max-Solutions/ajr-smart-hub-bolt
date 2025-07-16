import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
// DateRangePicker component would be implemented separately
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, DollarSign, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobReportsExporterProps {
  selectedProject: string;
}

interface ReportStats {
  totalJobs: number;
  totalValue: number;
  averageRate: number;
  mostProductiveUser: string;
  completionRate: number;
}

export const JobReportsExporter: React.FC<JobReportsExporterProps> = ({
  selectedProject
}) => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>('summary');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [jobStatus, setJobStatus] = useState<string>('all');
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchReportStats();
  }, [selectedProject, dateRange, jobStatus]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('Projects')
        .select('id, projectname, projectnumber')
        .order('projectname');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchReportStats = async () => {
    try {
      let query = supabase
        .from('job_tracker')
        .select(`
          id,
          calculated_total,
          override_total,
          agreed_rate,
          status,
          work_date,
          Users!assigned_user_id(fullname)
        `);

      if (selectedProject) {
        query = query.eq('project_id', selectedProject);
      }

      if (jobStatus !== 'all') {
        query = query.eq('status', jobStatus);
      }

      if (dateRange?.from) {
        query = query.gte('work_date', dateRange.from.toISOString().split('T')[0]);
      }

      if (dateRange?.to) {
        query = query.lte('work_date', dateRange.to.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      if (data) {
        const totalJobs = data.length;
        const totalValue = data.reduce((sum, job) => 
          sum + (job.override_total || job.calculated_total || 0), 0
        );
        const averageRate = totalJobs > 0 ? 
          data.reduce((sum, job) => sum + job.agreed_rate, 0) / totalJobs : 0;
        
        // Find most productive user
        const userCounts = data.reduce((acc: Record<string, number>, job) => {
          const userName = job.Users?.fullname || 'Unknown';
          acc[userName] = (acc[userName] || 0) + 1;
          return acc;
        }, {});
        
        const mostProductiveUser = Object.entries(userCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

        const approvedJobs = data.filter(job => job.status === 'approved').length;
        const completionRate = totalJobs > 0 ? (approvedJobs / totalJobs) * 100 : 0;

        setReportStats({
          totalJobs,
          totalValue,
          averageRate,
          mostProductiveUser,
          completionRate
        });
      }
    } catch (error) {
      console.error('Error fetching report stats:', error);
    }
  };

  const generateCSVReport = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('job_tracker')
        .select(`
          work_date,
          work_description,
          quantity_completed,
          unit_type,
          agreed_rate,
          calculated_total,
          override_total,
          status,
          hours_worked,
          safety_checks_completed,
          Projects!project_id(projectname),
          Plots!plot_id(plotnumber),
          job_types!job_type_id(name, work_categories!work_category_id(name)),
          Users!assigned_user_id(fullname)
        `)
        .order('work_date', { ascending: false });

      if (selectedProject) {
        query = query.eq('project_id', selectedProject);
      }

      if (jobStatus !== 'all') {
        query = query.eq('status', jobStatus);
      }

      if (dateRange?.from) {
        query = query.gte('work_date', dateRange.from.toISOString().split('T')[0]);
      }

      if (dateRange?.to) {
        query = query.lte('work_date', dateRange.to.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No job records found for the selected criteria",
          variant: "destructive",
        });
        return;
      }

      // Generate CSV content
      const headers = [
        'Date',
        'Project',
        'Plot',
        'Category',
        'Job Type',
        'Worker',
        'Description',
        'Quantity',
        'Unit',
        'Rate',
        'Total',
        'Status',
        'Hours',
        'Safety Checks'
      ].join(',');

      const csvContent = [
        headers,
        ...data.map(job => [
          job.work_date,
          `"${job.Projects?.projectname || 'Unknown'}"`,
          job.Plots?.plotnumber || 'Unknown',
          `"${job.job_types?.work_categories?.name || 'Unknown'}"`,
          `"${job.job_types?.name || 'Unknown'}"`,
          `"${job.Users?.fullname || 'Unknown'}"`,
          `"${job.work_description.replace(/"/g, '""')}"`,
          job.quantity_completed,
          job.unit_type || '',
          job.agreed_rate,
          job.override_total || job.calculated_total,
          job.status,
          job.hours_worked || '',
          job.safety_checks_completed ? 'Yes' : 'No'
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const projectName = selectedProject 
        ? projects.find(p => p.id === selectedProject)?.projectname || 'Project'
        : 'AllProjects';
      
      const dateStr = dateRange?.from 
        ? `${dateRange.from.toISOString().split('T')[0]}_to_${dateRange.to?.toISOString().split('T')[0] || 'latest'}`
        : 'all_dates';
        
      link.setAttribute('download', `JobTracker_${projectName}_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Downloaded ${data.length} job records`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Job Tracker Reports</h2>
        <p className="text-muted-foreground">
          Generate comprehensive reports on work completion, pricing, and productivity
        </p>
      </div>

      {/* Report Stats */}
      {reportStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-lg font-semibold">{reportStats.totalJobs}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-lg font-semibold">£{reportStats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Rate</p>
                <p className="text-lg font-semibold">£{reportStats.averageRate.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Worker</p>
                <p className="text-sm font-semibold">{reportStats.mostProductiveUser}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-lg font-semibold">{reportStats.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Report Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Report Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Work Summary</SelectItem>
                  <SelectItem value="detailed">Detailed Jobs</SelectItem>
                  <SelectItem value="productivity">Productivity Analysis</SelectItem>
                  <SelectItem value="compliance">Compliance Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Status</label>
              <Select value={jobStatus} onValueChange={setJobStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              {/* DateRangePicker to be implemented */}
              <div className="p-2 border rounded text-sm text-muted-foreground">
                Date range picker coming soon
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              onClick={generateCSVReport}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Calendar className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>

            <Button variant="outline" disabled>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
              <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Templates */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Quick Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            className="justify-start h-auto p-4"
            onClick={() => {
              setReportType('summary');
              setJobStatus('all');
              setDateRange({
                from: new Date(new Date().setDate(new Date().getDate() - 7)),
                to: new Date()
              });
            }}
          >
            <div className="text-left">
              <p className="font-medium">Weekly Summary</p>
              <p className="text-xs text-muted-foreground">Last 7 days overview</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="justify-start h-auto p-4"
            onClick={() => {
              setReportType('detailed');
              setJobStatus('approved');
              setDateRange({
                from: new Date(new Date().setDate(new Date().getDate() - 30)),
                to: new Date()
              });
            }}
          >
            <div className="text-left">
              <p className="font-medium">Monthly Approved</p>
              <p className="text-xs text-muted-foreground">All approved work</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="justify-start h-auto p-4"
            onClick={() => {
              setReportType('compliance');
              setJobStatus('all');
              setDateRange(undefined);
            }}
          >
            <div className="text-left">
              <p className="font-medium">Safety Compliance</p>
              <p className="text-xs text-muted-foreground">Safety check status</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="justify-start h-auto p-4"
            onClick={() => {
              setReportType('productivity');
              setJobStatus('approved');
              setDateRange({
                from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
                to: new Date()
              });
            }}
          >
            <div className="text-left">
              <p className="font-medium">Quarterly Analysis</p>
              <p className="text-xs text-muted-foreground">3-month productivity</p>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
};