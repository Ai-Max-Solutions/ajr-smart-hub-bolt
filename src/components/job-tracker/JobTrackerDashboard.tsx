import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Clock, DollarSign, CheckCircle, AlertTriangle, User, Wrench } from 'lucide-react';
import { JobSubmissionForm } from './JobSubmissionForm';
import { JobApprovalQueue } from './JobApprovalQueue';
import { JobReportsExporter } from './JobReportsExporter';
import { WorkCategoryManager } from './WorkCategoryManager';
import { useToast } from '@/hooks/use-toast';

interface JobTrackerStats {
  totalJobs: number;
  pendingApproval: number;
  approvedJobs: number;
  totalValue: number;
  averageHours: number;
  duplicateFlags: number;
}

interface JobAssignment {
  id: string;
  project_id: string;
  plot_id: string;
  job_type_id: string;
  project_name: string;
  plot_number: string;
  job_type_name: string;
  work_category_name: string;
  status: string;
  pricing_model: string;
  default_unit_price: number;
  unit_type: string;
}

export const JobTrackerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<JobTrackerStats>({
    totalJobs: 0,
    pendingApproval: 0,
    approvedJobs: 0,
    totalValue: 0,
    averageHours: 0,
    duplicateFlags: 0
  });
  const [jobAssignments, setJobAssignments] = useState<JobAssignment[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role && ['Admin', 'Document Controller', 'Project Manager', 'Director'].includes(user.role);
  const isOperative = user?.role === 'Operative';

  useEffect(() => {
    fetchProjects();
    fetchJobAssignments();
    fetchStats();
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('id, name, code, client')
        .order('name');

      if (error) throw error;
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchJobAssignments = async () => {
    if (!user?.id) return;
    
    try {
      // Get user's name from users table
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!userData?.name) return;

      // Mock job assignments data
      const data = [
        {
          id: '1',
          project_id: 'proj-1',
          plot_id: 'plot-1',
          job_type_id: 'job-1',
          Projects: { projectname: 'Sample Project' },
          Plots: { plotnumber: 'Plot 001' },
          job_types: {
            name: 'Installation Work',
            pricing_model: 'day_rate',
            default_unit_price: 250,
            default_unit_type: 'day',
            work_categories: { name: 'Installation' }
          },
          plot_job_status: [{ status: 'available' }]
        }
      ];
      const error = null;

      if (error) throw error;

      const assignments = data?.map(assignment => ({
        id: assignment.id,
        project_id: assignment.project_id,
        plot_id: assignment.plot_id,
        job_type_id: assignment.job_type_id,
        project_name: assignment.Projects?.projectname || 'Unknown Project',
        plot_number: assignment.Plots?.plotnumber || 'Unknown Plot',
        job_type_name: assignment.job_types?.name || 'Unknown Job',
        work_category_name: assignment.job_types?.work_categories?.name || 'Unknown Category',
        status: Array.isArray(assignment.plot_job_status) ? assignment.plot_job_status[0]?.status || 'available' : 'available',
        pricing_model: assignment.job_types?.pricing_model || 'day_rate',
        default_unit_price: assignment.job_types?.default_unit_price || 0,
        unit_type: assignment.job_types?.default_unit_type || 'job'
      })) || [];

      setJobAssignments(assignments);
    } catch (error) {
      console.error('Error fetching job assignments:', error);
    }
  };

  const fetchStats = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Get user's name from users table
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!userData?.name) return;
      
      // Mock job tracker stats data
      const jobData = [
        { status: 'pending', calculated_total: 250, override_total: null, hours_worked: 8 },
        { status: 'approved', calculated_total: 300, override_total: 320, hours_worked: 8.5 }
      ];
      
      // Mock duplicate flags data
      const duplicateData = [];

      const totalJobs = jobData?.length || 0;
      const pendingApproval = jobData?.filter(job => job.status === 'pending').length || 0;
      const approvedJobs = jobData?.filter(job => job.status === 'approved').length || 0;
      const totalValue = jobData?.reduce((sum, job) => 
        sum + (job.override_total || job.calculated_total || 0), 0
      ) || 0;
      const totalHours = jobData?.reduce((sum, job) => sum + (job.hours_worked || 0), 0) || 0;
      const averageHours = totalJobs > 0 ? totalHours / totalJobs : 0;
      const duplicateFlags = duplicateData?.length || 0;

      setStats({
        totalJobs,
        pendingApproval,
        approvedJobs,
        totalValue,
        averageHours,
        duplicateFlags
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success/10 text-success border-success';
      case 'claimed': return 'bg-warning/10 text-warning border-warning';
      case 'in_progress': return 'bg-info/10 text-info border-info';
      case 'pending_approval': return 'bg-warning/10 text-warning border-warning';
      case 'approved': return 'bg-success/10 text-success border-success';
      case 'locked': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Wrench className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending_approval': return <Clock className="h-4 w-4" />;
      case 'locked': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Wrench className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Job Tracker</h1>
        </div>
        <p className="text-muted-foreground">
          Track work progress, pricing, and compliance across all projects
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Jobs</p>
              <p className="text-lg font-semibold">{stats.totalJobs}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold">{stats.pendingApproval}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-lg font-semibold">{stats.approvedJobs}</p>
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
              <p className="text-lg font-semibold">£{stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <User className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Hours</p>
              <p className="text-lg font-semibold">{stats.averageHours.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        {stats.duplicateFlags > 0 && (
          <Card className="p-4 border-warning">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duplicates</p>
                <p className="text-lg font-semibold text-warning">{stats.duplicateFlags}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Project Filter */}
      <div className="mb-6">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Filter by project..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 max-w-2xl">
          <TabsTrigger value="overview">My Jobs</TabsTrigger>
          <TabsTrigger value="submit">Submit Work</TabsTrigger>
          {isAdmin && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
          {isAdmin && <TabsTrigger value="manage">Manage</TabsTrigger>}
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {jobAssignments
              .filter(assignment => !selectedProject || assignment.project_id === selectedProject)
              .map(assignment => (
                <Card key={assignment.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{assignment.job_type_name}</h3>
                        <Badge variant="outline" className={getStatusColor(assignment.status)}>
                          {getStatusIcon(assignment.status)}
                          {assignment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Project:</strong> {assignment.project_name}</p>
                        <p><strong>Plot:</strong> {assignment.plot_number}</p>
                        <p><strong>Category:</strong> {assignment.work_category_name}</p>
                        <p><strong>Pricing:</strong> {assignment.pricing_model === 'day_rate' ? 'Day Rate' : 
                          `£${assignment.default_unit_price}/${assignment.unit_type}`}</p>
                      </div>
                    </div>
                    
                    {assignment.status === 'available' && (
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab('submit')}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Start Work
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            
            {jobAssignments.length === 0 && (
              <Card className="p-8 text-center">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Job Assignments</h3>
                <p className="text-muted-foreground">
                  You haven't been assigned any jobs yet. Contact your project manager for assignments.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="submit">
          <JobSubmissionForm 
            jobAssignments={jobAssignments}
            onJobSubmitted={() => {
              fetchJobAssignments();
              fetchStats();
              toast({
                title: "Work Submitted",
                description: "Your work has been submitted for approval",
              });
            }}
          />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="approvals">
            <JobApprovalQueue 
              selectedProject={selectedProject}
              onJobApproved={() => {
                fetchStats();
                toast({
                  title: "Job Approved",
                  description: "Work has been approved and plot status updated",
                });
              }}
            />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="manage">
            <WorkCategoryManager />
          </TabsContent>
        )}

        <TabsContent value="reports">
          <JobReportsExporter selectedProject={selectedProject} />
        </TabsContent>
      </Tabs>
    </div>
  );
};