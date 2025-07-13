import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreHorizontal, 
  Edit, 
  Pause, 
  Archive, 
  RotateCcw,
  Shield,
  ShieldCheck,
  ShieldX
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended" | "archived";
  lastLogin: string;
  twoFactorEnabled: boolean;
  assignedProjects: string[];
}

// Mock data
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@ajryan.co.uk",
    role: "admin",
    status: "active",
    lastLogin: "2025-01-13 09:15",
    twoFactorEnabled: true,
    assignedProjects: ["Kidbrooke Village", "Woodberry Down"]
  },
  {
    id: "2",
    name: "Sarah Connor",
    email: "sarah.connor@ajryan.co.uk",
    role: "supervisor",
    status: "active",
    lastLogin: "2025-01-13 08:45",
    twoFactorEnabled: true,
    assignedProjects: ["Kidbrooke Village"]
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike.johnson@ajryan.co.uk",
    role: "operative",
    status: "suspended",
    lastLogin: "2025-01-10 16:30",
    twoFactorEnabled: false,
    assignedProjects: ["Woodberry Down"]
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma.wilson@ajryan.co.uk",
    role: "pm",
    status: "active",
    lastLogin: "2025-01-13 07:20",
    twoFactorEnabled: true,
    assignedProjects: ["Kidbrooke Village", "Woodberry Down", "Greenwich Peninsula"]
  }
];

const roles = ["operative", "supervisor", "pm", "admin", "dpo", "director"];

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">🟢 Active</Badge>;
      case "suspended":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🟡 Suspended</Badge>;
      case "archived":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">🔴 Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTwoFactorBadge = (enabled: boolean) => {
    return enabled ? (
      <ShieldCheck className="h-4 w-4 text-green-600" />
    ) : (
      <ShieldX className="h-4 w-4 text-red-600" />
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = (userId: string, action: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case "suspend":
        setUsers(users.map(u => u.id === userId ? { ...u, status: "suspended" as const } : u));
        toast.success(`${user.name} has been suspended`);
        break;
      case "activate":
        setUsers(users.map(u => u.id === userId ? { ...u, status: "active" as const } : u));
        toast.success(`${user.name} has been activated`);
        break;
      case "archive":
        setUsers(users.map(u => u.id === userId ? { ...u, status: "archived" as const } : u));
        toast.success(`${user.name} has been archived`);
        break;
      case "reset-password":
        toast.success(`Password reset email sent to ${user.email}`);
        break;
      default:
        break;
    }
  };

  const handleBulkAction = (action: string) => {
    const selectedCount = selectedUsers.length;
    if (selectedCount === 0) {
      toast.error("Please select users first");
      return;
    }

    switch (action) {
      case "suspend":
        setUsers(users.map(u => selectedUsers.includes(u.id) ? { ...u, status: "suspended" as const } : u));
        toast.success(`${selectedCount} users suspended`);
        break;
      case "activate":
        setUsers(users.map(u => selectedUsers.includes(u.id) ? { ...u, status: "active" as const } : u));
        toast.success(`${selectedCount} users activated`);
        break;
      case "export":
        toast.success(`Exporting ${selectedCount} users to CSV`);
        break;
      default:
        break;
    }
    setSelectedUsers([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Users & Roles Management
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account for the SmartWork Hub
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Enter full name" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="user@ajryan.co.uk" />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">Create User</Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions across the SmartWork Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {selectedUsers.length} user(s) selected
              </span>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("suspend")}>
                Suspend
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
                Activate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("export")}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm">{user.lastLogin}</TableCell>
                    <TableCell>{getTwoFactorBadge(user.twoFactorEnabled)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.assignedProjects.length} project(s)
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "reset-password")}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === "active" && (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, "suspend")}>
                              <Pause className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          )}
                          {user.status === "suspended" && (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, "activate")}>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, "archive")}
                            className="text-destructive"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};