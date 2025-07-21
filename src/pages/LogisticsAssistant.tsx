import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PendingRequestsTab } from '@/components/logistics/PendingRequestsTab';
import { BookedDeliveriesTab } from '@/components/logistics/BookedDeliveriesTab';
import { UploadFormTab } from '@/components/logistics/UploadFormTab';
import { useAuth } from '@/hooks/useAuth';
import { RoleProtection } from '@/components/auth/RoleProtection';
import { supabase } from '@/integrations/supabase/client';
import { Package, Truck, Upload, BarChart3, Building2 } from 'lucide-react';

const LogisticsAssistant = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [stats, setStats] = useState({
    pending: 0,
    booked: 0,
    today: 0,
    week: 0
  });

  // Fetch user's accessible projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase.rpc('get_user_accessible_projects', {
          user_auth_id: user.id
        });
        
        if (error) throw error;
        
        setProjects(data || []);
        
        // Auto-select current project or first available project
        if (data && data.length > 0) {
          const currentProject = user.user_metadata?.currentproject;
          const projectToSelect = currentProject && data.find(p => p.project_id === currentProject) 
            ? currentProject 
            : data[0].project_id;
          
          setSelectedProject(projectToSelect);
          const selectedProjectData = data.find(p => p.project_id === projectToSelect);
          setProjectName(selectedProjectData?.project_name || '');
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [user]);

  // Fetch project-specific stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedProject) return;
      
      try {
        const { data, error } = await supabase.rpc('get_delivery_stats_by_project', {
          p_project_id: selectedProject
        });
        
        if (error) throw error;
        
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setStats({
            pending: (data as any).pending || 0,
            booked: (data as any).booked || 0,
            today: (data as any).today || 0,
            week: (data as any).week || 0
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [selectedProject]);

  return (
    <RoleProtection 
      allowedRoles={['Admin', 'PM', 'Director', 'Supervisor']}
      fallbackPath="/dashboard"
    >
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">Logistics Assistant</h1>
              <p className="text-muted-foreground">
                Manage delivery requests and bookings with AI-powered automation
              </p>
              {projectName && (
                <div className="flex items-center gap-2 mt-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{projectName}</span>
                </div>
              )}
            </div>
            
            {/* Project Selector for Admins */}
            {projects.length > 1 && (
              <div className="w-full sm:w-auto">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-full sm:w-64">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.project_id} value={project.project_id}>
                        {project.project_name} ({project.project_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Booked</p>
                    <p className="text-2xl font-bold">{stats.booked}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl font-bold">{stats.today}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">{stats.week}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger 
                    value="pending" 
                    className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 sm:px-4 text-xs sm:text-sm"
                  >
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Pending Requests</span>
                    <span className="sm:hidden">Pending</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="booked" 
                    className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 sm:px-4 text-xs sm:text-sm"
                  >
                    <Truck className="h-4 w-4" />
                    <span className="hidden sm:inline">Booked Deliveries</span>
                    <span className="sm:hidden">Booked</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 sm:px-4 text-xs sm:text-sm"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Upload Form</span>
                    <span className="sm:hidden">Upload</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="mt-6">
                  <PendingRequestsTab projectId={selectedProject} />
                </TabsContent>
                
                <TabsContent value="booked" className="mt-6">
                  <BookedDeliveriesTab projectId={selectedProject} />
                </TabsContent>
                
                <TabsContent value="upload" className="mt-6">
                  <UploadFormTab projectId={selectedProject} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleProtection>
  );
};

export default LogisticsAssistant;