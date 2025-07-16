import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Building, 
  Home, 
  Edit, 
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import PlotDetailsCard from './PlotDetailsCard';

interface Plot {
  id: string;
  plotnumber: string;
  plotstatus: string;
  completion_percentage: number;
  plannedhandoverdate: string;
  actualhandoverdate: string;
  plotnotes: string;
  level: string;
  // Additional properties for PlotDetailsCard compatibility
  assignedTo?: string;
  completedDate?: string;
}

interface Level {
  id: string;
  levelname: string;
  levelnumber: number;
  levelstatus: string;
  block: string;
}

interface LevelsAndPlotsProps {
  projectId: string;
  levels?: any[];
}

// Mock expanded plot data using correct property names
const mockPlotsData: Record<string, Plot> = {
  'B01': { 
    id: 'plot-b01', 
    plotnumber: 'B01', 
    plotstatus: 'completed', 
    completion_percentage: 100,
    plannedhandoverdate: '2024-01-15',
    actualhandoverdate: '2024-01-15',
    plotnotes: 'Completed on schedule',
    level: 'basement',
    assignedTo: 'John Smith', 
    completedDate: '2024-01-15' 
  },
  'B02': { 
    id: 'plot-b02', 
    plotnumber: 'B02', 
    plotstatus: 'completed', 
    completion_percentage: 100,
    plannedhandoverdate: '2024-01-16',
    actualhandoverdate: '2024-01-16',
    plotnotes: 'Completed on schedule',
    level: 'basement',
    assignedTo: 'Mike Jones', 
    completedDate: '2024-01-16' 
  },
  'B03': { 
    id: 'plot-b03', 
    plotnumber: 'B03', 
    plotstatus: 'in-progress', 
    completion_percentage: 65,
    plannedhandoverdate: '2024-02-01',
    actualhandoverdate: '',
    plotnotes: 'In progress',
    level: 'basement',
    assignedTo: 'Sarah Wilson' 
  },
  'B04': { 
    id: 'plot-b04', 
    plotnumber: 'B04', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-02-15',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'basement'
  },
  'B05': { 
    id: 'plot-b05', 
    plotnumber: 'B05', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-02-20',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'basement'
  },
  'B06': { 
    id: 'plot-b06', 
    plotnumber: 'B06', 
    plotstatus: 'on-hold', 
    completion_percentage: 30,
    plannedhandoverdate: '2024-03-01',
    actualhandoverdate: '',
    plotnotes: 'On hold pending materials',
    level: 'basement',
    assignedTo: 'Tom Brown' 
  },
  'G01': { 
    id: 'plot-g01', 
    plotnumber: 'G01', 
    plotstatus: 'completed', 
    completion_percentage: 100,
    plannedhandoverdate: '2024-01-18',
    actualhandoverdate: '2024-01-18',
    plotnotes: 'Completed on schedule',
    level: 'ground',
    assignedTo: 'Emma Davis', 
    completedDate: '2024-01-18' 
  },
  'G02': { 
    id: 'plot-g02', 
    plotnumber: 'G02', 
    plotstatus: 'completed', 
    completion_percentage: 100,
    plannedhandoverdate: '2024-01-19',
    actualhandoverdate: '2024-01-19',
    plotnotes: 'Completed on schedule',
    level: 'ground',
    assignedTo: 'Luke Taylor', 
    completedDate: '2024-01-19' 
  },
  'G03': { 
    id: 'plot-g03', 
    plotnumber: 'G03', 
    plotstatus: 'completed', 
    completion_percentage: 100,
    plannedhandoverdate: '2024-01-20',
    actualhandoverdate: '2024-01-20',
    plotnotes: 'Completed on schedule',
    level: 'ground',
    assignedTo: 'Anna Clark', 
    completedDate: '2024-01-20' 
  },
  'G04': { 
    id: 'plot-g04', 
    plotnumber: 'G04', 
    plotstatus: 'in-progress', 
    completion_percentage: 80,
    plannedhandoverdate: '2024-02-05',
    actualhandoverdate: '',
    plotnotes: 'Nearly complete',
    level: 'ground',
    assignedTo: 'Chris White' 
  },
  'G05': { 
    id: 'plot-g05', 
    plotnumber: 'G05', 
    plotstatus: 'in-progress', 
    completion_percentage: 45,
    plannedhandoverdate: '2024-02-10',
    actualhandoverdate: '',
    plotnotes: 'In progress',
    level: 'ground',
    assignedTo: 'Jenny Brown' 
  },
  'G06': { 
    id: 'plot-g06', 
    plotnumber: 'G06', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-02-25',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'ground'
  },
  'G07': { 
    id: 'plot-g07', 
    plotnumber: 'G07', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-03-05',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'ground'
  },
  'G08': { 
    id: 'plot-g08', 
    plotnumber: 'G08', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-03-10',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'ground'
  },
  'F01': { 
    id: 'plot-f01', 
    plotnumber: 'F01', 
    plotstatus: 'completed', 
    completion_percentage: 100,
    plannedhandoverdate: '2024-01-21',
    actualhandoverdate: '2024-01-21',
    plotnotes: 'Completed on schedule',
    level: 'first',
    assignedTo: 'David Miller', 
    completedDate: '2024-01-21' 
  },
  'F02': { 
    id: 'plot-f02', 
    plotnumber: 'F02', 
    plotstatus: 'completed', 
    completion_percentage: 100,
    plannedhandoverdate: '2024-01-22',
    actualhandoverdate: '2024-01-22',
    plotnotes: 'Completed on schedule',
    level: 'first',
    assignedTo: 'Lisa Johnson', 
    completedDate: '2024-01-22' 
  },
  'F03': { 
    id: 'plot-f03', 
    plotnumber: 'F03', 
    plotstatus: 'completed', 
    completion_percentage: 100,
    plannedhandoverdate: '2024-01-23',
    actualhandoverdate: '2024-01-23',
    plotnotes: 'Completed on schedule',
    level: 'first',
    assignedTo: 'Mark Wilson', 
    completedDate: '2024-01-23' 
  },
  'F04': { 
    id: 'plot-f04', 
    plotnumber: 'F04', 
    plotstatus: 'in-progress', 
    completion_percentage: 70,
    plannedhandoverdate: '2024-02-12',
    actualhandoverdate: '',
    plotnotes: 'In progress',
    level: 'first',
    assignedTo: 'Sophie Davis' 
  },
  'F05': { 
    id: 'plot-f05', 
    plotnumber: 'F05', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-03-01',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'first'
  },
  'F06': { 
    id: 'plot-f06', 
    plotnumber: 'F06', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-03-15',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'first'
  },
  'F07': { 
    id: 'plot-f07', 
    plotnumber: 'F07', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-03-20',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'first'
  },
  'F08': { 
    id: 'plot-f08', 
    plotnumber: 'F08', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-03-25',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'first'
  },
  'S01': { 
    id: 'plot-s01', 
    plotnumber: 'S01', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-04-01',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'second'
  },
  'S02': { 
    id: 'plot-s02', 
    plotnumber: 'S02', 
    plotstatus: 'pending', 
    completion_percentage: 0,
    plannedhandoverdate: '2024-04-05',
    actualhandoverdate: '',
    plotnotes: 'Awaiting start',
    level: 'second'
  }
};

