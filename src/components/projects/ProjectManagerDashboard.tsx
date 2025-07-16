
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Clock, AlertTriangle, TrendingUp, CheckCircle, FileText } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { DABSCreationForm } from '@/components/notices/DABSCreationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  projectname: string;
  status: string;
  progress: number;
  team_size: number;
  deadline: string;
  budget_status: 'on_track' | 'warning' | 'over_budget';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'offline';
  avatar?: string;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'update' | 'completion' | 'issue' | 'milestone';
}

const ProjectManagerDashboard = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [showDABSForm, setShowDABSForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, code')
        .limit(10);

      // Mock data for dashboard display
      const mockProjects: Project[] = (projectsData || []).map((project, index) => ({
        id: project.id,
        projectname: project.name,
        status: 'Active',
        progress: Math.floor(Math.random() * 100),
        team_size: Math.floor(Math.random() * 20) + 5,
        deadline: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget_status: ['on_track', 'warning', 'over_budget'][Math.floor(Math.random() * 3)] as any
      }));

      setProjects(mockProjects);
      if (mockProjects.length > 0 && !selectedProject) {
        setSelectedProject(mockProjects[0].id);
      }

      // Mock team members data
      setTeamMembers([
        { id: '1', name: 'John Smith', role: 'Site Manager', status: 'available' },
        { id: '2', name: 'Sarah Johnson', role: 'Supervisor', status: 'busy' },
        { id: '3', name: 'Mike Wilson', role: 'Quality Inspector', status: 'available' },
        { id: '4', name: 'Emma Davis', role: 'Safety Officer', status: 'offline' }
      ]);

      // Mock recent activities
      setRecentActivities([
        {
          id: '1',
          user: 'John Smith',
          action: 'Completed foundation inspection for Plot 12',
          timestamp: '2 hours ago',
          type: 'completion'
        },
        {
          id: '2',
          user: 'Sarah Johnson',
          action: 'Updated progress on Block A - Level 2',
          timestamp: '4 hours ago',
          type: 'update'
        },
        {
          id: '3',
          user: 'Mike Wilson',
          action: 'Reported quality issue in Plot 8',
          timestamp: '6 hours ago',
          type: 'issue'
        },
        {
          id: '4',
          user: 'Emma Davis',
          action: 'Milestone reached: Phase 1 Safety Checks Complete',
          timestamp: '1 day ago',
          type: 'milestone'
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'over_budget': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'completion': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'update': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'issue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'milestone': return <Calendar className="h-4 w-4 text-purple-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'busy': return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'offline': return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
      default: return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Project Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Oversee project progress, manage teams, and track key metrics
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showDABSForm} onOpenChange={setShowDABSForm}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <FileText className="h-4 w-4" />
                Create DABS Notice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create DABS Notice</DialogTitle>
              </DialogHeader>
              <DABSCreationForm 
                onClose={() => setShowDABSForm(false)} 
                onCreated={() => {
                  setShowDABSForm(false);
                  fetchDashboardData();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project Selection */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer transition-all ${
                    selectedProject === project.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedProject(project.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{project.projectname}</h3>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{project.team_size} members</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={getBudgetStatusColor(project.budget_status)}
                        >
                          {project.budget_status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {selectedProjectData && (
            <>
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedProjectData.progress}%</div>
                    <Progress value={selectedProjectData.progress} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedProjectData.team_size}</div>
                    <p className="text-xs text-muted-foreground">
                      Active team members
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Deadline</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.ceil((new Date(selectedProjectData.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <p className="text-xs text-muted-foreground">Days remaining</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <Badge className={getBudgetStatusColor(selectedProjectData.budget_status)}>
                      {selectedProjectData.budget_status.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Current status</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest updates from your project team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.user}</p>
                          <p className="text-sm text-muted-foreground">{activity.action}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {selectedProject && (
            <AnalyticsDashboard projectId={selectedProject} userRole="Project Manager" />
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Current team status and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{member.name}</h3>
                            {getStatusIcon(member.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Activity Log</CardTitle>
              <CardDescription>Complete history of project activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{activity.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectManagerDashboard;
