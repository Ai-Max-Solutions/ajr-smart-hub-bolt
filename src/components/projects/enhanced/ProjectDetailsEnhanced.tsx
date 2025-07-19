
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Building2, 
  Calendar, 
  ArrowLeft, 
  ChevronDown, 
  ChevronRight,
  Layers3,
  Home,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  client: string;
  code: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Block {
  id: string;
  code: string;
  name: string;
  description: string;
  sequence_order: number;
}

interface Level {
  id: string;
  code: string;
  name: string;
  level_number: number;
  level_type: string;
  sequence_order: number;
}

interface Plot {
  id: string;
  code: string;
  name: string;
  unit_type: string;
  status: string;
  composite_code: string;
  sequence_order: number;
}

interface HierarchicalData {
  project: Project;
  blocks: Array<Block & {
    levels: Array<Level & {
      plots: Plot[];
    }>;
  }>;
}

export const ProjectDetailsEnhanced: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: projectData, isLoading, error } = useQuery({
    queryKey: ['project-hierarchy', id],
    queryFn: async (): Promise<HierarchicalData> => {
      if (!id) throw new Error('Project ID is required');
      
      console.log('🔍 Fetching project hierarchy for:', id);

      // First, get the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) {
        console.error('💥 Failed to fetch project:', projectError);
        throw new Error(`Project not found: ${projectError.message}`);
      }

      console.log('✅ Project found:', project.name);

      // Get blocks for this project
      const { data: blocks, error: blocksError } = await supabase
        .from('project_blocks')
        .select('*')
        .eq('project_id', id)
        .order('sequence_order');

      if (blocksError) {
        console.error('💥 Failed to fetch blocks:', blocksError);
        throw new Error(`Blocks fetch failed: ${blocksError.message}`);
      }

      console.log(`📦 Found ${blocks?.length || 0} blocks`);

      if (!blocks || blocks.length === 0) {
        console.log('📋 No blocks found, returning project with empty structure');
        return { project, blocks: [] };
      }

      // Get levels and plots for each block
      const hierarchicalBlocks = [];
      for (const block of blocks) {
        console.log(`🔍 Fetching levels for block: ${block.code}`);
        
        const { data: levels, error: levelsError } = await supabase
          .from('project_levels')
          .select('*')
          .eq('block_id', block.id)
          .order('sequence_order');

        if (levelsError) {
          console.error(`💥 Failed to fetch levels for block ${block.code}:`, levelsError);
          continue;
        }

        console.log(`📐 Found ${levels?.length || 0} levels for block ${block.code}`);

        const hierarchicalLevels = [];
        for (const level of levels || []) {
          console.log(`🔍 Fetching plots for level: ${level.code}`);
          
          const { data: plots, error: plotsError } = await supabase
            .from('plots')
            .select('*')
            .eq('level_id', level.id)
            .order('sequence_order');

          if (plotsError) {
            console.error(`💥 Failed to fetch plots for level ${level.code}:`, plotsError);
            continue;
          }

          console.log(`🏠 Found ${plots?.length || 0} plots for level ${level.code}`);

          hierarchicalLevels.push({
            ...level,
            plots: plots || []
          });
        }

        hierarchicalBlocks.push({
          ...block,
          levels: hierarchicalLevels
        });
      }

      console.log('✅ Hierarchical data assembled successfully');
      return { project, blocks: hierarchicalBlocks };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {projectData?.blocks?.length === 0 
              ? "No blocks yet—time to build? 🏗️" 
              : "Project not found"}
          </p>
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

  const { project, blocks } = projectData;
  const totalLevels = blocks.reduce((sum, block) => sum + block.levels.length, 0);
  const totalPlots = blocks.reduce((sum, block) => 
    sum + block.levels.reduce((levelSum, level) => levelSum + level.plots.length, 0), 0
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'in progress':
        return 'text-blue-600';
      case 'not started':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'not started':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {project.name}
          </h1>
          <p className="text-muted-foreground">{project.client}</p>
        </div>
        <div className="ml-auto">
          <Badge variant="outline">{project.code}</Badge>
        </div>
      </div>

      {/* Project Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium">
                  {format(new Date(project.start_date), 'PPP')}
                </p>
              </div>
              {project.end_date && (
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="text-sm font-medium">
                    {format(new Date(project.end_date), 'PPP')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Structure</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Blocks:</span>
                <span className="text-sm font-medium">{blocks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Levels:</span>
                <span className="text-sm font-medium">{totalLevels}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Units:</span>
                <span className="text-sm font-medium">{totalPlots}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Completed:</span>
                <span className="text-sm font-medium text-green-600">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">In Progress:</span>
                <span className="text-sm font-medium text-blue-600">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Not Started:</span>
                <span className="text-sm font-medium text-gray-600">{totalPlots}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers3 className="w-5 h-5 mr-2 text-primary" />
            Project Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blocks.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No blocks yet—time to build? 🏗️</p>
              <Button 
                variant="outline"
                onClick={() => navigate('/projects/setup')}
              >
                Add Structure
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block) => (
                <Collapsible key={block.id} className="border rounded-lg">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <ChevronRight className="w-4 h-4" />
                      <Badge variant="outline">{block.code}</Badge>
                      <div className="text-left">
                        <h3 className="font-medium">{block.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {block.levels.length} levels, {block.levels.reduce((sum, level) => sum + level.plots.length, 0)} units
                        </p>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="space-y-3 ml-7">
                      {block.levels.map((level) => (
                        <Collapsible key={level.id} className="border-l-2 border-muted pl-4">
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/30 rounded">
                            <div className="flex items-center space-x-3">
                              <ChevronDown className="w-3 h-3" />
                              <Badge variant="secondary" className="text-xs">{level.code}</Badge>
                              <div className="text-left">
                                <h4 className="text-sm font-medium">{level.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {level.level_type} • {level.plots.length} units
                                </p>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ml-6">
                              {level.plots.map((plot) => (
                                <div 
                                  key={plot.id} 
                                  className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                                >
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(plot.status)}
                                    <span className="font-mono">{plot.composite_code || `${block.code}-${level.code}-${plot.code}`}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {plot.unit_type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