const LevelsAndPlots = ({ projectId, levels }: LevelsAndPlotsProps) => {
  const [isAddingLevel, setIsAddingLevel] = useState(false);
  const [isAddingPlot, setIsAddingPlot] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [newLevelName, setNewLevelName] = useState('');
  const [newPlotName, setNewPlotName] = useState('');
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({});
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-warning text-warning-foreground"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'on-hold':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />On Hold</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'on-hold':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <div className="w-4 h-4 border-2 border-muted-foreground rounded-full" />;
    }
  };

  const handleAddLevel = () => {
    if (!newLevelName.trim()) return;
    
    toast({
      title: "Level Added",
      description: `${newLevelName} has been added successfully.`,
    });
    
    setNewLevelName('');
    setIsAddingLevel(false);
  };

  const handleAddPlot = () => {
    if (!newPlotName.trim() || !selectedLevel) return;
    
    toast({
      title: "Plot Added",
      description: `${newPlotName} has been added to the selected level.`,
    });
    
    setNewPlotName('');
    setSelectedLevel('');
    setIsAddingPlot(false);
  };

  const toggleLevel = (levelId: string) => {
    setExpandedLevels(prev => ({
      ...prev,
      [levelId]: !prev[levelId]
    }));
  };

  const handlePlotClick = (plot: Plot) => {
    setSelectedPlot(plot);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Levels & Plots Management</h2>
          <p className="text-muted-foreground">Organize your project by levels and individual plots</p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={isAddingLevel} onOpenChange={setIsAddingLevel}>
            <DialogTrigger asChild>
              <Button className="btn-accent">
                <Plus className="w-4 h-4 mr-2" />
                Add Level
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Level</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="levelName">Level Name</Label>
                  <Input
                    id="levelName"
                    placeholder="e.g. Third Floor, Roof Level"
                    value={newLevelName}
                    onChange={(e) => setNewLevelName(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingLevel(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddLevel} className="btn-primary">
                    Add Level
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddingPlot} onOpenChange={setIsAddingPlot}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Plot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Plot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="levelSelect">Select Level</Label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels?.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="plotName">Plot Name/Number</Label>
                  <Input
                    id="plotName"
                    placeholder="e.g. G09, F09, S03"
                    value={newPlotName}
                    onChange={(e) => setNewPlotName(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingPlot(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPlot} className="btn-primary">
                    Add Plot
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Levels and Plots Tree Structure */}
      <div className="space-y-4">
        {levels?.map((level) => {
          const plots = level.plots?.map((plotId: string) => mockPlotsData[plotId] || { 
            id: `plot-${plotId}`, 
            plotnumber: plotId, 
            plotstatus: 'pending',
            completion_percentage: 0,
            plannedhandoverdate: '',
            actualhandoverdate: '',
            plotnotes: '',
            level: level.name
          }) || [];
          const completedPlots = plots.filter((p: Plot) => p.plotstatus === 'completed').length;
          const completionPercentage = plots.length > 0 ? Math.round((completedPlots / plots.length) * 100) : 0;
          const isExpanded = expandedLevels[level.id] ?? true;
          
          return (
            <Card key={level.id} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleLevel(level.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="bg-muted/30 cursor-pointer hover:bg-muted/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                        <Building className="w-5 h-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{level.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {plots.length} plots • {completedPlots} completed ({completionPercentage}%)
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {plots.map((plot: Plot) => (
                        <Card 
                          key={plot.id} 
                          className="card-hover cursor-pointer"
                          onClick={() => handlePlotClick(plot)}
                        >
                          <CardContent className="pt-4 pb-4">
                            <div className="text-center space-y-2">
                              <div className="flex items-center justify-center space-x-2">
                                {getStatusIcon(plot.plotstatus)}
                                <span className="font-medium">{plot.plotnumber}</span>
                              </div>
                              
                              {getStatusBadge(plot.plotstatus)}
                              
                              {plot.assignedTo && (
                                <p className="text-xs text-muted-foreground">{plot.assignedTo}</p>
                              )}
                              
                              {plot.completedDate && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(plot.completedDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Plot Details Modal */}
      {selectedPlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <PlotDetailsCard 
            plot={{
              id: selectedPlot.id,
              name: selectedPlot.plotnumber,
              status: selectedPlot.plotstatus as "completed" | "in-progress" | "pending" | "on-hold",
              level: levels?.find(level => level.plots?.includes(selectedPlot.plotnumber))?.name || 'Unknown Level',
              workCategories: ['1st Fix', '2nd Fix'],
              estimatedCompletion: '2024-02-15',
              notes: selectedPlot.plotnotes || 'Standard electrical installation work'
            }}
            userRole="pm"
            onClose={() => setSelectedPlot(null)}
          />
        </div>
      )}

      {(!levels || levels.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No levels added yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding your first level to organize your project</p>
            <Button onClick={() => setIsAddingLevel(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add First Level
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LevelsAndPlots;
