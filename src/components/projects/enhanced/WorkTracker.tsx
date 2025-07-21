
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EnhancedTable, ColumnDef } from '@/components/ui/enhanced-table';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Building2,
  Users,
  Target,
  TrendingUp
} from 'lucide-react';

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
  completion_percentage?: number;
  assigned_team?: string[];
  work_types?: string[];
  due_date?: string;
  overdue?: boolean;
}

interface WorkTrackerProps {
  projectId: string;
  plots: Plot[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

export const WorkTracker: React.FC<WorkTrackerProps> = ({
  projectId,
  plots,
  searchQuery,
  onSearchChange,
  isLoading = false
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'compact'>('table');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const total = plots.length;
    const completed = plots.filter(p => p.handed_over).length;
    const inProgress = plots.filter(p => !p.handed_over && (p.completion_percentage || 0) > 0).length;
    const overdue = plots.filter(p => p.overdue).length;
    const avgProgress = total > 0 ? Math.round(plots.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / total) : 0;
    
    return { total, completed, inProgress, overdue, avgProgress };
  }, [plots]);

  // Filter plots based on current filters
  const filteredPlots = useMemo(() => {
    return plots.filter(plot => {
      // Search filter
      const searchMatch = !searchQuery || 
        plot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plot.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plot.composite_code.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === 'all' || 
        (statusFilter === 'completed' && plot.handed_over) ||
        (statusFilter === 'in-progress' && !plot.handed_over && (plot.completion_percentage || 0) > 0) ||
        (statusFilter === 'pending' && !plot.handed_over && (plot.completion_percentage || 0) === 0) ||
        (statusFilter === 'overdue' && plot.overdue);

      // Progress filter
      const progressMatch = progressFilter === 'all' ||
        (progressFilter === 'high' && (plot.completion_percentage || 0) >= 80) ||
        (progressFilter === 'medium' && (plot.completion_percentage || 0) >= 50 && (plot.completion_percentage || 0) < 80) ||
        (progressFilter === 'low' && (plot.completion_percentage || 0) < 50);

      return searchMatch && statusMatch && progressMatch;
    });
  }, [plots, searchQuery, statusFilter, progressFilter]);

  const getStatusBadge = (plot: Plot) => {
    if (plot.handed_over) {
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
    }
    if (plot.overdue) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
    }
    if ((plot.completion_percentage || 0) > 0) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderTeamAvatars = (team: string[] = []) => {
    if (team.length === 0) return <span className="text-muted-foreground text-sm">Unassigned</span>;
    
    return (
      <div className="flex -space-x-2">
        {team.slice(0, 3).map((member, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {member.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{member}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {team.length > 3 && (
          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
            <span className="text-xs text-muted-foreground">+{team.length - 3}</span>
          </div>
        )}
      </div>
    );
  };

  // Define table columns
  const columns: ColumnDef<Plot>[] = [
    {
      id: 'unit_code',
      header: 'Unit Code',
      accessorKey: 'composite_code',
      sortable: true,
      filterable: true,
      cell: ({ value, row }) => (
        <div className="font-medium">
          <div className="text-sm font-semibold">{value || row.code}</div>
          <div className="text-xs text-muted-foreground">{row.name}</div>
        </div>
      )
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'unit_type',
      sortable: true,
      cell: ({ value }) => (
        <Badge variant="outline" className="text-xs">
          {value || 'Residential'}
        </Badge>
      )
    },
    {
      id: 'progress',
      header: 'Progress',
      accessorKey: 'completion_percentage',
      sortable: true,
      cell: ({ value, row }) => {
        const progress = value || 0;
        return (
          <div className="w-24">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">{progress}%</span>
              {row.overdue && <AlertTriangle className="w-3 h-3 text-red-500" />}
            </div>
            <Progress 
              value={progress} 
              className="h-2"
              indicatorClassName={getProgressColor(progress)}
            />
          </div>
        );
      }
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: ({ row }) => getStatusBadge(row)
    },
    {
      id: 'team',
      header: 'Assigned Team',
      accessorKey: 'assigned_team',
      cell: ({ value }) => renderTeamAvatars(value)
    },
    {
      id: 'work_types',
      header: 'Work Types',
      accessorKey: 'work_types',
      cell: ({ value }) => {
        const types = value || [];
        if (types.length === 0) return <span className="text-muted-foreground text-sm">None</span>;
        return (
          <div className="flex gap-1 flex-wrap">
            {types.slice(0, 2).map((type: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">{type}</Badge>
            ))}
            {types.length > 2 && (
              <Badge variant="secondary" className="text-xs">+{types.length - 2}</Badge>
            )}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('View details for unit:', row.composite_code);
                    // TODO: Navigate to unit details page
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Edit unit:', row.composite_code);
                    // TODO: Open edit unit dialog
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Unit</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Assign team to unit:', row.composite_code);
                    // TODO: Open team assignment dialog
                  }}
                >
                  <UserPlus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Assign Team</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ];

  const handleExport = () => {
    console.log('Exporting work tracker data...');
    
    if (filteredPlots.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Export filtered data to CSV
    const csvData = filteredPlots.map(plot => ({
      'Unit Code': plot.composite_code || plot.code,
      'Unit Name': plot.name,
      'Type': plot.unit_type || 'Residential',
      'Progress': `${plot.completion_percentage || 0}%`,
      'Status': plot.handed_over ? 'Completed' : (plot.completion_percentage || 0) > 0 ? 'In Progress' : 'Pending',
      'Team': plot.assigned_team?.join(', ') || 'Unassigned',
      'Work Types': plot.work_types?.join(', ') || 'None',
      'Due Date': plot.due_date || 'Not set',
      'Overdue': plot.overdue ? 'Yes' : 'No'
    }));
    
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Export completed successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">{summaryMetrics.total}</span>
              </div>
              <div className="text-sm text-muted-foreground">Total Units</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{summaryMetrics.completed}</span>
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">{summaryMetrics.inProgress}</span>
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold text-red-600">{summaryMetrics.overdue}</span>
              </div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold text-primary">{summaryMetrics.avgProgress}%</span>
              </div>
              <div className="text-sm text-muted-foreground">Avg Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search units by name, code, or composite code..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={progressFilter} onValueChange={setProgressFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Progress" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Progress</SelectItem>
                  <SelectItem value="high">80-100%</SelectItem>
                  <SelectItem value="medium">50-79%</SelectItem>
                  <SelectItem value="low">0-49%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {selectedRows.length > 0 && (
                <Badge variant="secondary" className="mr-2">
                  {selectedRows.length} selected
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
                disabled={filteredPlots.length === 0}
              >
                <Download className="h-4 w-4" />
                Export ({filteredPlots.length})
              </Button>

              <Select value={viewMode} onValueChange={(value: 'table' | 'compact') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table View</SelectItem>
                  <SelectItem value="compact">Compact View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Tracker Table */}
      <EnhancedTable
        columns={columns}
        data={filteredPlots}
        title="Work Tracker"
        description={`Showing ${filteredPlots.length} of ${plots.length} units`}
        enableSelection={true}
        enablePagination={true}
        enableSorting={true}
        enableFiltering={false} // We handle filtering above
        pageSize={viewMode === 'compact' ? 25 : 15}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        emptyMessage="No units found"
        emptyDescription="Try adjusting your search or filters to find units."
        customActions={
          selectedRows.length > 0 ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  console.log('Bulk assign to selected units:', selectedRows);
                  // TODO: Open bulk assignment dialog
                }}
              >
                <UserPlus className="h-4 w-4" />
                Bulk Assign ({selectedRows.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  console.log('Mark selected units as complete:', selectedRows);
                  // TODO: Bulk status update
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Complete
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  console.log('Save current filter settings');
                  // TODO: Save filter preset
                }}
              >
                <Filter className="h-4 w-4" />
                Save Filter
              </Button>
            </div>
          )
        }
      />
    </div>
  );
};
