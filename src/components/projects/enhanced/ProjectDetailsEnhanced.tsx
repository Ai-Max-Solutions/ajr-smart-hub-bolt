import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Calendar, 
  ArrowLeft, 
  RefreshCw,
  Briefcase,
  UserCheck,
  AlertCircle,
  Clock,
  Archive,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { ArchiveModal, DeleteModal } from '../ConfirmationModals';
import { StatusBadge } from '../StatusBadge';

// Import tab components
import { ProjectDetailsTab } from './tabs/ProjectDetailsTab';
import { BlocksUnitsTab } from './tabs/BlocksUnitsTab';
import { WorkTypesTab } from './tabs/WorkTypesTab';
import { TeamTab } from './tabs/TeamTab';

interface Project {
  id: string;
  name: string;
  client: string;
  code: string;
  status: 'Planning' | 'Active' | 'Building' | 'Completed' | 'Delayed';
  start_date: string;
  end_date: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface Plot {
  id: string;
  code: string;
  name: string;
  unit_type: string;
  status: string;
  composite_code: string;
  plot_sequence_order: number;
  handed_over: boolean;
  project_id: string;
  block_id?: string;
  level_id?: string;
}

interface WorkCategory {
  id: string;
  main_category: string;
  sub_task: string;
  sequence_order: number;
}

interface TeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  users?: {
    name: string;
    email: string;
    role: string;
  };
}

interface ProgressData {
  total_plots: number;
  handed_over_plots: number;
  progress_percentage: number;
}

interface DeleteProjectResult {
  success: boolean;
  message: string;
  deleted_counts: {
    project_name: string;
    plots: number;
    timesheets: number;
    timesheet_entries: number;
    unit_work_logs: number;
    unit_work_assignments: number;
    plot_tasks: number;
    project_team_members: number;
    project_levels: number;
    project_blocks: number;
    project_rams_requirements: number;
    rams_documents: number;
    users_updated: number;
    hire_items_updated: number;
  };
}

export const ProjectDetailsEnhanced: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  console.log('🎯 ProjectDetailsEnhanced rendering with ID:', projectId);

  // Set up loading timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, []);

  // Early validation - if no projectId, redirect immediately
  useEffect(() => {
    if (!projectId) {
      console.error('❌ Missing project ID - returning to dashboard');
      toast.error('Missing project ID - returning to dashboard');
      navigate('/projects/dashboard');
    }
  }, [projectId, navigate]);

  // Simplified project fetch with React Query's built-in retry
  const { data: project, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project> => {
      if (!projectId) throw new Error('Project ID is required');
      
      console.log(`📡 Fetching project:`, projectId);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('❌ Project fetch error:', error);
        
        if (error.code === '42501') {
          console.error('🚫 RLS Policy violation - user may not have access to this project');
          throw new Error('Access denied to project');
        }
        
        throw error;
      }

      if (!data) {
        console.warn('⚠️ No project data returned');
        throw new Error('Project not found');
      }

      console.log('✅ Project fetched successfully:', data);
      return data;
    },
    enabled: !!projectId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 5000,
  });

  // Real-time subscription setup (only after project is loaded)
  useEffect(() => {
    if (!projectId || !project) return;

    console.log('🔔 Setting up realtime subscriptions for project:', projectId);

    const channel = supabase.channel(`project:${projectId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'projects',
          filter: `id=eq.${projectId}`
        }, 
        (payload) => {
          console.log('📡 Project change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          
          if (payload.eventType === 'INSERT') {
            toast('Project synced successfully!', {
              description: 'Your new project is now available.'
            });
          }
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plots',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('📡 Plots change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['plots', projectId] });
          queryClient.invalidateQueries({ queryKey: ['project-progress', projectId] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Cleaning up realtime subscriptions');
      supabase.removeChannel(channel);
    };
  }, [projectId, project, queryClient]);

  // Fetch plots/units (only after project is loaded)
  const { data: plots = [], isLoading: plotsLoading } = useQuery({
    queryKey: ['plots', projectId],
    queryFn: async (): Promise<Plot[]> => {
      if (!projectId) return [];
      
      console.log('📡 Fetching plots for project:', projectId);
      
      const { data, error } = await supabase
        .from('plots')
        .select('*')
        .eq('project_id', projectId)
        .order('plot_sequence_order');

      if (error) {
        console.error('❌ Plots fetch error:', error);
        throw error;
      }
      
      console.log('✅ Plots fetched successfully:', data?.length || 0, 'plots');
      return data || [];
    },
    enabled: !!projectId && !!project,
    retry: 2,
  });

  // Fetch work categories
  const { data: workCategories = [], isLoading: workCategoriesLoading } = useQuery({
    queryKey: ['work-categories'],
    queryFn: async (): Promise<WorkCategory[]> => {
      console.log('📡 Fetching work categories');
      
      const { data, error } = await supabase
        .from('work_categories')
        .select('*')
        .order('sequence_order');

      if (error) {
        console.error('❌ Work categories fetch error:', error);
        throw error;
      }
      
      console.log('✅ Work categories fetched successfully:', data?.length || 0, 'categories');
      return data || [];
    },
    retry: 2,
  });

  // Fetch team members (only after project is loaded)
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ['team-members', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      console.log('📡 Fetching team members for project:', projectId);
      
      const { data, error } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('❌ Team members fetch error:', error);
        throw error;
      }
      
      console.log('✅ Team members fetched successfully:', data?.length || 0, 'members');
      return data || [];
    },
    enabled: !!projectId && !!project,
    retry: 2,
  });

  // Fetch project progress (only after project is loaded)
  const { data: progressData } = useQuery({
    queryKey: ['project-progress', projectId],
    queryFn: async (): Promise<ProgressData | null> => {
      if (!projectId) return null;
      
      console.log('📡 Fetching project progress for:', projectId);
      
      const { data, error } = await supabase
        .rpc('get_project_progress', { project_id_param: projectId });

      if (error) {
        console.error('❌ Project progress fetch error:', error);
        throw error;
      }
      
      console.log('✅ Project progress fetched successfully:', data);
      return data as unknown as ProgressData;
    },
    enabled: !!projectId && !!project,
    retry: 2,
  });

  // Archive project mutation
  const archiveProjectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('archive_project', { p_project_id: projectId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast('Project archived—dash cleaner, more time for Maxwell\'s footie!', {
        description: 'Project has been hidden from dashboard but all data is retained.'
      });
      navigate('/projects');
    },
    onError: (error) => {
      toast.error('Failed to archive project', {
        description: error.message
      });
    }
  });

  // Delete project mutation with enhanced safety
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      console.log('Deleting project with enhanced safety:', projectId);
      
      // Use the enhanced delete_project_safe function
      const { data, error } = await supabase.rpc('delete_project_safe', {
        p_project_id: projectId,
      });
      
      if (error) {
        console.error('Delete error:', error);
        throw new Error(error.message || 'Failed to delete project');
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('Project deleted successfully:', data);
      
      // Cast data to proper type with safety check
      const result = data as unknown as DeleteProjectResult;
      const deletedCounts = result?.deleted_counts;
      
      // Enhanced success message with deletion summary
      const summary = deletedCounts ? 
        `Cleaned up: ${deletedCounts.plots || 0} units, ${deletedCounts.timesheets || 0} timesheets, ${deletedCounts.timesheet_entries || 0} time entries` :
        'All linked data removed';
        
      toast('✅ Project deleted—database spotless, Mark!', {
        description: `"${deletedCounts?.project_name || 'Project'}" and all dependencies removed. ${summary}`
      });
      navigate('/projects');
    },
    onError: (error) => {
      console.error('Failed to delete project:', error);
      toast.error('❌ Delete failed—foreign key issues resolved but error occurred', {
        description: error.message || 'Delete operation failed. Check audit logs for details.'
      });
    }
  });

  const handleArchiveProject = () => {
    archiveProjectMutation.mutate();
    setArchiveModalOpen(false);
  };

  const handleDeleteProject = () => {
    deleteProjectMutation.mutate();
    setDeleteModalOpen(false);
  };

  if (projectLoading) {
    if (loadingTimeout) {
      return (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <Clock className="h-12 w-12 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Loading Taking Too Long</h3>
              <p className="text-muted-foreground text-sm mb-4">
                The project is taking longer than expected to load.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => refetchProject()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Force Retry
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/projects/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  // Enhanced error handling
  if (projectError || !project) {
    const isNotFound = !project;
    const isAccessDenied = projectError?.message?.includes('Access denied');
    
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            {isAccessDenied ? (
              <AlertCircle className="h-12 w-12 text-destructive" />
            ) : (
              <Building2 className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">
              {isAccessDenied ? 'Access Denied' : 'Project Not Found'}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {isAccessDenied 
                ? 'You may not have permission to view this project.'
                : 'This project might still be syncing or may not exist.'
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={() => refetchProject()}
              disabled={projectLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/projects/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          {isNotFound && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                If you just created this project, it might still be syncing. 
                Try refreshing in a few moments.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const filteredPlots = plots.filter(plot =>
    plot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plot.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plot.composite_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWorkAssignmentNavigation = () => {
    navigate(`/projects/${projectId}/units`);
  };

  return (
    <div className="space-y-6">
      {/* Header - Fixed layout to ensure buttons are visible */}
      <div className="space-y-4">
        {/* Back button and title row */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/projects/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-primary truncate">
              {project.name}
            </h1>
            <p className="text-muted-foreground truncate">{project.client}</p>
          </div>
        </div>
        
        {/* Action buttons row - ensures visibility */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            <Badge variant="outline">{project.code}</Badge>
            {progressData && (
              <div className="flex items-center gap-2">
                <Progress value={progressData.progress_percentage} className="w-20" />
                <span className="text-sm text-muted-foreground">
                  {Math.round(progressData.progress_percentage)}%
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleWorkAssignmentNavigation}
              size="sm"
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Assign Work
            </Button>
            <Button
              onClick={() => setArchiveModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-yellow-50 hover:border-yellow-300"
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
            <Button
              onClick={() => setDeleteModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="blocks" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Blocks & Units
          </TabsTrigger>
          <TabsTrigger value="worktypes" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Work Types
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="workassignment" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Work Assignment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <ProjectDetailsTab 
            project={project} 
            progressData={progressData}
            totalPlots={plots.length}
            handedOverCount={plots.filter(p => p.handed_over).length}
          />
        </TabsContent>

        <TabsContent value="blocks">
          <BlocksUnitsTab 
            projectId={projectId!}
            plots={filteredPlots}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={plotsLoading}
          />
        </TabsContent>

        <TabsContent value="worktypes">
          <WorkTypesTab 
            workCategories={workCategories}
            isLoading={workCategoriesLoading}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamTab 
            projectId={projectId!}
            teamMembers={teamMembers as any}
            isLoading={teamLoading}
          />
        </TabsContent>

        <TabsContent value="workassignment">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <Briefcase className="h-16 w-16 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Work Assignment Interface</h3>
                <p className="text-muted-foreground mb-4">
                  Access the comprehensive work assignment interface to assign tasks to your team members.
                </p>
              </div>
              <Button onClick={handleWorkAssignmentNavigation} size="lg" className="gap-2">
                <UserCheck className="h-5 w-5" />
                Go to Work Assignment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Modals */}
      <ArchiveModal
        open={archiveModalOpen}
        onOpenChange={setArchiveModalOpen}
        onConfirm={handleArchiveProject}
        projectName={project.name}
        loading={archiveProjectMutation.isPending}
      />

      <DeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteProject}
        projectName={project.name}
        loading={deleteProjectMutation.isPending}
      />
    </div>
  );
};
