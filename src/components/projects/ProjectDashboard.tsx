
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  projectname: string;
  clientname: string;
  siteaddress: string;
  status: string;
  startdate: string;
  plannedenddate: string;
  projectvalue: number;
  totalplots: number;
  completeddeliveries: number;
  pendingdeliveries: number;
  projectmanager: string;
}

export const ProjectDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map database columns to expected Project interface
      return data?.map(project => ({
        id: project.id,
        projectname: project.name,
        clientname: project.client,
        siteaddress: '',
        status: 'In Progress',
        startdate: project.start_date,
        plannedenddate: project.end_date,
        projectvalue: 0,
        totalplots: 0,
        completeddeliveries: 0,
        pendingdeliveries: 0,
        projectmanager: ''
      })) as Project[] || [];
    },
  });

  // Filter projects based on search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.projectname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.clientname?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'on hold':
        return 'destructive';
      case 'planning':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getProjectProgress = (project: Project) => {
    if (!project.totalplots || project.totalplots === 0) return 0;
    return Math.round((project.completeddeliveries / project.totalplots) * 100);
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
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
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
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {project.projectname || 'Untitled Project'}
                    </CardTitle>
                    <CardDescription>
                      {project.clientname || 'Unknown Client'}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(project.status)}>
                    {project.status || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                {project.totalplots > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{getProjectProgress(project)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-ajryan-yellow h-2 rounded-full transition-all"
                        style={{ width: `${getProjectProgress(project)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{project.totalplots || 0} Plots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{project.projectmanager || 'No PM'}</span>
                  </div>
                  {project.startdate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(project.startdate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {project.pendingdeliveries > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>{project.pendingdeliveries} Pending</span>
                    </div>
                  )}
                </div>

                {/* Project Value */}
                {project.projectvalue && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Project Value</p>
                    <p className="font-semibold">
                      £{project.projectvalue.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Location */}
                {project.siteaddress && (
                  <div className="text-sm text-muted-foreground">
                    <p className="line-clamp-2">{project.siteaddress}</p>
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
