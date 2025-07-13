import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  ChevronRight
} from 'lucide-react';
import PlotDetailsCard from './PlotDetailsCard';

interface Plot {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'on-hold';
  assignedTo?: string;
  completedDate?: string;
}

interface Level {
  id: string;
  name: string;
  plots: string[];
}

interface LevelsAndPlotsProps {
  projectId: string;
  levels: Level[];
}

// Mock expanded plot data
const mockPlotsData: Record<string, Plot> = {
  'B01': { id: 'B01', name: 'B01', status: 'completed', assignedTo: 'John Smith', completedDate: '2024-01-15' },
  'B02': { id: 'B02', name: 'B02', status: 'completed', assignedTo: 'Mike Jones', completedDate: '2024-01-16' },
  'B03': { id: 'B03', name: 'B03', status: 'in-progress', assignedTo: 'Sarah Wilson' },
  'B04': { id: 'B04', name: 'B04', status: 'pending' },
  'B05': { id: 'B05', name: 'B05', status: 'pending' },
  'B06': { id: 'B06', name: 'B06', status: 'on-hold', assignedTo: 'Tom Brown' },
  'G01': { id: 'G01', name: 'G01', status: 'completed', assignedTo: 'Emma Davis', completedDate: '2024-01-18' },
  'G02': { id: 'G02', name: 'G02', status: 'completed', assignedTo: 'Luke Taylor', completedDate: '2024-01-19' },
  'G03': { id: 'G03', name: 'G03', status: 'completed', assignedTo: 'Anna Clark', completedDate: '2024-01-20' },
  'G04': { id: 'G04', name: 'G04', status: 'in-progress', assignedTo: 'Chris White' },
  'G05': { id: 'G05', name: 'G05', status: 'in-progress', assignedTo: 'Jenny Brown' },
  'G06': { id: 'G06', name: 'G06', status: 'pending' },
  'G07': { id: 'G07', name: 'G07', status: 'pending' },
  'G08': { id: 'G08', name: 'G08', status: 'pending' },
  'F01': { id: 'F01', name: 'F01', status: 'completed', assignedTo: 'David Miller', completedDate: '2024-01-21' },
  'F02': { id: 'F02', name: 'F02', status: 'completed', assignedTo: 'Lisa Johnson', completedDate: '2024-01-22' },
  'F03': { id: 'F03', name: 'F03', status: 'completed', assignedTo: 'Mark Wilson', completedDate: '2024-01-23' },
  'F04': { id: 'F04', name: 'F04', status: 'in-progress', assignedTo: 'Sophie Davis' },
  'F05': { id: 'F05', name: 'F05', status: 'pending' },
  'F06': { id: 'F06', name: 'F06', status: 'pending' },
  'F07': { id: 'F07', name: 'F07', status: 'pending' },
  'F08': { id: 'F08', name: 'F08', status: 'pending' },
  'S01': { id: 'S01', name: 'S01', status: 'pending' },
  'S02': { id: 'S02', name: 'S02', status: 'pending' }
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
                      {levels.map((level) => (
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
        {levels.map((level) => {
          const plots = level.plots.map(plotId => mockPlotsData[plotId] || { id: plotId, name: plotId, status: 'pending' as const });
          const completedPlots = plots.filter(p => p.status === 'completed').length;
          const completionPercentage = Math.round((completedPlots / plots.length) * 100);
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
                      {plots.map((plot) => (
                        <Card 
                          key={plot.id} 
                          className="card-hover cursor-pointer"
                          onClick={() => handlePlotClick(plot)}
                        >
                          <CardContent className="pt-4 pb-4">
                            <div className="text-center space-y-2">
                              <div className="flex items-center justify-center space-x-2">
                                {getStatusIcon(plot.status)}
                                <span className="font-medium">{plot.name}</span>
                              </div>
                              
                              {getStatusBadge(plot.status)}
                              
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
              ...selectedPlot,
              level: levels.find(level => level.plots.includes(selectedPlot.id))?.name || 'Unknown Level',
              workCategories: ['1st Fix', '2nd Fix'],
              estimatedCompletion: '2024-02-15',
              notes: 'Standard electrical installation work'
            }}
            userRole="pm"
            onClose={() => setSelectedPlot(null)}
          />
        </div>
      )}

      {levels.length === 0 && (
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