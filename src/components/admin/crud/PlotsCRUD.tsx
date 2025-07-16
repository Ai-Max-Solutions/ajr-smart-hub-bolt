import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlotsCRUDProps {
  searchQuery: string;
  isOffline: boolean;
}

interface Plot {
  id: string;
  plotnumber: string;
  plotstatus: string;
  level: number | null;
  numberofbedrooms: number;
  numberofbathrooms: number;
  floorarea: number;
  plannedhandoverdate: string;
  actualhandoverdate: string;
  plotnotes: string;
}

export const PlotsCRUD = ({ searchQuery, isOffline }: PlotsCRUDProps) => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    plotnumber: "",
    plotstatus: "Planning",
    level: "",
    numberofbedrooms: 2,
    numberofbathrooms: 1,
    floorarea: 0,
    plannedhandoverdate: "",
    actualhandoverdate: "",
    plotnotes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Use actual plots table and mock data for non-existent tables
      const plotsRes = await supabase.from('plots').select('*').order('name');
      const usersRes = await supabase.from('users').select('id, name').order('name');
      
      // Mock data for non-existent tables
      const mockLevels = [
        { id: '1', levelname: 'Ground Floor', levelnumber: 1 },
        { id: '2', levelname: 'First Floor', levelnumber: 2 }
      ];

      // Transform plots data to match Plot interface
      const transformedPlots = (plotsRes.data || []).map(plot => ({
        id: plot.id,
        plotnumber: plot.name,
        plotstatus: 'Available',
        level: plot.level || null,
        numberofbedrooms: 3,
        numberofbathrooms: 2,
        floorarea: 100,
        plannedhandoverdate: new Date().toISOString().split('T')[0],
        actualhandoverdate: '',
        plotnotes: ''
      }));

      setPlots(transformedPlots);
      setLevels(mockLevels);
      setUsers(usersRes.data?.map(u => ({ id: u.id, name: u.name })) || []);
    } catch (error) {
      if (!isOffline) {
        toast.error("Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPlot) {
        // Mock data update
        const updatedPlot: Plot = {
          ...editingPlot,
          ...formData,
          level: formData.level ? parseInt(formData.level) : null
        };
        setPlots(plots.map(plot => 
          plot.id === editingPlot.id ? updatedPlot : plot
        ));
        toast.success("Plot updated successfully (mock data)");
      } else {
        // Mock data creation
        const newPlot: Plot = {
          id: Date.now().toString(),
          plotnumber: formData.plotnumber || 'New Plot',
          plotstatus: formData.plotstatus || 'Available',
          level: formData.level ? parseInt(formData.level) : null,
          numberofbedrooms: formData.numberofbedrooms,
          numberofbathrooms: formData.numberofbathrooms,
          floorarea: formData.floorarea,
          plannedhandoverdate: formData.plannedhandoverdate,
          actualhandoverdate: formData.actualhandoverdate,
          plotnotes: formData.plotnotes
        };

        setPlots([...plots, newPlot]);
        toast.success("Plot created successfully (mock data)");
      }

      fetchData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save plot");
    }
  };

  const handleDelete = async (plotId: string) => {
    if (!confirm("Are you sure you want to archive this plot?")) return;

    try {
      // Mock data archive
      setPlots(plots.map(plot => 
        plot.id === plotId ? { ...plot, plotstatus: 'Archived' } : plot
      ));
      toast.success("Plot archived successfully (mock data)");
    } catch (error: any) {
      toast.error(error.message || "Failed to archive plot");
    }
  };

  const resetForm = () => {
    setFormData({
      plotnumber: "",
      plotstatus: "Planning",
      level: "",
      numberofbedrooms: 2,
      numberofbathrooms: 1,
      floorarea: 0,
      plannedhandoverdate: "",
      actualhandoverdate: "",
      plotnotes: ""
    });
    setEditingPlot(null);
  };

  const openEditDialog = (plot: Plot) => {
    setEditingPlot(plot);
    setFormData({
      plotnumber: plot.plotnumber || "",
      plotstatus: plot.plotstatus || "Planning",
      level: plot.level?.toString() || "",
      numberofbedrooms: plot.numberofbedrooms || 2,
      numberofbathrooms: plot.numberofbathrooms || 1,
      floorarea: plot.floorarea || 0,
      plannedhandoverdate: plot.plannedhandoverdate || "",
      actualhandoverdate: plot.actualhandoverdate || "",
      plotnotes: plot.plotnotes || ""
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Active': 'default',
      'Planning': 'secondary',
      'Foundation': 'secondary',
      'Superstructure': 'secondary',
      'First Fix': 'secondary',
      'Second Fix': 'secondary',
      'Completed': 'default',
      'Handed Over': 'default',
      'Archived': 'destructive'
    };
    return <Badge variant={(statusColors[status as keyof typeof statusColors] || 'secondary') as "default" | "secondary" | "destructive" | "outline"}>{status}</Badge>;
  };

  const filteredPlots = plots.filter(plot =>
    plot.plotnumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plot.plotstatus?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-8">Loading plots...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{plots.filter(p => ['Foundation', 'Superstructure', 'First Fix', 'Second Fix'].includes(p.plotstatus)).length}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{plots.filter(p => p.plotstatus === 'Planning').length}</div>
            <div className="text-sm text-muted-foreground">Planning</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{plots.filter(p => ['Completed', 'Handed Over'].includes(p.plotstatus)).length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">{plots.reduce((sum, p) => sum + (p.floorarea || 0), 0).toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Sq Ft</div>
          </CardContent>
        </Card>
      </div>

      {/* Plots table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Plots ({filteredPlots.length})</span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} size="lg" className="h-12">
                  <MapPin className="h-4 w-4 mr-2" />
                  Add Plot
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlot ? "Edit Plot" : "Create New Plot"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plotnumber">Plot Number *</Label>
                      <Input
                        id="plotnumber"
                        value={formData.plotnumber}
                        onChange={(e) => setFormData({ ...formData, plotnumber: e.target.value })}
                        placeholder="e.g., A1, B24, 101"
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.plotstatus} onValueChange={(value) => setFormData({ ...formData, plotstatus: value })}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Foundation">Foundation</SelectItem>
                          <SelectItem value="Superstructure">Superstructure</SelectItem>
                          <SelectItem value="First Fix">First Fix</SelectItem>
                          <SelectItem value="Second Fix">Second Fix</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Handed Over">Handed Over</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input
                      id="level"
                      type="number"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      placeholder="Enter level number"
                      className="h-12"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numberofbedrooms">Bedrooms</Label>
                      <Input
                        id="numberofbedrooms"
                        type="number"
                        value={formData.numberofbedrooms}
                        onChange={(e) => setFormData({ ...formData, numberofbedrooms: parseInt(e.target.value) || 0 })}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numberofbathrooms">Bathrooms</Label>
                      <Input
                        id="numberofbathrooms"
                        type="number"
                        value={formData.numberofbathrooms}
                        onChange={(e) => setFormData({ ...formData, numberofbathrooms: parseInt(e.target.value) || 0 })}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="floorarea">Floor Area (sq ft)</Label>
                      <Input
                        id="floorarea"
                        type="number"
                        value={formData.floorarea}
                        onChange={(e) => setFormData({ ...formData, floorarea: parseInt(e.target.value) || 0 })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plannedhandoverdate">Planned Handover</Label>
                      <Input
                        id="plannedhandoverdate"
                        type="date"
                        value={formData.plannedhandoverdate}
                        onChange={(e) => setFormData({ ...formData, plannedhandoverdate: e.target.value })}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actualhandoverdate">Actual Handover</Label>
                      <Input
                        id="actualhandoverdate"
                        type="date"
                        value={formData.actualhandoverdate}
                        onChange={(e) => setFormData({ ...formData, actualhandoverdate: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plotnotes">Notes</Label>
                    <Textarea
                      id="plotnotes"
                      value={formData.plotnotes}
                      onChange={(e) => setFormData({ ...formData, plotnotes: e.target.value })}
                      placeholder="Plot-specific notes, special requirements, etc."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 h-12">
                      {editingPlot ? "Update Plot" : "Create Plot"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Spec</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Handover</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlots.map((plot) => (
                  <TableRow key={plot.id}>
                    <TableCell className="font-medium">{plot.plotnumber}</TableCell>
                    <TableCell>{getStatusBadge(plot.plotstatus)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {plot.numberofbedrooms}B/{plot.numberofbathrooms}B
                      </div>
                    </TableCell>
                    <TableCell>{plot.floorarea?.toLocaleString()} sq ft</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{plot.plannedhandoverdate && new Date(plot.plannedhandoverdate).toLocaleDateString()}</div>
                        {plot.actualhandoverdate && (
                          <div className="text-success">{new Date(plot.actualhandoverdate).toLocaleDateString()}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{plot.plotnotes}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(plot)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(plot.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredPlots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No plots match your search" : "No plots found"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};