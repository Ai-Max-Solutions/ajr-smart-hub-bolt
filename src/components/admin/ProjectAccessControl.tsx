import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Settings, 
  Search, 
  Users, 
  Eye, 
  UserPlus, 
  UserMinus,
  Building,
  Shield
} from "lucide-react";

interface ProjectAccess {
  projectId: string;
  projectName: string;
  totalUsers: number;
  activeUsers: number;
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    accessLevel: string;
  }[];
}

// Mock data
const mockProjectAccess: ProjectAccess[] = [
  {
    projectId: "1",
    projectName: "Kidbrooke Village Phase 2",
    totalUsers: 12,
    activeUsers: 10,
    users: [
      {
        id: "1",
        name: "John Smith",
        email: "john.smith@ajryan.co.uk",
        role: "admin",
        accessLevel: "full"
      },
      {
        id: "2",
        name: "Sarah Connor",
        email: "sarah.connor@ajryan.co.uk",
        role: "supervisor",
        accessLevel: "project-level"
      },
      {
        id: "4",
        name: "Emma Wilson",
        email: "emma.wilson@ajryan.co.uk",
        role: "pm",
        accessLevel: "full"
      }
    ]
  },
  {
    projectId: "2",
    projectName: "Woodberry Down Block C",
    totalUsers: 8,
    activeUsers: 7,
    users: [
      {
        id: "1",
        name: "John Smith",
        email: "john.smith@ajryan.co.uk",
        role: "admin",
        accessLevel: "full"
      },
      {
        id: "3",
        name: "Mike Johnson",
        email: "mike.johnson@ajryan.co.uk",
        role: "operative",
        accessLevel: "read-only"
      },
      {
        id: "4",
        name: "Emma Wilson",
        email: "emma.wilson@ajryan.co.uk",
        role: "pm",
        accessLevel: "full"
      }
    ]
  },
  {
    projectId: "3",
    projectName: "Greenwich Peninsula Tower",
    totalUsers: 15,
    activeUsers: 14,
    users: [
      {
        id: "4",
        name: "Emma Wilson",
        email: "emma.wilson@ajryan.co.uk",
        role: "pm",
        accessLevel: "full"
      }
    ]
  }
];

const accessLevels = [
  { value: "read-only", label: "Read Only", description: "View project data only" },
  { value: "project-level", label: "Project Level", description: "Manage project data and documents" },
  { value: "full", label: "Full Access", description: "Complete project management access" }
];

export const ProjectAccessControl = () => {
  const [projects] = useState<ProjectAccess[]>(mockProjectAccess);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<ProjectAccess | null>(null);

  const filteredProjects = projects.filter(project =>
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccessBadge = (accessLevel: string) => {
    switch (accessLevel) {
      case "full":
        return <Badge className="bg-green-100 text-green-800">Full Access</Badge>;
      case "project-level":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Project Level</Badge>;
      case "read-only":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Read Only</Badge>;
      default:
        return <Badge variant="outline">{accessLevel}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-purple-100 text-purple-800",
      pm: "bg-blue-100 text-blue-800",
      supervisor: "bg-orange-100 text-orange-800",
      operative: "bg-green-100 text-green-800"
    };
    
    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const handleAddUserToProject = (projectId: string) => {
    toast.success("User assignment dialog would open here");
  };

  const handleRemoveUserFromProject = (projectId: string, userId: string) => {
    const project = projects.find(p => p.projectId === projectId);
    const user = project?.users.find(u => u.id === userId);
    if (user) {
      toast.success(`Removed ${user.name} from project access`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Projects & Access Control
          </CardTitle>
          <CardDescription>
            Manage user access permissions for each project in the SmartWork Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Projects Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {filteredProjects.map((project) => (
              <Card key={project.projectId} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {project.projectName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Users:</span>
                      <Badge variant="secondary">{project.totalUsers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active:</span>
                      <Badge className="bg-green-100 text-green-800">{project.activeUsers}</Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setSelectedProject(project)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Users
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Building className="h-5 w-5" />
                              {project.projectName} - User Access
                            </DialogTitle>
                            <DialogDescription>
                              Manage user roles and access levels for this project
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <Badge variant="secondary">
                                  {project.users.length} users assigned
                                </Badge>
                              </div>
                              <Button onClick={() => handleAddUserToProject(project.projectId)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add User
                              </Button>
                            </div>

                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Access Level</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {project.users.map((user) => (
                                    <TableRow key={user.id}>
                                      <TableCell>
                                        <div>
                                          <div className="font-medium">{user.name}</div>
                                          <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                      </TableCell>
                                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                                      <TableCell>{getAccessBadge(user.accessLevel)}</TableCell>
                                      <TableCell>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRemoveUserFromProject(project.projectId, user.id)}
                                        >
                                          <UserMinus className="h-4 w-4 mr-2" />
                                          Remove
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="sm" 
                        onClick={() => handleAddUserToProject(project.projectId)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Access Levels Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Access Levels Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {accessLevels.map((level) => (
                  <div key={level.value} className="p-4 border rounded-lg">
                    <div className="mb-2">{getAccessBadge(level.value)}</div>
                    <h4 className="font-medium mb-1">{level.label}</h4>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};