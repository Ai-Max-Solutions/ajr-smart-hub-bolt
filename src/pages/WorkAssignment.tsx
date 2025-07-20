import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, ArrowRight, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  _count?: {
    plots: number;
    unit_work_assignments: number;
  };
}

const WorkAssignment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status
        `)
        .eq('status', 'Active')
        .order('name');

      if (error) throw error;

      // Get counts separately for each project
      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project) => {
          const [plotsResult, assignmentsResult] = await Promise.all([
            supabase
              .from('plots')
              .select('id', { count: 'exact' })
              .eq('project_id', project.id),
            supabase
              .from('unit_work_assignments')
              .select('id', { count: 'exact' })
              .in('plot_id', 
                await supabase
                  .from('plots')
                  .select('id')
                  .eq('project_id', project.id)
                  .then(res => res.data?.map(p => p.id) || [])
              )
          ]);

          return {
            ...project,
            _count: {
              plots: plotsResult.count || 0,
              unit_work_assignments: assignmentsResult.count || 0
            }
          };
        })
      );

      setProjects(projectsWithCounts);

    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    navigate(`/projects/${projectId}/units`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Work Assignment</h1>
        <p className="text-muted-foreground">
          Select a project to manage work assignments for units and tasks.
        </p>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Projects</h3>
              <p className="text-muted-foreground mb-4">
                There are no active projects available for work assignment.
              </p>
              <Button onClick={() => navigate('/projects')}>
                View All Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  Project work assignment management
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Units:</span>
                    <span className="font-medium">{project._count?.plots || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assignments:</span>
                    <span className="font-medium">{project._count?.unit_work_assignments || 0}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => handleProjectSelect(project.id)}
                  className="w-full group-hover:translate-x-1 transition-transform"
                >
                  Manage Assignments
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" onClick={() => navigate('/operative/work')}>
              View My Work
            </Button>
            <Button variant="outline" onClick={() => navigate('/projects')}>
              All Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkAssignment;