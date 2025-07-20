import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseError } from '@/hooks/useSupabaseError';
import { SupabaseErrorBoundary } from '@/components/errors/SupabaseErrorBoundary';
import { 
  Building, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Wrench,
  Zap
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectStats {
  totalProjects: number;
  activeUnits: number;
  pendingTasks: number;
  testCoverage: number;
  completedTasks: number;
  inProgressTasks: number;
}

interface ProjectSetupData {
  name: string;
  description: string;
  client: string;
  startDate: string;
  endDate: string;
  blocks: Array<{
    name: string;
    code: string;
    levels: number;
    unitsPerLevel: number;
    includeGroundFloor: boolean;
    includeMezzanine: boolean;
    includeBasement: boolean;
  }>;
}

export function ProjectsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const { withRetry, handleError } = useSupabaseError();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeUnits: 0,
    pendingTasks: 0,
    testCoverage: 0,
    completedTasks: 0,
    inProgressTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [aiAssistance, setAiAssistance] = useState('');
  const [setupData, setSetupData] = useState<ProjectSetupData>({
    name: '',
    description: '',
    client: '',
    startDate: '',
    endDate: '',
    blocks: [{
      name: 'Block A',
      code: 'A',
      levels: 10,
      unitsPerLevel: 12,
      includeGroundFloor: true,
      includeMezzanine: false,
      includeBasement: false
    }]
  });

  // Check if user can edit projects
  const userRole = profile?.role?.toLowerCase() || 'operative';
  const canEdit = ['admin', 'director', 'pm'].includes(userRole);

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data || [];
        },
        { operation: 'fetchProjects', table: 'projects' }
      );

      setProjects(data);
    } catch (error) {
      handleError(error as Error, { operation: 'fetchProjects', table: 'projects' });
      toast({
        title: "Connection Issues",
        description: "🔧 Pipe network hiccup - couldn't load projects. Check your connection!",
        variant: "destructive"
      });
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const results = await withRetry(
        async () => {
          // Get project count
          const { count: projectCount } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true });

          // Get plot count
          const { count: plotCount } = await supabase
            .from('plots')
            .select('*', { count: 'exact', head: true });

          // Get task counts
          const { count: totalTasks } = await supabase
            .from('plot_tasks')
            .select('*', { count: 'exact', head: true });

          const { count: completedTasks } = await supabase
            .from('plot_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Complete');

          const { count: inProgressTasks } = await supabase
            .from('plot_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'In Progress');

          const { count: testedTasks } = await supabase
            .from('plot_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('test_completed', true);

          return {
            projectCount,
            plotCount,
            totalTasks,
            completedTasks,
            inProgressTasks,
            testedTasks
          };
        },
        { operation: 'fetchStats', table: 'multiple' }
      );

      setStats({
        totalProjects: results.projectCount || 0,
        activeUnits: results.plotCount || 0,
        pendingTasks: (results.totalTasks || 0) - (results.completedTasks || 0),
        testCoverage: results.totalTasks ? Math.round(((results.testedTasks || 0) / results.totalTasks) * 100) : 0,
        completedTasks: results.completedTasks || 0,
        inProgressTasks: results.inProgressTasks || 0
      });
    } catch (error) {
      handleError(error as Error, { operation: 'fetchStats', table: 'multiple' });
    } finally {
      setLoading(false);
    }
  };

  const handleAIAssistance = async (prompt: string) => {
    try {
      const data = await withRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('project-ai-assistant', {
            body: { 
              action: 'suggest_template',
              data: {
                projectName: setupData.name,
                description: setupData.description,
                blocks: setupData.blocks
              }
            }
          });

          if (error) throw error;
          return data;
        },
        { operation: 'aiAssistance' }
      );

      if (data.success && data.message) {
        setAiAssistance(data.message);

        // Apply AI suggestions if provided
        if (data.suggestions) {
          setSetupData(prev => ({ ...prev, ...data.suggestions }));
        }
      } else {
        throw new Error(data.error || 'AI assistance failed');
      }
    } catch (error) {
      handleError(error as Error, { operation: 'aiAssistance' });
      toast({
        title: "AI Assistant Offline",
        description: "🤖 Our smart plumber is taking a tea break. Try again in a moment!",
        variant: "destructive"
      });
    }
  };

  const handleCreateProject = async () => {
    if (!canEdit) {
      toast({
        title: "Access Denied",
        description: "🔒 Only master plumbers can create new projects!",
        variant: "destructive"
      });
      return;
    }

    try {
      const data = await withRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('project-bulk-generator', {
            body: { 
              projectData: setupData,
              applyTemplate: true 
            }
          });

          if (error) throw error;
          return data;
        },
        { operation: 'createProject' }
      );

      if (data.success) {
        toast({
          title: "Project Created! 🚰",
          description: `${data.totalUnits} units generated for "${setupData.name}" (${data.projectCode}) – flow secured, no leaks detected!`,
          duration: 5000
        });

        setShowSetupModal(false);
        fetchProjects();
        fetchStats();
      } else {
        throw new Error(data.error || 'Project creation failed');
      }
    } catch (error) {
      handleError(error as Error, { operation: 'createProject' });
      
      let errorMessage = "🔧 Project hit a snag – check the blueprints and try again!";
      if (error.message.includes('duplicate') || error.message.includes('collision')) {
        errorMessage = "🔧 Project name conflict detected – try a different name or the system will generate a unique code!";
      }
      
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle, 
    trend, 
    chart 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    subtitle: string; 
    trend?: number; 
    chart?: React.ReactNode; 
  }) => (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {trend && (
            <Badge variant={trend > 0 ? "default" : "secondary"} className="text-xs">
              {trend > 0 ? '+' : ''}{trend}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          {chart && <div className="mt-2">{chart}</div>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SupabaseErrorBoundary operation="ProjectsDashboard">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building className="h-8 w-8 text-primary" />
              Projects Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Build & Flow – Foundation central, no leaks allowed! 🔧
            </p>
          </div>
          
          {canEdit && (
            <SupabaseErrorBoundary operation="ProjectSetup">
              <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
                <DialogTrigger asChild>
                  <Button size="lg" className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Setup New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Project Setup Wizard
                    </DialogTitle>
                    <DialogDescription>
                      AI-powered project generation – let's build something watertight!
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Project Name</Label>
                          <Input
                            id="name"
                            value={setupData.name}
                            onChange={(e) => setSetupData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Sunrise Apartments"
                          />
                        </div>
                        <div>
                          <Label htmlFor="client">Client</Label>
                          <Input
                            id="client"
                            value={setupData.client}
                            onChange={(e) => setSetupData(prev => ({ ...prev, client: e.target.value }))}
                            placeholder="e.g., Sunrise Developments"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description / Address</Label>
                        <Textarea
                          id="description"
                          value={setupData.description}
                          onChange={(e) => setSetupData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Site address and project details..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={setupData.startDate}
                            onChange={(e) => setSetupData(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate">End Date (Optional)</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={setupData.endDate}
                            onChange={(e) => setSetupData(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Block Configuration */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Block Configuration</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAIAssistance(`Suggest optimal block configuration for ${setupData.name}`)}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Suggest
                        </Button>
                      </div>

                      {setupData.blocks.map((block, index) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor={`block-name-${index}`}>Block Name</Label>
                              <Input
                                id={`block-name-${index}`}
                                value={block.name}
                                onChange={(e) => {
                                  const newBlocks = [...setupData.blocks];
                                  newBlocks[index].name = e.target.value;
                                  setSetupData(prev => ({ ...prev, blocks: newBlocks }));
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`block-code-${index}`}>Block Code</Label>
                              <Input
                                id={`block-code-${index}`}
                                value={block.code}
                                onChange={(e) => {
                                  const newBlocks = [...setupData.blocks];
                                  newBlocks[index].code = e.target.value;
                                  setSetupData(prev => ({ ...prev, blocks: newBlocks }));
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`levels-${index}`}>Number of Levels</Label>
                              <Input
                                id={`levels-${index}`}
                                type="number"
                                value={block.levels}
                                onChange={(e) => {
                                  const newBlocks = [...setupData.blocks];
                                  newBlocks[index].levels = parseInt(e.target.value) || 1;
                                  setSetupData(prev => ({ ...prev, blocks: newBlocks }));
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`units-${index}`}>Units per Level</Label>
                              <Input
                                id={`units-${index}`}
                                type="number"
                                value={block.unitsPerLevel}
                                onChange={(e) => {
                                  const newBlocks = [...setupData.blocks];
                                  newBlocks[index].unitsPerLevel = parseInt(e.target.value) || 1;
                                  setSetupData(prev => ({ ...prev, blocks: newBlocks }));
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-4 mt-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`gf-${index}`}
                                checked={block.includeGroundFloor}
                                onCheckedChange={(checked) => {
                                  const newBlocks = [...setupData.blocks];
                                  newBlocks[index].includeGroundFloor = checked;
                                  setSetupData(prev => ({ ...prev, blocks: newBlocks }));
                                }}
                              />
                              <Label htmlFor={`gf-${index}`}>Ground Floor</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`mezz-${index}`}
                                checked={block.includeMezzanine}
                                onCheckedChange={(checked) => {
                                  const newBlocks = [...setupData.blocks];
                                  newBlocks[index].includeMezzanine = checked;
                                  setSetupData(prev => ({ ...prev, blocks: newBlocks }));
                                }}
                              />
                              <Label htmlFor={`mezz-${index}`}>Mezzanine</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`basement-${index}`}
                                checked={block.includeBasement}
                                onCheckedChange={(checked) => {
                                  const newBlocks = [...setupData.blocks];
                                  newBlocks[index].includeBasement = checked;
                                  setSetupData(prev => ({ ...prev, blocks: newBlocks }));
                                }}
                              />
                              <Label htmlFor={`basement-${index}`}>Basement</Label>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* AI Preview */}
                    {aiAssistance && (
                      <Card className="p-4 bg-primary/5 border-primary/20">
                        <div className="flex items-start gap-2">
                          <Zap className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-primary">AI Assistant</h4>
                            <p className="text-sm mt-1">{aiAssistance}</p>
                          </div>
                        </div>
                      </Card>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowSetupModal(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateProject}>
                        Create Project
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </SupabaseErrorBoundary>
          )}
        </div>

        {/* Metrics Grid */}
        <SupabaseErrorBoundary operation="ProjectMetrics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Projects"
              value={stats.totalProjects}
              icon={Building}
              subtitle="Sites steady – no foundation cracks!"
              trend={12}
              chart={<div className="h-8 bg-gradient-to-r from-blue-500/20 to-blue-500/5 rounded" />}
            />
            <MetricCard
              title="Active Units"
              value={stats.activeUnits}
              icon={TrendingUp}
              subtitle="Units flowing – 80% onsite!"
              chart={<Progress value={80} className="w-full" />}
            />
            <MetricCard
              title="Pending Tasks"
              value={stats.pendingTasks}
              icon={AlertTriangle}
              subtitle="Backlog building – time to unblock?"
              chart={<div className="h-8 bg-gradient-to-r from-orange-500/20 to-orange-500/5 rounded" />}
            />
            <MetricCard
              title="Test Coverage"
              value={`${stats.testCoverage}%`}
              icon={CheckCircle}
              subtitle="Drip check: Quality secured!"
              chart={<Progress value={stats.testCoverage} className="w-full" />}
            />
          </div>
        </SupabaseErrorBoundary>

        {/* Projects Overview */}
        <SupabaseErrorBoundary operation="ProjectsList">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Project Overview</CardTitle>
                  <CardDescription>
                    All active construction sites – flowing smoothly!
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'Try adjusting your search' : 'Ready to build something amazing?'}
                  </p>
                  {canEdit && (
                    <Button onClick={() => setShowSetupModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Project
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{project.name}</h3>
                              <Badge variant="outline">{project.code}</Badge>
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">Client: {project.client}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Started: {new Date(project.start_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Progress: Flowing smoothly
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">85%</div>
                              <div className="text-xs text-muted-foreground">Complete</div>
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={() => navigate(`/projects/${project.id}`)}
                            >
                              View Details
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </SupabaseErrorBoundary>
      </div>
    </SupabaseErrorBoundary>
  );
}
