
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, Calendar, MapPin, Phone, Mail, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ProjectData {
  id: string;
  projectname: string;
  clientname: string;
  siteaddress: string;
  sitecontact: string;
  sitephone: string;
  status: string;
  startdate: string;
  plannedenddate: string;
  actualenddate: string;
  projectvalue: number;
  totalplots: number;
  completeddeliveries: number;
  pendingdeliveries: number;
  projectmanager: string;
  Project_Description: string;
  healthsafetystatus: string;
  budgetspent: number;
  budgetremaining: number;
}

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Project not found');
      
      // Map database columns to expected ProjectData interface
      return {
        id: data.id,
        projectname: data.name,
        clientname: data.client,
        siteaddress: '',
        sitecontact: '',
        sitephone: '',
        status: 'In Progress',
        startdate: data.start_date,
        plannedenddate: data.end_date || '',
        actualenddate: '',
        projectvalue: 0,
        totalplots: 0,
        completeddeliveries: 0,
        pendingdeliveries: 0,
        projectmanager: '',
        Project_Description: '',
        healthsafetystatus: '',
        budgetspent: 0,
        budgetremaining: 0
      } as ProjectData;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ajryan-yellow"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Project not found</p>
        </CardContent>
      </Card>
    );
  }

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

  const getProgress = () => {
    if (!project.totalplots || project.totalplots === 0) return 0;
    return Math.round((project.completeddeliveries / project.totalplots) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/projects')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-ajryan-dark">
            {project.projectname || 'Untitled Project'}
          </h1>
          <p className="text-muted-foreground">{project.clientname || 'Unknown Client'}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={getStatusColor(project.status)}>
            {project.status || 'Unknown'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Project Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Project Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.Project_Description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{project.Project_Description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Total Plots</h4>
                <p className="text-2xl font-bold text-ajryan-dark">{project.totalplots || 0}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Progress</h4>
                <p className="text-2xl font-bold text-ajryan-dark">{getProgress()}%</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Completed</h4>
                <p className="text-xl font-semibold text-green-600">{project.completeddeliveries || 0}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Pending</h4>
                <p className="text-xl font-semibold text-orange-600">{project.pendingdeliveries || 0}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{getProgress()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-ajryan-yellow h-3 rounded-full transition-all"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.startdate && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Start Date</h4>
                <p>{format(new Date(project.startdate), 'PPP')}</p>
              </div>
            )}
            {project.plannedenddate && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Planned End</h4>
                <p>{format(new Date(project.plannedenddate), 'PPP')}</p>
              </div>
            )}
            {project.actualenddate && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Actual End</h4>
                <p>{format(new Date(project.actualenddate), 'PPP')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information */}
        {project.projectvalue && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Project Value</h4>
                <p className="text-xl font-bold text-ajryan-dark">
                  £{project.projectvalue.toLocaleString()}
                </p>
              </div>
              {project.budgetspent !== null && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Budget Spent</h4>
                  <p className="text-lg font-semibold text-red-600">
                    £{project.budgetspent.toLocaleString()}
                  </p>
                </div>
              )}
              {project.budgetremaining !== null && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Budget Remaining</h4>
                  <p className="text-lg font-semibold text-green-600">
                    £{project.budgetremaining.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.projectmanager && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Project Manager</h4>
                <p>{project.projectmanager}</p>
              </div>
            )}
            {project.sitecontact && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Site Contact</h4>
                <p>{project.sitecontact}</p>
              </div>
            )}
            {project.sitephone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{project.sitephone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        {project.siteaddress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{project.siteaddress}</p>
            </CardContent>
          </Card>
        )}

        {/* Health & Safety Status */}
        {project.healthsafetystatus && (
          <Card>
            <CardHeader>
              <CardTitle>Health & Safety</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={project.healthsafetystatus === 'Compliant' ? 'default' : 'destructive'}>
                {project.healthsafetystatus}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
