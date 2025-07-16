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
import { Edit, Trash2, Building2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LevelsCRUDProps {
  searchQuery: string;
  isOffline: boolean;
}

interface Level {
  id: string;
  levelname: string;
  levelnumber: number;
  levelstatus: string;
  plotsonlevel: number;
  block: string;
  levelnotes: string;
}

export const LevelsCRUD = ({ searchQuery, isOffline }: LevelsCRUDProps) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    levelname: "",
    levelnumber: 1,
    levelstatus: "Planning",
    block: "",
    levelnotes: "",
    plotsonlevel: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [levelsRes, projectsRes, blocksRes] = await Promise.all([
        supabase.from('Levels').select('*').order('levelnumber'),
        supabase.from('Projects').select('id, projectname').eq('status', 'Active'),
        supabase.from('Blocks').select('id, blockname, project')
      ]);

      setLevels(levelsRes.data || []);
      setProjects(projectsRes.data || []);
      setBlocks(blocksRes.data || []);
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
      if (editingLevel) {
        const { error } = await supabase
          .from('Levels')
          .update(formData)
          .eq('id', editingLevel.id);

        if (error) throw error;
        toast.success("Level updated successfully");
      } else {
        const { error } = await supabase
          .from('Levels')
          .insert([formData]);

        if (error) throw error;
        toast.success("Level created successfully");
      }

      fetchData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save level");
    }
  };

  const handleDelete = async (levelId: string) => {
    if (!confirm("Are you sure? This will affect all plots on this level.")) return;

    try {
      const { error } = await supabase
        .from('Levels')
        .update({ levelstatus: 'Archived' })
        .eq('id', levelId);

      if (error) throw error;
      toast.success("Level archived successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to archive level");
    }
  };

  const resetForm = () => {
    setFormData({
      levelname: "",
      levelnumber: 1,
      levelstatus: "Planning",
      block: "",
      levelnotes: "",
      plotsonlevel: 0
    });
    setEditingLevel(null);
  };

  const openEditDialog = (level: Level) => {
    setEditingLevel(level);
    setFormData({
      levelname: level.levelname || "",
      levelnumber: level.levelnumber || 1,
      levelstatus: level.levelstatus || "Planning",
      block: level.block || "",
      levelnotes: level.levelnotes || "",
      plotsonlevel: level.plotsonlevel || 0
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Active': 'default',
      'Planning': 'secondary',
      'In Progress': 'secondary',
      'Completed': 'default',
      'Archived': 'destructive'
    };
    return <Badge variant={(statusColors[status as keyof typeof statusColors] || 'secondary') as "default" | "secondary" | "destructive" | "outline"}>{status}</Badge>;
  };

  const filteredLevels = levels.filter(level =>
    level.levelname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    level.levelnumber?.toString().includes(searchQuery)
  );

  if (loading) {
    return <div className="flex justify-center py-8">Loading levels...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{levels.filter(l => l.levelstatus === 'Active').length}</div>
            <div className="text-sm text-muted-foreground">Active Levels</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{levels.filter(l => l.levelstatus === 'In Progress').length}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{levels.filter(l => l.levelstatus === 'Completed').length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">{levels.reduce((sum, l) => sum + (l.plotsonlevel || 0), 0)}</div>
            <div className="text-sm text-muted-foreground">Total Plots</div>
          </CardContent>
        </Card>
      </div>

      {/* Levels table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Building Levels ({filteredLevels.length})</span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} size="lg" className="h-12">
                  <Building2 className="h-4 w-4 mr-2" />
                  Add Level
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingLevel ? "Edit Level" : "Create New Level"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="levelname">Level Name *</Label>
                      <Input
                        id="levelname"
                        value={formData.levelname}
                        onChange={(e) => setFormData({ ...formData, levelname: e.target.value })}
                        placeholder="e.g., Ground Floor, Level 1"
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="levelnumber">Level Number *</Label>
                      <Input
                        id="levelnumber"
                        type="number"
                        value={formData.levelnumber}
                        onChange={(e) => setFormData({ ...formData, levelnumber: parseInt(e.target.value) || 1 })}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.levelstatus} onValueChange={(value) => setFormData({ ...formData, levelstatus: value })}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plotsonlevel">Plots on Level</Label>
                      <Input
                        id="plotsonlevel"
                        type="number"
                        value={formData.plotsonlevel}
                        onChange={(e) => setFormData({ ...formData, plotsonlevel: parseInt(e.target.value) || 0 })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="block">Associated Block</Label>
                    <Select value={formData.block} onValueChange={(value) => setFormData({ ...formData, block: value })}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select block" />
                      </SelectTrigger>
                      <SelectContent>
                        {blocks.map((block) => (
                          <SelectItem key={block.id} value={block.id}>
                            {block.blockname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="levelnotes">Notes</Label>
                    <Textarea
                      id="levelnotes"
                      value={formData.levelnotes}
                      onChange={(e) => setFormData({ ...formData, levelnotes: e.target.value })}
                      placeholder="Safety notes, access requirements, etc."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 h-12">
                      {editingLevel ? "Update Level" : "Create Level"}
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
                  <TableHead>Level</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plots</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLevels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell className="font-medium">{level.levelname}</TableCell>
                    <TableCell>{level.levelnumber}</TableCell>
                    <TableCell>{getStatusBadge(level.levelstatus)}</TableCell>
                    <TableCell>{level.plotsonlevel || 0}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{level.levelnotes}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(level)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(level.id)}
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
            {filteredLevels.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No levels match your search" : "No levels found"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};