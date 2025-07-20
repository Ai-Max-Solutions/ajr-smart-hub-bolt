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
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time subscription setup
  useEffect(() => {
    if (!id) return;

    const channel = supabase.channel(`project:${id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'projects',
          filter: `id=eq.${id}`
        }, 
        (payload) => {
          console.log('📡 Project change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['project', id] });
          if (payload.eventType !== 'UPDATE' || payload.old.updated_at !== payload.new?.updated_at) {
            toast({
              title: "Project Updated",
              description: "Project details have been updated by another user.",
            });
          }
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plots',
          filter: `project_id=eq.${id}`
        },
        (payload) => {
          console.log('📡 Plots change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['plots', id] });
          queryClient.invalidateQueries({ queryKey: ['project-progress', id] });
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
          filter: `project_id=eq.${id}`
        },
        (payload) => {
          console.log('📡 Team members change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['team-members', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient, toast]);

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async (): Promise<Project> => {
      if (!id) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch plots/units
  const { data: plots = [], isLoading: plotsLoading } = useQuery({
    queryKey: ['plots', id],
    queryFn: async (): Promise<Plot[]> => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('plots')
        .select('*')
        .eq('project_id', id)
        .order('plot_sequence_order');

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
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
    queryKey: ['team-members', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('project_id', id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch project progress
  const { data: progressData } = useQuery({
    queryKey: ['project-progress', id],
    queryFn: async (): Promise<ProgressData | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .rpc('get_project_progress', { project_id_param: id });

      if (error) throw error;
      return data as unknown as ProgressData;
    },
    enabled: !!id,
  });

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Project not found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/projects/dashboard')}
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

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
            projectId={id!}
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
            projectId={id!}
            teamMembers={teamMembers as any}
            isLoading={teamLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};