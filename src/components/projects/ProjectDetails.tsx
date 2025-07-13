import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Download
} from 'lucide-react';
import LevelsAndPlots from './LevelsAndPlots';
import TeamManagement from './TeamManagement';
import ComplianceTracking from './ComplianceTracking';
import ProjectDocuments from './ProjectDocuments';
import RAMSTable from './RAMSTable';
import WeeklyTimesheetApproval from './WeeklyTimesheetApproval';
import { PayrollExport } from './PayrollExport';

// Mock project data - in real app, fetch from backend using projectId
const mockProject = {
  id: '1',
  name: 'Riverside Development Phase 1',
  client: 'Riverside Holdings Ltd',
  description: 'A comprehensive residential development featuring 24 luxury apartments across 3 levels, including underground parking and communal facilities.',
  address: '123 River Street, London SE1 2AB',
  status: 'Active',
  startDate: '2024-01-15',
  endDate: '2024-06-30',
  projectManager: {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@ajryan.com',
    avatar: '/placeholder.svg'
  },
  plotsTotal: 24,
  plotsCompleted: 18,
  compliancePercentage: 92,
  operativesAssigned: 12,
  issuesOpen: 2,
  levels: [
    {
      id: '1',
      name: 'Basement',
      plots: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06']
    },
    {
      id: '2', 
      name: 'Ground Floor',
      plots: ['G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08']
    },
    {
      id: '3',
      name: 'First Floor', 
      plots: ['F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08']
    },
    {
      id: '4',
      name: 'Second Floor',
      plots: ['S01', 'S02']
    }
  ],
  recentActivity: [
    {
      id: '1',
      type: 'plot_completed',
      message: 'Plot F07 marked as completed',
      timestamp: '2024-01-20T10:30:00Z',
      user: 'Tom Wilson'
    },
    {
      id: '2',
      type: 'document_uploaded',
      message: 'Updated RAMS document uploaded',
      timestamp: '2024-01-19T14:15:00Z',
      user: 'Sarah Johnson'
    },
    {
      id: '3',
      type: 'operative_assigned',
      message: 'Mike Brown assigned to project',
      timestamp: '2024-01-18T09:00:00Z',
      user: 'Sarah Johnson'
    }
  ]
};

const ProjectDetails = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  
  // In real app, fetch project data using projectId
  const project = mockProject;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'On Hold':
        return <Badge variant="secondary">On Hold</Badge>;
      case 'Completed':
        return <Badge className="bg-accent text-accent-foreground">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const completionPercentage = Math.round((project.plotsCompleted / project.plotsTotal) * 100);

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-primary">{project.name}</h1>
                {getStatusBadge(project.status)}
              </div>
              <p className="text-muted-foreground">{project.client}</p>
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                {project.address}
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
                  <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{new Date(project.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Client Name</p>
                <p className="font-medium">{project.client}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Project Manager</p>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={project.projectManager.avatar} />
                    <AvatarFallback>{project.projectManager.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.projectManager.name}</p>
                    <p className="text-sm text-muted-foreground">{project.projectManager.email}</p>
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
            <p className="text-2xl font-bold text-primary">{project.operativesAssigned}</p>
            <p className="text-xs text-muted-foreground">Operatives</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <Building2 className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-accent">{project.levels.length}</p>
            <p className="text-xs text-muted-foreground">Levels</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-success">{project.plotsCompleted}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold text-destructive">{project.issuesOpen}</p>
            <p className="text-xs text-muted-foreground">Open Issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="levels">Levels & Plots</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Export</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Description */}
            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{activity.user}</span>
                          <span>•</span>
                          <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* RAMS & Task Plans Section in Overview */}
          <div className="mt-6">
            <RAMSTable projectId={project.id} />
          </div>
        </TabsContent>

        <TabsContent value="levels">
          <LevelsAndPlots projectId={project.id} levels={project.levels} />
        </TabsContent>

        <TabsContent value="team">
          <TeamManagement projectId={project.id} />
        </TabsContent>

        <TabsContent value="timesheets">
          <WeeklyTimesheetApproval projectId={project.id} />
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollExport projectId={project.id} />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceTracking projectId={project.id} />
        </TabsContent>

        <TabsContent value="documents">
          <ProjectDocuments projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetails;