
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Building2, 
  Calendar, 
  ArrowLeft, 
  Search,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Users,
  Home,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

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
  start_date: string;
  end_date: string;
  created_at: string;
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

export const ProjectDetailsEnhanced: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  console.log('🎯 ProjectDetailsEnhanced loading with ID:', projectId);

  // Early validation - if no projectId, redirect immediately
  useEffect(() => {
    if (!projectId) {
      console.error('❌ Missing project ID - returning to dashboard');
      toast.error('Missing project ID - returning to dashboard');
      navigate('/projects/dashboard');
    }
  }, [projectId, navigate]);

  // Enhanced project fetch with retry logic
  const fetchProjectWithRetry = async (id: string, attempt = 1): Promise<Project> => {
    const maxAttempts = 3;
    const backoffDelays = [500, 1000, 2000]; // Exponential backoff
    
    console.log(`📡 Fetching project (attempt ${attempt}/${maxAttempts}):`, id);
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`❌ Project fetch error (attempt ${attempt}):`, error);
        
        // Check for RLS policy violation
        if (error.code === '42501') {
          console.error('🚫 RLS Policy violation - user may not have access to this project');
          toast('Account access issue detected. Please contact admin if this persists.', {
            description: 'RLS policy may be blocking access to this project.'
          });
          throw new Error('Access denied to project');
        }
        
        throw error;
      }

      if (!data) {
        console.warn(`⚠️ No project data returned (attempt ${attempt})`);
        
        if (attempt < maxAttempts) {
          console.log(`⏳ Retrying in ${backoffDelays[attempt - 1]}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelays[attempt - 1]));
          return fetchProjectWithRetry(id, attempt + 1);
        } else {
          throw new Error('Project not found after retries');
        }
      }

      console.log('✅ Project fetched successfully:', data);
      
      // Show success toast if this was a retry
      if (attempt > 1) {
        toast('Project loaded successfully!', {
          description: 'Data synced after retry.'
        });
      }
      
      return data;
    } catch (error) {
      if (attempt < maxAttempts) {
        console.warn(`⚠️ Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelays[attempt - 1]));
        return fetchProjectWithRetry(id, attempt + 1);
      } else {
        console.error(`❌ All ${maxAttempts} attempts failed for project:`, id);
        throw error;
      }
    }
  };

  // Real-time subscription setup with immediate post-creation detection
  useEffect(() => {
    if (!projectId) return;

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
          
          // If this is an INSERT event, it might be immediate post-creation
          if (payload.eventType === 'INSERT') {
            console.log('🆕 New project detected via realtime - refreshing queries');
            toast('Project synced successfully!', {
              description: 'Your new project is now available.'
            });
          }
          
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
          
          if (payload.eventType !== 'UPDATE' || payload.old?.updated_at !== payload.new?.updated_at) {
            uiToast({
              title: "Project Updated",
              description: "Project details have been updated.",
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
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_categories'
        },
        (payload) => {
          console.log('📡 Work categories change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['work-categories'] });
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_team_members',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('📡 Team members change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['team-members', projectId] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Cleaning up realtime subscriptions');
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient, uiToast]);

  // Fetch project data with enhanced retry logic
  const { data: project, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project> => {
      if (!projectId) throw new Error('Project ID is required');
      return fetchProjectWithRetry(projectId);
    },
    enabled: !!projectId,
    retry: false, // We handle retries manually
    staleTime: 5000, // Consider data fresh for 5 seconds
  });

  // Show loading state with retry information
  if (projectLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Loading project details...</p>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Retry attempt {retryCount}/3
            </p>
          )}
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

  // Fetch plots/units
  const { data: plots = [], isLoading: plotsLoading } = useQuery({
    queryKey: ['plots', projectId],
    queryFn: async (): Promise<Plot[]> => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('plots')
        .select('*')
        .eq('project_id', projectId)
        .order('plot_sequence_order');

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch work categories
  const { data: workCategories = [], isLoading: workCategoriesLoading } = useQuery({
    queryKey: ['work-categories'],
    queryFn: async (): Promise<WorkCategory[]> => {
      const { data, error } = await supabase
        .from('work_categories')
        .select('*')
        .order('sequence_order');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ['team-members', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch project progress
  const { data: progressData } = useQuery({
    queryKey: ['project-progress', projectId],
    queryFn: async (): Promise<ProgressData | null> => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .rpc('get_project_progress', { project_id_param: projectId });

      if (error) throw error;
      return data as unknown as ProgressData;
    },
    enabled: !!projectId,
  });

  const filteredPlots = plots.filter(plot =>
    plot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plot.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plot.composite_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/projects/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">
            {project.name}
          </h1>
          <p className="text-muted-foreground">{project.client}</p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="blocks" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Blocks & Units
          </TabsTrigger>
          <TabsTrigger value="worktypes" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Work Types
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
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
      </Tabs>
    </div>
  );
};
