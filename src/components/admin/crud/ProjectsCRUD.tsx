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
import { Edit, Trash2, Users, Calendar, Building, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProjectsCRUDProps {
  searchQuery: string;
  isOffline: boolean;
}

interface Project {
  whalesync_postgres_id: string;
  projectname: string;
  clientname: string;
  status: string;
  startdate: string;
  plannedenddate: string;
  projectmanager: string;
  siteaddress: string;
  totalplots: number;
}

interface ProjectFormData {
  projectname: string;
  clientname: string;
  status: string;
  startdate: string;
  plannedenddate: string;
  projectmanager: string;
  siteaddress: string;
  Project_Description: string;
}

export const ProjectsCRUD = ({ searchQuery, isOffline }: ProjectsCRUDProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    projectname: "",
    clientname: "",
    status: "Planning",
    startdate: "",
    plannedenddate: "",
    projectmanager: "",
    siteaddress: "",
    Project_Description: ""
  });

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('Projects')
        .select('*')
        .order('airtable_created_time', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      if (!isOffline) {
        toast.error("Failed to load projects");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('Users')
        .select('whalesync_postgres_id, fullname, role')
        .in('role', ['Project Manager', 'Director', 'Admin'])
        .eq('employmentstatus', 'Active');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to load users");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProject) {
        const { error } = await supabase
          .from('Projects')
          .update(formData)
          .eq('whalesync_postgres_id', editingProject.whalesync_postgres_id);

        if (error) throw error;
        toast.success("Project updated successfully");
      } else {
        const { error } = await supabase
          .from('Projects')
          .insert([formData]);

        if (error) throw error;
        toast.success("Project created successfully");
      }

      fetchProjects();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save project");
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to archive this project?")) return;

    try {
      const { error } = await supabase
        .from('Projects')
        .update({ status: 'Archived' })
        .eq('whalesync_postgres_id', projectId);

      if (error) throw error;
      toast.success("Project archived successfully");
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to archive project");
    }
  };

  const resetForm = () => {
    setFormData({
      projectname: "",
      clientname: "",
      status: "Planning",
      startdate: "",
      plannedenddate: "",
      projectmanager: "",
      siteaddress: "",
      Project_Description: ""
    });
    setEditingProject(null);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      projectname: project.projectname || "",
      clientname: project.clientname || "",
      status: project.status || "Planning",
      startdate: project.startdate || "",
      plannedenddate: project.plannedenddate || "",
      projectmanager: project.projectmanager || "",
      siteaddress: project.siteaddress || "",
      Project_Description: ""
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Active': 'default',
      'Planning': 'secondary',
      'Completed': 'default',
      'On Hold': 'secondary',
      'Archived': 'destructive'
    };
    return <Badge variant={(statusColors[status as keyof typeof statusColors] || 'secondary') as "default" | "secondary" | "destructive" | "outline"}>{status}</Badge>;
  };

  const filteredProjects = projects.filter(project =>
    project.projectname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.clientname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.projectmanager?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{projects.filter(p => p.status === 'Active').length}</div>
            <div className="text-sm text-muted-foreground">Active Projects</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{projects.filter(p => p.status === 'Planning').length}</div>
            <div className="text-sm text-muted-foreground">Planning</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{projects.filter(p => p.status === 'Completed').length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">{projects.reduce((sum, p) => sum + (p.totalplots || 0), 0)}</div>
            <div className="text-sm text-muted-foreground">Total Plots</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Projects ({filteredProjects.length})</span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} size="lg" className="h-12">
                  <Building className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProject ? "Edit Project" : "Create New Project"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectname">Project Name *</Label>
                      <Input
                        id="projectname"
                        value={formData.projectname}
                        onChange={(e) => setFormData({ ...formData, projectname: e.target.value })}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientname">Client Name *</Label>
                      <Input
                        id="clientname"
                        value={formData.clientname}
                        onChange={(e) => setFormData({ ...formData, clientname: e.target.value })}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="On Hold">On Hold</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectmanager">Project Manager</Label>
                      <Select value={formData.projectmanager} onValueChange={(value) => setFormData({ ...formData, projectmanager: value })}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select PM" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.whalesync_postgres_id} value={user.fullname}>
                              {user.fullname} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startdate">Start Date</Label>
                      <Input
                        id="startdate"
                        type="date"
                        value={formData.startdate}
                        onChange={(e) => setFormData({ ...formData, startdate: e.target.value })}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plannedenddate">Planned End Date</Label>
                      <Input
                        id="plannedenddate"
                        type="date"
                        value={formData.plannedenddate}
                        onChange={(e) => setFormData({ ...formData, plannedenddate: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteaddress">Site Address</Label>
                    <Input
                      id="siteaddress"
                      value={formData.siteaddress}
                      onChange={(e) => setFormData({ ...formData, siteaddress: e.target.value })}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.Project_Description}
                      onChange={(e) => setFormData({ ...formData, Project_Description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 h-12">
                      {editingProject ? "Update Project" : "Create Project"}
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
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PM</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Plots</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.whalesync_postgres_id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{project.projectname}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {project.siteaddress}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{project.clientname}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>{project.projectmanager}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {project.startdate}
                        </div>
                        {project.plannedenddate && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {project.plannedenddate}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{project.totalplots || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(project)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(project.whalesync_postgres_id)}
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
            {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No projects match your search" : "No projects found"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};