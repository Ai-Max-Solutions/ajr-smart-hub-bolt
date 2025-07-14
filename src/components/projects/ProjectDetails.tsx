import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { 
  Building2, 
  Users, 
  Calendar,
  MapPin,
  Edit,
  Plus,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  Upload,
  Download,
  Loader2
} from 'lucide-react';
import LevelsAndPlots from './LevelsAndPlots';
import TeamManagement from './TeamManagement';
import ComplianceTracking from './ComplianceTracking';
import ProjectDocuments from './ProjectDocuments';
import RAMSTable from './RAMSTable';
import WeeklyTimesheetApproval from './WeeklyTimesheetApproval';
import { PayrollExport } from './PayrollExport';
import TeamCompliance from '@/components/compliance/TeamCompliance';
import ComplianceMatrix from '@/components/compliance/ComplianceMatrix';
import TeamTraining from '@/components/training/TeamTraining';
import TrainingMatrix from '@/components/training/TrainingMatrix';
import BroadcastNotices from '@/components/notices/BroadcastNotices';
import NoticesComplianceLog from '@/components/notices/NoticesComplianceLog';
import ProjectInductions from '@/components/inductions/ProjectInductions';
import InductionBuilder from '@/components/inductions/InductionBuilder';
import SignatureVault from '@/components/signatures/SignatureVault';
import SignatureVaultExport from '@/components/signatures/SignatureVaultExport';
import RetentionSettings from '@/components/retention/RetentionSettings';
import DataArchiveLog from '@/components/retention/DataArchiveLog';
import OnHireTracker from '@/components/projects/OnHireTracker';
import PODRegister from './PODRegister';
import ProjectManagerDashboard from './ProjectManagerDashboard';

interface ProjectData {
  whalesync_postgres_id: string;
  projectname: string;
  clientname: string;
  siteaddress: string;
  status: string;
  startdate: string;
  plannedenddate: string;
  projectmanager: string;
  totalplots: number;
  budgetspent: number;
  projectvalue: number;
  activehireitems: number;
  healthsafetystatus: string;
  projectnotes: string;
}
const ProjectDetails = () => {
  const { projectId } = useParams();
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !profile) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Projects')
          .select(`
            whalesync_postgres_id,
            projectname,
            clientname,
            siteaddress,
            status,
            startdate,
            plannedenddate,
            projectmanager,
            totalplots,
            budgetspent,
            projectvalue,
            activehireitems,
            healthsafetystatus,
            projectnotes
          `)
          .eq('whalesync_postgres_id', projectId)
          .single();

        if (error) {
          setError(error.message);
        } else {
          setProject(data);
        }
      } catch (err) {
        setError('Failed to fetch project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-destructive">Error loading project</h3>
          <p className="text-muted-foreground">{error || 'Project not found'}</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'Planning':
        return <Badge variant="secondary">Planning</Badge>;
      case 'On Hold':
        return <Badge variant="secondary">On Hold</Badge>;
      case 'Completed':
        return <Badge className="bg-accent text-accent-foreground">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-primary">{project.projectname}</h1>
                {getStatusBadge(project.status)}
              </div>
              <p className="text-muted-foreground">{project.clientname}</p>
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                {project.siteaddress}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload Docs
              </Button>
              <Button className="btn-primary">
                <Edit className="w-4 h-4 mr-2" />
                Edit Project
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Summary Panel */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Project Summary</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{project.startdate ? new Date(project.startdate).toLocaleDateString() : 'TBD'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{project.plannedenddate ? new Date(project.plannedenddate).toLocaleDateString() : 'TBD'}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Client Name</p>
                <p className="font-medium">{project.clientname}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Project Manager</p>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{project.projectmanager?.split(' ').map(n => n[0]).join('') || 'PM'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.projectmanager}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Compliance Progress */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Compliance Progress</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                      CSCS Verified
                    </span>
                    <span className="font-medium">88% ✅</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-accent" />
                      RAMS Signed
                    </span>
                    <span className="font-medium">82% ✅</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-warning" />
                      Safety Docs Completed
                    </span>
                    <span className="font-medium">95% ✅</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">{project.activehireitems}</p>
            <p className="text-xs text-muted-foreground">Active Hire</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <Building2 className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-accent">{project.totalplots}</p>
            <p className="text-xs text-muted-foreground">Total Plots</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-success">£{(project.budgetspent / 1000).toFixed(0)}k</p>
            <p className="text-xs text-muted-foreground">Budget Spent</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <Shield className="w-8 h-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-warning">{project.healthsafetystatus}</p>
            <p className="text-xs text-muted-foreground">Safety Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-19">
          <TabsTrigger value="pm-dashboard">PM Dashboard</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="levels">Levels & Plots</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="on-hire">On-Hire Register</TabsTrigger>
          <TabsTrigger value="pods">POD Register</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Export</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="training">Team Training</TabsTrigger>
          <TabsTrigger value="notices">Site Notices</TabsTrigger>
          <TabsTrigger value="inductions">Inductions</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="signatures">Signatures</TabsTrigger>
          <TabsTrigger value="vault">Vault Export</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="archive">Archive</TabsTrigger>
          <TabsTrigger value="matrix">Matrix</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="pm-dashboard">
          <ProjectManagerDashboard projectId={project.whalesync_postgres_id} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Description */}
            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{project.projectnotes || 'No description available'}</p>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Project loaded from Supabase</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>System</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* RAMS & Task Plans Section in Overview */}
          <div className="mt-6">
            <RAMSTable projectId={project.whalesync_postgres_id} />
          </div>
        </TabsContent>

        <TabsContent value="levels">
          <LevelsAndPlots projectId={project.whalesync_postgres_id} levels={[]} />
        </TabsContent>

        <TabsContent value="team">
          <TeamManagement projectId={project.whalesync_postgres_id} />
        </TabsContent>

        <TabsContent value="timesheets">
          <WeeklyTimesheetApproval projectId={project.whalesync_postgres_id} />
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollExport projectId={project.whalesync_postgres_id} />
        </TabsContent>

        <TabsContent value="compliance">
          <TeamCompliance />
        </TabsContent>

        <TabsContent value="training">
          <TeamTraining />
        </TabsContent>

        <TabsContent value="notices">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Broadcast Notices</h2>
              <BroadcastNotices />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Notices Compliance Log</h2>
              <NoticesComplianceLog />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Qualifications Matrix</h2>
              <ComplianceMatrix />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Training Matrix</h2>
              <TrainingMatrix />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inductions">
          <ProjectInductions />
        </TabsContent>

        <TabsContent value="builder">
          <InductionBuilder />
        </TabsContent>

        <TabsContent value="signatures">
          <SignatureVault />
        </TabsContent>

            <TabsContent value="vault">
              <SignatureVaultExport />
            </TabsContent>

            <TabsContent value="retention">
              <RetentionSettings />
            </TabsContent>

            <TabsContent value="archive">
              <DataArchiveLog />
            </TabsContent>

        <TabsContent value="on-hire">
          <OnHireTracker projectId={project.whalesync_postgres_id} />
        </TabsContent>

        <TabsContent value="pods">
          <PODRegister />
        </TabsContent>

        <TabsContent value="documents">
          <ProjectDocuments projectId={project.whalesync_postgres_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetails;