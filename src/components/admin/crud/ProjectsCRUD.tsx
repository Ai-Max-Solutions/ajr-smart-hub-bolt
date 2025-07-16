import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormBuilder, FormFieldConfig } from "@/components/ui/form-builder";
import { EnhancedTable, ColumnDef } from "@/components/ui/enhanced-table";
import { Edit, Trash2, Calendar, Building, MapPin, User, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { AJIcon } from "@/components/ui/aj-icon";

interface ProjectsCRUDProps {
  searchQuery: string;
  isOffline: boolean;
}

interface Project {
  id: string;
  projectname: string;
  clientname: string;
  status: string;
  startdate: string;
  plannedenddate: string;
  projectmanager: string;
  siteaddress: string;
  totalplots: number;
}

// Form schema for validation
const projectSchema = z.object({
  projectname: z.string().min(1, "Project name is required"),
  clientname: z.string().min(1, "Client name is required"),
  status: z.string(),
  startdate: z.string().optional(),
  plannedenddate: z.string().optional(),
  projectmanager: z.string().optional(),
  siteaddress: z.string().optional(),
  Project_Description: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export const ProjectsCRUD = ({ searchQuery, isOffline }: ProjectsCRUDProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);

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
        .select('id, fullname, role')
        .in('role', ['Project Manager', 'Director', 'Admin'])
        .eq('employmentstatus', 'Active');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to load users");
    }
  };

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      if (editingProject) {
        const { error } = await supabase
          .from('Projects')
          .update(data)
          .eq('id', editingProject.id);

        if (error) throw error;
        toast.success("Project updated successfully");
      } else {
        const { error } = await supabase
          .from('Projects')
          .insert([data]);

        if (error) throw error;
        toast.success("Project created successfully");
      }

      fetchProjects();
      setIsDialogOpen(false);
      setEditingProject(null);
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
        .eq('id', projectId);

      if (error) throw error;
      toast.success("Project archived successfully");
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to archive project");
    }
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
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

  // Enhanced table columns definition
  const columns: ColumnDef<Project>[] = [
    {
      id: "project",
      header: "Project",
      accessorKey: "projectname",
      sortable: true,
      filterable: true,
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-semibold text-foreground">{row.projectname}</div>
          {row.siteaddress && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {row.siteaddress}
            </div>
          )}
        </div>
      )
    },
    {
      id: "client",
      header: "Client",
      accessorKey: "clientname",
      sortable: true,
      filterable: true,
      cell: ({ value }) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: ({ value }) => getStatusBadge(value)
    },
    {
      id: "manager",
      header: "Project Manager",
      accessorKey: "projectmanager",
      sortable: true,
      filterable: true,
      cell: ({ value }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{value || "Unassigned"}</span>
        </div>
      )
    },
    {
      id: "dates",
      header: "Timeline",
      cell: ({ row }) => (
        <div className="space-y-1 text-sm">
          {row.startdate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>Start: {row.startdate}</span>
            </div>
          )}
          {row.plannedenddate && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>End: {row.plannedenddate}</span>
            </div>
          )}
        </div>
      )
    },
    {
      id: "plots",
      header: "Plots",
      accessorKey: "totalplots",
      sortable: true,
      cell: ({ value }) => (
        <Badge variant="outline" className="font-mono">
          {value || 0}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "",
      width: 100,
      cell: ({ row, index }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditDialog(row)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(row.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Archive Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  // Form fields configuration
  const formFields: FormFieldConfig<ProjectFormData>[] = [
    {
      name: "projectname",
      label: "Project Name",
      type: "text",
      placeholder: "Enter project name",
      required: true,
      icon: <Building className="h-4 w-4" />,
      grid: { xs: 2, md: 1 }
    },
    {
      name: "clientname", 
      label: "Client Name",
      type: "text",
      placeholder: "Enter client name",
      required: true,
      icon: <User className="h-4 w-4" />,
      grid: { xs: 2, md: 1 }
    },
    {
      name: "status",
      label: "Project Status",
      type: "select",
      options: [
        { value: "Planning", label: "Planning", description: "Project in planning phase" },
        { value: "Active", label: "Active", description: "Project actively running" },
        { value: "On Hold", label: "On Hold", description: "Project temporarily paused" },
        { value: "Completed", label: "Completed", description: "Project finished" }
      ],
      grid: { xs: 2, md: 1 }
    },
    {
      name: "projectmanager",
      label: "Project Manager",
      type: "select",
      placeholder: "Select project manager",
      options: users.map(user => ({
        value: user.fullname,
        label: user.fullname,
        description: user.role
      })),
      grid: { xs: 2, md: 1 }
    },
    {
      name: "startdate",
      label: "Start Date",
      type: "date",
      grid: { xs: 2, md: 1 }
    },
    {
      name: "plannedenddate", 
      label: "Planned End Date",
      type: "date",
      grid: { xs: 2, md: 1 }
    },
    {
      name: "siteaddress",
      label: "Site Address",
      type: "text",
      placeholder: "Enter site address",
      icon: <MapPin className="h-4 w-4" />,
      grid: { xs: 2 }
    },
    {
      name: "Project_Description",
      label: "Project Description",
      type: "textarea",
      placeholder: "Enter project description",
      rows: 4,
      grid: { xs: 2 }
    }
  ];

  if (loading) {
    return <div className="flex justify-center py-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick stats with enhanced design */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-scale border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <AJIcon icon={Building} variant="navy" size="sm" hover={false} />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {projects.filter(p => p.status === 'Active').length}
                </div>
                <div className="text-sm text-muted-foreground font-poppins">Active Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-scale border-l-4 border-l-warning">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AJIcon icon={Calendar} variant="yellow" size="sm" hover={false} />
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">
                  {projects.filter(p => p.status === 'Planning').length}
                </div>
                <div className="text-sm text-muted-foreground font-poppins">Planning</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-scale border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <AJIcon icon={Building} variant="yellow" size="sm" hover={false} />
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {projects.filter(p => p.status === 'Completed').length}
                </div>
                <div className="text-sm text-muted-foreground font-poppins">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-scale border-l-4 border-l-muted">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted/20">
                <AJIcon icon={MapPin} variant="yellow" size="sm" hover={false} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {projects.reduce((sum, p) => sum + (p.totalplots || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground font-poppins">Total Plots</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced projects table */}
      <EnhancedTable
        columns={columns}
        data={projects}
        title="Projects Management"
        description="Manage construction projects, track progress, and assign resources"
        loading={loading}
        onRefresh={fetchProjects}
        onRowClick={(project) => openEditDialog(project)}
        enableSelection={true}
        selectedRows={selectedProjects}
        onSelectionChange={setSelectedProjects}
        customActions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} size="sm" className="font-poppins">
                <Building className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-poppins text-xl">
                  {editingProject ? "Edit Project" : "Create New Project"}
                </DialogTitle>
              </DialogHeader>
              
              <FormBuilder
                fields={formFields}
                schema={projectSchema}
                onSubmit={handleSubmit}
                onCancel={() => setIsDialogOpen(false)}
                defaultValues={editingProject ? {
                  projectname: editingProject.projectname || "",
                  clientname: editingProject.clientname || "",
                  status: editingProject.status || "Planning",
                  startdate: editingProject.startdate || "",
                  plannedenddate: editingProject.plannedenddate || "",
                  projectmanager: editingProject.projectmanager || "",
                  siteaddress: editingProject.siteaddress || "",
                  Project_Description: ""
                } : {
                  projectname: "",
                  clientname: "",
                  status: "Planning",
                  startdate: "",
                  plannedenddate: "",
                  projectmanager: "",
                  siteaddress: "",
                  Project_Description: ""
                }}
                submitText={editingProject ? "Update Project" : "Create Project"}
                gridCols={2}
                className="border-0 shadow-none"
              />
            </DialogContent>
          </Dialog>
        }
        emptyMessage="No projects found"
        emptyDescription="Get started by creating your first project"
      />
    </div>
  );
};