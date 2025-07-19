import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Layers3, 
  Home, 
  CheckCircle2, 
  Clock, 
  Users, 
  Search,
  Filter,
  BarChart3,
  Settings,
  AlertTriangle
} from 'lucide-react';

interface ProjectBlock {
  id: string;
  code: string;
  name: string;
  description: string;
  sequence_order: number;
}

interface ProjectLevel {
  id: string;
  block_id: string;
  code: string;
  name: string;
  level_number: number;
  level_type: string;
}

interface Plot {
  id: string;
  block_id: string;
  level_id: string;
  code: string;
  composite_code: string;
  name: string;
  unit_type: string;
  status: string;
}

interface PlotTask {
  id: string;
  plot_id: string;
  task_catalog_id: string;
  status: string;
  actual_hours: number;
  assigned_to: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  requires_test: boolean;
  test_completed: boolean;
  task_catalog: {
    name: string;
    category: string;
    estimated_hours: number;
  };
}

export const ProjectDetailsEnhanced: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch blocks
  const { data: blocks = [] } = useQuery({
    queryKey: ['project-blocks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_blocks')
        .select('*')
        .eq('project_id', projectId)
        .order('sequence_order');
      
      if (error) throw error;
      return data as ProjectBlock[];
    },
    enabled: !!projectId,
  });

  // Fetch levels
  const { data: levels = [] } = useQuery({
    queryKey: ['project-levels', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_levels')
        .select('*')
        .eq('project_id', projectId)
        .order('level_number');
      
      if (error) throw error;
      return data as ProjectLevel[];
    },
    enabled: !!projectId,
  });

  // Fetch plots
  const { data: plots = [] } = useQuery({
    queryKey: ['project-plots', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plots')
        .select('*')
        .eq('project_id', projectId)
        .order('composite_code');
      
      if (error) throw error;
      return data as Plot[];
    },
    enabled: !!projectId,
  });

  // Fetch plot tasks
  const { data: plotTasks = [] } = useQuery({
    queryKey: ['plot-tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plot_tasks')
        .select(`
          *,
          task_catalog (
            name,
            category,
            estimated_hours
          )
        `)
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data as PlotTask[];
    },
    enabled: !!projectId,
  });

  // Filter plots based on selections
  const filteredPlots = plots.filter(plot => {
    const matchesBlock = selectedBlock === 'all' || plot.block_id === selectedBlock;
    const matchesLevel = selectedLevel === 'all' || plot.level_id === selectedLevel;
    const matchesStatus = statusFilter === 'all' || plot.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      plot.composite_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesBlock && matchesLevel && matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalPlots = plots.length;
  const completedPlots = plots.filter(p => p.status === 'Complete').length;
  const inProgressPlots = plots.filter(p => p.status === 'In Progress').length;
  const completionPercentage = totalPlots > 0 ? Math.round((completedPlots / totalPlots) * 100) : 0;

  const totalTasks = plotTasks.length;
  const completedTasks = plotTasks.filter(t => t.status === 'Complete').length;
  const taskCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete': return 'default';
      case 'In Progress': return 'secondary';
      case 'On Hold': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Complete': return <CheckCircle2 className="w-4 h-4" />;
      case 'In Progress': return <Clock className="w-4 h-4" />;
      case 'On Hold': return <AlertTriangle className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  // Get levels for selected block
  const availableLevels = selectedBlock === 'all' 
    ? levels 
    : levels.filter(level => level.block_id === selectedBlock);

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{project?.name}</h1>
          <p className="text-muted-foreground">{project?.client}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{project?.code}</Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Project Settings
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{blocks.length}</p>
                <p className="text-xs text-muted-foreground">Blocks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Layers3 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{levels.length}</p>
                <p className="text-xs text-muted-foreground">Levels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalPlots}</p>
                <p className="text-xs text-muted-foreground">Units</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{completionPercentage}%</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Unit Completion</span>
                <span className="text-sm text-muted-foreground">{completedPlots}/{totalPlots}</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Task Completion</span>
                <span className="text-sm text-muted-foreground">{completedTasks}/{totalTasks}</span>
              </div>
              <Progress value={taskCompletionPercentage} className="h-2" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completedPlots}</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{inProgressPlots}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{totalPlots - completedPlots - inProgressPlots}</p>
              <p className="text-xs text-muted-foreground">Not Started</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="units" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search units..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Blocks</SelectItem>
                    {blocks.map((block) => (
                      <SelectItem key={block.id} value={block.id}>
                        {block.code} - {block.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {availableLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.code} - {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setSelectedBlock('all');
                  setSelectedLevel('all');
                  setStatusFilter('all');
                }}>
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Units Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlots.map((plot) => {
              const plotTasksForUnit = plotTasks.filter(task => task.plot_id === plot.id);
              const completedTasksForUnit = plotTasksForUnit.filter(task => task.status === 'Complete');
              const unitProgress = plotTasksForUnit.length > 0 
                ? Math.round((completedTasksForUnit.length / plotTasksForUnit.length) * 100) 
                : 0;

              return (
                <Card key={plot.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {plot.composite_code}
                        </Badge>
                        <Badge variant={getStatusColor(plot.status)} className="text-xs">
                          {getStatusIcon(plot.status)}
                          <span className="ml-1">{plot.status}</span>
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{plot.name}</h4>
                      <p className="text-xs text-muted-foreground">{plot.unit_type}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Progress</span>
                        <span className="text-xs font-medium">{unitProgress}%</span>
                      </div>
                      <Progress value={unitProgress} className="h-1" />
                      
                      <div className="text-xs text-muted-foreground">
                        {completedTasksForUnit.length}/{plotTasksForUnit.length} tasks complete
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredPlots.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No units match your current filters
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blocks.map((block) => {
              const blockLevels = levels.filter(level => level.block_id === block.id);
              const blockPlots = plots.filter(plot => plot.block_id === block.id);
              const completedBlockPlots = blockPlots.filter(plot => plot.status === 'Complete');
              const blockProgress = blockPlots.length > 0 
                ? Math.round((completedBlockPlots.length / blockPlots.length) * 100) 
                : 0;

              return (
                <Card key={block.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{block.code}</CardTitle>
                        <p className="text-sm text-muted-foreground">{block.name}</p>
                      </div>
                      <Badge variant="outline">{blockProgress}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Levels:</span>
                        <p className="font-medium">{blockLevels.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Units:</span>
                        <p className="font-medium">{blockPlots.length}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Completion</span>
                        <span className="text-sm">{completedBlockPlots.length}/{blockPlots.length}</span>
                      </div>
                      <Progress value={blockProgress} />
                    </div>

                    {block.description && (
                      <p className="text-xs text-muted-foreground">{block.description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalTasks}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {plotTasks.filter(t => t.status === 'In Progress').length}
                  </p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">
                    {plotTasks.filter(t => t.status === 'Not Started').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Not Started</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(plotTasks.map(task => task.task_catalog?.category))).map((category) => {
              const categoryTasks = plotTasks.filter(task => task.task_catalog?.category === category);
              const categoryCompleted = categoryTasks.filter(task => task.status === 'Complete');
              const categoryProgress = categoryTasks.length > 0 
                ? Math.round((categoryCompleted.length / categoryTasks.length) * 100) 
                : 0;

              return (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Progress</span>
                        <span className="text-xs font-medium">{categoryProgress}%</span>
                      </div>
                      <Progress value={categoryProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {categoryCompleted.length}/{categoryTasks.length} tasks complete
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed project reports and analytics coming soon! 📊
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};