import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Building2, Home, Edit2, Check, X, UserCheck, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  client: string;
  code: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface ProgressData {
  total_plots: number;
  handed_over_plots: number;
  progress_percentage: number;
}

interface ProjectDetailsTabProps {
  project: Project;
  progressData: ProgressData | null;
  totalPlots: number;
  handedOverCount: number;
}

export const ProjectDetailsTab: React.FC<ProjectDetailsTabProps> = ({
  project,
  progressData,
  totalPlots,
  handedOverCount
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name,
    client: project.client,
    code: project.code,
    start_date: project.start_date,
    end_date: project.end_date,
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', project.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      setIsEditing(false);
      toast({
        title: "Project Updated",
        description: "Project details have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.name.trim() || !formData.client.trim() || !formData.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Name, client, and code are required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      toast({
        title: "Validation Error",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    updateProjectMutation.mutate({
      name: formData.name,
      client: formData.client,
      code: formData.code,
      start_date: formData.start_date,
      end_date: formData.end_date,
    });
  };

  const handleCancel = () => {
    setFormData({
      name: project.name,
      client: project.client,
      code: project.code,
      start_date: project.start_date,
      end_date: project.end_date,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Project Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Project Information
          </CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={updateProjectMutation.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  placeholder="Enter client name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Project Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Enter project code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Project Name</Label>
                  <p className="font-medium">{project.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Client</Label>
                  <p className="font-medium">{project.client}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Project Code</Label>
                  <Badge variant="outline">{project.code}</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{format(new Date(project.start_date), 'PPP')}</p>
                </div>
                {project.end_date && (
                  <div>
                    <Label className="text-sm text-muted-foreground">End Date</Label>
                    <p className="font-medium">{format(new Date(project.end_date), 'PPP')}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-muted-foreground">Created</Label>
                  <p className="font-medium">{format(new Date(project.created_at), 'PPP')}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Work Assignment Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <h4 className="font-medium">Assign Work to Units</h4>
              <p className="text-sm text-muted-foreground">
                Efficiently assign tasks and manage workload across {totalPlots} units
              </p>
            </div>
            <Button
              onClick={() => navigate(`/projects/${projectId}/units`)}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Open Work Assignment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">
                  {project.end_date ? 
                    `${Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))} days` 
                    : 'Ongoing'
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Days Elapsed</p>
                <p className="text-sm font-medium">
                  {Math.ceil((new Date().getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Overview</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Total Units:</span>
                <span className="text-sm font-medium">{totalPlots}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Handed Over:</span>
                <span className="text-sm font-medium text-green-600">{handedOverCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Remaining:</span>
                <span className="text-sm font-medium text-blue-600">{totalPlots - handedOverCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Completion</span>
                <span className="text-sm font-medium">
                  {progressData?.progress_percentage || 0}%
                </span>
              </div>
              <Progress value={progressData?.progress_percentage || 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {handedOverCount} of {totalPlots} units completed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
