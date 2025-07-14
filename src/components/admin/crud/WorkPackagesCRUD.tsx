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
import { Edit, Trash2, Package, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkPackagesCRUDProps {
  searchQuery: string;
  isOffline: boolean;
}

interface WorkPackage {
  id: string;
  name: string;
  description: string;
  project_id: string;
  work_type: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  estimated_hours: number;
  actual_hours: number;
  assigned_to: string;
  completion_percentage: number;
  safety_notes: string;
}

export const WorkPackagesCRUD = ({ searchQuery, isOffline }: WorkPackagesCRUDProps) => {
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<WorkPackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    project_id: "",
    work_type: "",
    status: "pending",
    priority: "medium",
    start_date: "",
    end_date: "",
    estimated_hours: 0,
    assigned_to: "",
    safety_notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [packagesRes, projectsRes, usersRes] = await Promise.all([
        supabase.from('work_packages').select('*').order('created_at', { ascending: false }),
        supabase.from('Projects').select('whalesync_postgres_id, projectname').eq('status', 'Active'),
        supabase.from('Users').select('whalesync_postgres_id, fullname, role').eq('employmentstatus', 'Active')
      ]);

      setWorkPackages(packagesRes.data || []);
      setProjects(projectsRes.data || []);
      setUsers(usersRes.data || []);
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
      const currentUserId = await getCurrentUserId();
      const submitData = {
        ...formData,
        created_by: currentUserId,
        estimated_hours: Number(formData.estimated_hours)
      };

      if (editingPackage) {
        const { error } = await supabase
          .from('work_packages')
          .update(submitData)
          .eq('id', editingPackage.id);

        if (error) throw error;
        toast.success("Work package updated successfully");
      } else {
        const { error } = await supabase
          .from('work_packages')
          .insert([submitData]);

        if (error) throw error;
        toast.success("Work package created successfully");
      }

      fetchData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save work package");
    }
  };

  const getCurrentUserId = async () => {
    const { data: userData } = await supabase
      .from('Users')
      .select('whalesync_postgres_id')
      .eq('supabase_auth_id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    return userData?.whalesync_postgres_id;
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm("Are you sure you want to delete this work package?")) return;

    try {
      const { error } = await supabase
        .from('work_packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;
      toast.success("Work package deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete work package");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      project_id: "",
      work_type: "",
      status: "pending",
      priority: "medium",
      start_date: "",
      end_date: "",
      estimated_hours: 0,
      assigned_to: "",
      safety_notes: ""
    });
    setEditingPackage(null);
  };

  const openEditDialog = (workPackage: WorkPackage) => {
    setEditingPackage(workPackage);
    setFormData({
      name: workPackage.name || "",
      description: workPackage.description || "",
      project_id: workPackage.project_id || "",
      work_type: workPackage.work_type || "",
      status: workPackage.status || "pending",
      priority: workPackage.priority || "medium",
      start_date: workPackage.start_date || "",
      end_date: workPackage.end_date || "",
      estimated_hours: workPackage.estimated_hours || 0,
      assigned_to: workPackage.assigned_to || "",
      safety_notes: workPackage.safety_notes || ""
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'pending': 'secondary',
      'in_progress': 'secondary',
      'completed': 'default',
      'on_hold': 'destructive'
    };
    return <Badge variant={(statusColors[status as keyof typeof statusColors] || 'secondary') as "default" | "secondary" | "destructive" | "outline"}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      'low': 'secondary',
      'medium': 'secondary',
      'high': 'destructive'
    };
    return <Badge variant={(priorityColors[priority as keyof typeof priorityColors] || 'secondary') as "default" | "secondary" | "destructive" | "outline"}>{priority}</Badge>;
  };

  const filteredPackages = workPackages.filter(pkg =>
    pkg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.work_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-8">Loading work packages...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{workPackages.filter(p => p.status === 'pending').length}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{workPackages.filter(p => p.status === 'in_progress').length}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{workPackages.filter(p => p.status === 'completed').length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">
              {Math.round(workPackages.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / Math.max(workPackages.length, 1))}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Complete</div>
          </CardContent>
        </Card>
      </div>

      {/* Work packages table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Work Packages ({filteredPackages.length})</span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} size="lg" className="h-12">
                  <Package className="h-4 w-4 mr-2" />
                  Add Work Package
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPackage ? "Edit Work Package" : "Create New Work Package"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Package Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Electrical First Fix"
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work_type">Work Type *</Label>
                      <Select value={formData.work_type} onValueChange={(value) => setFormData({ ...formData, work_type: value })} required>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select work type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Plumbing">Plumbing</SelectItem>
                          <SelectItem value="Heating">Heating</SelectItem>
                          <SelectItem value="Plastering">Plastering</SelectItem>
                          <SelectItem value="Flooring">Flooring</SelectItem>
                          <SelectItem value="Joinery">Joinery</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project_id">Project *</Label>
                    <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })} required>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.whalesync_postgres_id} value={project.whalesync_postgres_id}>
                            {project.projectname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed description of the work package"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimated_hours">Est. Hours</Label>
                      <Input
                        id="estimated_hours"
                        type="number"
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || 0 })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Assigned To</Label>
                    <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select operative" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.whalesync_postgres_id} value={user.whalesync_postgres_id}>
                            {user.fullname} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="safety_notes">Safety Notes</Label>
                    <Textarea
                      id="safety_notes"
                      value={formData.safety_notes}
                      onChange={(e) => setFormData({ ...formData, safety_notes: e.target.value })}
                      placeholder="Important safety considerations for this work package"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 h-12">
                      {editingPackage ? "Update Package" : "Create Package"}
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
                  <TableHead>Package</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{pkg.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {pkg.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{pkg.work_type}</TableCell>
                    <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                    <TableCell>{getPriorityBadge(pkg.priority)}</TableCell>
                    <TableCell>
                      {pkg.assigned_to && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="text-sm">
                            {users.find(u => u.whalesync_postgres_id === pkg.assigned_to)?.fullname || 'Unknown'}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {pkg.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(pkg.start_date).toLocaleDateString()}
                          </div>
                        )}
                        {pkg.end_date && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(pkg.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Est: {pkg.estimated_hours}h</div>
                        {pkg.actual_hours && <div className="text-muted-foreground">Act: {pkg.actual_hours}h</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(pkg)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pkg.id)}
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
            {filteredPackages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No work packages match your search" : "No work packages found"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};