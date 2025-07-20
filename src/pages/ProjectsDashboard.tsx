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
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseError } from '@/hooks/useSupabaseError';
import { SupabaseErrorBoundary } from '@/components/errors/SupabaseErrorBoundary';
import { ProjectSuccessPopup } from '@/components/projects/ProjectSuccessPopup';
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
  Zap,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Edit
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
  status: 'Planning' | 'Active' | 'Building' | 'Completed';
  is_archived: boolean;
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
  code?: string;
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
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [setupData, setSetupData] = useState<ProjectSetupData>({
    code: '',
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
  }, [showArchived]);

  const fetchProjects = async () => {
    try {
      const data = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('is_archived', showArchived)
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

  const handleCreateProject = async () => {
    if (!canEdit) {
      toast({
        title: "Access Denied",
        description: "🔒 Only master plumbers can create new projects!",
        variant: "destructive"
      });
      return;
    }

    if (!setupData.code?.trim()) {
      toast({
        title: "Project Code Required",
        description: "🔧 Please enter a project code before creating the project!",
        variant: "destructive"
      });
      return;
    }

    // Validate project code format (should be numbers only)
    const codeRegex = /^\d+$/;
    if (!codeRegex.test(setupData.code.trim())) {
      toast({
        title: "Invalid Project Code",
        description: "🔧 Project code must contain only numbers (e.g., 799, 382)!",
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

          if (error) {
            console.error('Function invoke error:', error);
            throw error;
          }

          if (!data.success) {
            throw new Error(data.error || data.message || 'Project creation failed');
          }

          return data;
        },
        { operation: 'createProject' }
      );

      if (data.success) {
        // Show success popup instead of toast
        setSuccessData({
          code: data.projectCode,
          name: setupData.name,
          totalBlocks: data.totalBlocks || setupData.blocks.length,
          totalLevels: data.totalLevels || 0,
          totalUnits: data.totalUnits || 0,
          samplePlots: data.samplePlots || []
        });

        setShowSetupModal(false);
        setShowSuccessPopup(true);
        
        // Refresh data in background
        fetchProjects();
        fetchStats();
      } else {
        throw new Error(data.error || 'Project creation failed');
      }
    } catch (error) {
      handleError(error as Error, { operation: 'createProject' });
      
      let errorMessage = "🔧 Project hit a snag – check the blueprints and try again!";
      const errorMsg = (error as Error).message || '';
      
      if (errorMsg.includes('duplicate') || errorMsg.includes('collision') || errorMsg.includes('already in use')) {
        errorMessage = `🔧 Project code "${setupData.code}" collision detected – code already exists! Try a different number.`;
      } else if (errorMsg.includes('validation')) {
        errorMessage = `📋 ${errorMsg}`;
      } else if (errorMsg.includes('Data validation failed')) {
        errorMessage = `📋 ${errorMsg}`;
      } else if (errorMsg.includes('non-2xx')) {
        errorMessage = `🚨 Server error – function crashed! Check logs and try again.`;
      } else if (errorMsg.includes('FunctionsHttpError')) {
        errorMessage = `🚨 Function error – pipeline blocked! Try again or check different code.`;
      }
      
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleSuccessViewDetails = () => {
    setShowSuccessPopup(false);
    if (successData?.code) {
      // Find the project and navigate to it
      const project = projects.find(p => p.code === successData.code);
      if (project) {
        navigate(`/projects/${project.id}`);
      } else {
        // If not found immediately, refresh and try again
        fetchProjects().then(() => {
          const updatedProject = projects.find(p => p.code === successData.code);
          if (updatedProject) {
            navigate(`/projects/${updatedProject.id}`);
          }
        });
      }
    }
  };

  const handleSuccessBackToWizard = () => {
    setShowSuccessPopup(false);
    setShowSetupModal(true);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateProjectStatus = async (projectId: string, status: 'Planning' | 'Active' | 'Building' | 'Completed') => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status } : p
      ));

      toast({
        title: "Status Updated",
        description: `Project status changed to ${status}! 🎯`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Couldn't update project status. Try again!",
        variant: "destructive"
      });
    }
  };

  const archiveProject = async (projectId: string, projectName: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      toast({
        title: "Archived Successfully",
        description: `Smashed that archive, ${profile?.firstname || 'Mark'}—dashboard cleaner! 🗂️`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Archive Failed",
        description: "Couldn't archive project. Try again!",
        variant: "destructive"
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      toast({
        title: "Project Deleted",
        description: "Deleted—clean slate! 🧹",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Couldn't delete project. Try again!",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedProjects.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .in('id', Array.from(selectedProjects));

      if (error) throw error;

      setProjects(prev => prev.filter(p => !selectedProjects.has(p.id)));
      setSelectedProjects(new Set());
      
      toast({
        title: "Bulk Archive Complete",
        description: `Archived ${selectedProjects.size} projects! Dashboard cleaned up! 🗂️`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Bulk Archive Failed",
        description: "Couldn't archive projects. Try again!",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('projects')
        .delete()
        .in('id', Array.from(selectedProjects));

      if (error) throw error;

      setProjects(prev => prev.filter(p => !selectedProjects.has(p.id)));
      setSelectedProjects(new Set());
      
      toast({
        title: "Bulk Delete Complete",
        description: `Deleted ${selectedProjects.size} projects—clean slate! 🧹`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Bulk Delete Failed",
        description: "Couldn't delete projects. Try again!",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const selectAllProjects = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planning': return 'bg-blue-500 text-white';
      case 'Active': return 'bg-green-500 text-white';
      case 'Building': return 'bg-orange-500 text-white';
      case 'Completed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const StatusBadge = ({ project }: { project: Project }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge className={`cursor-pointer hover:opacity-80 ${getStatusColor(project.status)}`}>
          {project.status}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, 'Planning')}>
          Planning
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, 'Active')}>
          Active
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, 'Building')}>
          Building
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, 'Completed')}>
          Completed
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
          
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2"
                >
                  {showArchived ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showArchived ? 'Hide Archived' : 'Show Archived'}
                </Button>
              </div>
              
              {canEdit && (
                <SupabaseErrorBoundary operation="ProjectSetup">
                  <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="lg" className="flex items-center gap-2">
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
                      Quick project generation – let's build something watertight!
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="code">Project Code *</Label>
                          <Input
                            id="code"
                            value={setupData.code || ''}
                            onChange={(e) => setSetupData(prev => ({ ...prev, code: e.target.value }))}
                            placeholder="e.g., 382, 379"
                            className="font-mono"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Unique project identifier
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="name">Project Name *</Label>
                          <Input
                            id="name"
                            value={setupData.name}
                            onChange={(e) => setSetupData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Sunrise Apartments"
                          />
                        </div>
                        <div>
                          <Label htmlFor="client">Client *</Label>
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
                          <Label htmlFor="startDate">Start Date *</Label>
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
                        <div className="text-sm text-muted-foreground">
                          Configure your project structure
                        </div>
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
                                min="1"
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
                                min="1"
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

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowSetupModal(false)}>
                        Cancel
                      </Button>
                      <Button variant="default" onClick={handleCreateProject} disabled={!setupData.code?.trim()}>
                        {!setupData.code?.trim() ? 'Enter Project Code' : 'Create Project'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
                </SupabaseErrorBoundary>
              )}
            </div>
          </div>

        {/* Success Popup */}
        {successData && (
          <ProjectSuccessPopup
            open={showSuccessPopup}
            onOpenChange={setShowSuccessPopup}
            projectData={successData}
            onViewDetails={handleSuccessViewDetails}
            onBackToWizard={handleSuccessBackToWizard}
          />
        )}

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

        {/* Search and Bulk Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Quick search projects, clients, or codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {selectedProjects.size > 0 && canEdit && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedProjects.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                className="flex items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                Archive Selected
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Permanent nuke?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedProjects.size} projects and all their data. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
                      Delete Projects
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {showArchived ? 'Archived Projects' : 'Recent Projects'}
            </h2>
            {filteredProjects.length > 0 && canEdit && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                  onCheckedChange={selectAllProjects}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {showArchived ? 'No Archived Projects' : 'No Projects Found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No projects match your search criteria.' : 
                   showArchived ? 'No projects have been archived yet.' : 'Start by creating your first project!'}
                </p>
                {canEdit && !searchTerm && !showArchived && (
                  <Button onClick={() => setShowSetupModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Project
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary projects-card"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      {canEdit && (
                        <Checkbox
                          checked={selectedProjects.has(project.id)}
                          onCheckedChange={() => toggleProjectSelection(project.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 mr-2"
                        />
                      )}
                      <div className="flex-1 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building className="h-5 w-5 text-primary" />
                          {project.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {project.client}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge project={project} />
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => archiveProject(project.id, project.name)}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Permanent nuke?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete "{project.name}" and all its data. 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteProject(project.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Delete Project
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Project Code</span>
                        <Badge variant="outline" className="font-mono">
                          {project.code}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Start Date</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(project.start_date).toLocaleDateString()}
                        </span>
                      </div>
                      {project.end_date && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">End Date</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(project.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </SupabaseErrorBoundary>
  );
}
