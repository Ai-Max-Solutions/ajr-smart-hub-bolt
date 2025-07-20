
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Clock, AlertTriangle, Search, Filter, Bot, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { StatusDropdown } from './StatusDropdown';

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

export const ProjectDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [animatingStatuses, setAnimatingStatuses] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch projects (excluding archived)
  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Real-time subscription for project changes
  useEffect(() => {
    const channel = supabase.channel('projects-dashboard')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'projects'
        }, 
        (payload) => {
          console.log('Project change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          
          if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
            const projectId = payload.new.id;
            setAnimatingStatuses(prev => new Set(prev).add(projectId));
            
            setTimeout(() => {
              setAnimatingStatuses(prev => {
                const newSet = new Set(prev);
                newSet.delete(projectId);
                return newSet;
              });
            }, 1000);
            
            toast(`Status updated to ${payload.new.status}!`, {
              description: `${payload.new.name} is now marked as ${payload.new.status}.`
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Update project status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: Project['status'] }) => {
      const { error } = await supabase
        .from('projects')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', projectId);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast(`Status updated to ${status}!`, {
        description: status === 'Completed' ? 'Great finish, Mark!' : `Project marked as ${status}.`
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Failed to update status', {
        description: error.message
      });
    }
  });

  // AI Delay Detection mutation
  const scanDelaysMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('auto_flag_delayed_projects');
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedCount) => {
      if (updatedCount > 0) {
        toast(`Flagged ${updatedCount} delayed project${updatedCount > 1 ? 's' : ''}`, {
          description: 'Projects missing deadlines have been marked as Delayed.'
        });
      } else {
        toast('No delays detected', {
          description: 'All projects are on track—great job!'
        });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('AI scan failed', {
        description: error.message
      });
    }
  });

  // Filter projects based on search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (projectId: string, newStatus: string) => {
    updateStatusMutation.mutate({ projectId, status: newStatus as Project['status'] });
  };

  const handleAiScan = () => {
    scanDelaysMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ajryan-yellow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ajryan-dark">Project Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of all projects and their current status
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleAiScan}
            disabled={scanDelaysMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            {scanDelaysMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
            Check Delays
          </Button>
          <Button 
            onClick={() => window.location.href = '/projects/setup-wizard'}
            className="btn-primary"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Setup New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Building">Building</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' ? 'No projects match your filters' : 'No projects found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/projects/${project.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {project.name || 'Untitled Project'}
                    </CardTitle>
                    <CardDescription>
                      {project.client || 'Unknown Client'}
                    </CardDescription>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <StatusDropdown
                      value={project.status}
                      onValueChange={(newStatus) => handleStatusChange(project.id, newStatus)}
                      disabled={updateStatusMutation.isPending}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{project.code}</span>
                  </div>
                  {project.start_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(project.start_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {project.end_date && (
                    <div className="flex items-center gap-2 col-span-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span>Due: {format(new Date(project.end_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>

                {/* Status Indicator for Delayed Projects */}
                {project.status === 'Delayed' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Project may miss deadline—consider boosting the team
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
