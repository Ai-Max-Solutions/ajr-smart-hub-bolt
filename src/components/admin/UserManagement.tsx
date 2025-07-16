import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Shield,
  UserCheck,
  UserX,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";

interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  fullname: string;
  role: string;
  employmentstatus: string;
  phone: string;
  address: string;
  startdate: string;
  currentproject: string;
  skills: string[];
  avatar_url: string;
  last_sign_in: string;
  deactivation_date: string;
  supabase_auth_id: string;
  contracttype: string;
  basehourlyrate: number;
  performancerating: string;
  cscsexpirydate: string;
  healthsafetytraining: string;
}

interface Project {
  id: string;
  projectname: string;
  status: string;
}

export const UserManagement = () => {
  const { user } = useAuth();
  const { logCRUDOperation } = useAuditLog();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Form state for user creation/editing
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    address: "",
    role: "Operative",
    contracttype: "Permanent",
    basehourlyrate: 0,
    currentproject: "",
    skills: [] as string[],
    employmentstatus: "Active"
  });

  const roles = [
    "Operative", "Supervisor", "Foreman", "Project Manager", "Admin", 
    "Document Controller", "Director", "Site Manager", "Quality Inspector"
  ];

  const contractTypes = ["Permanent", "Fixed Term", "Contractor", "Freelance"];
  const employmentStatuses = ["Active", "Inactive", "Suspended", "Terminated"];

  // Fetch users and projects
  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .order('lastname', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('Projects')
        .select('id, projectname, status')
        .eq('status', 'Active')
        .order('projectname');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = (
      user.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullname?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.employmentstatus === selectedStatus;
    const matchesActiveFilter = showInactive || user.employmentstatus === "Active";

    return matchesSearch && matchesRole && matchesStatus && matchesActiveFilter;
  });

  // Handle user creation
  const handleCreateUser = async () => {
    try {
      const newUser = {
        ...formData,
        fullname: `${formData.firstname} ${formData.lastname}`,
        startdate: new Date().toISOString().split('T')[0],
        airtable_created_time: new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('Users')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;

      await logCRUDOperation('CREATE', 'Users', data.id);
      
      setUsers([...users, data]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  // Handle user update
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updatedData = {
        ...formData,
        fullname: `${formData.firstname} ${formData.lastname}`
      };

      const { data, error } = await supabase
        .from('Users')
        .update(updatedData)
        .eq('id', selectedUser.id)
        .select()
        .single();

      if (error) throw error;

      await logCRUDOperation('UPDATE', 'Users', selectedUser.id);

      setUsers(users.map(user => 
        user.id === selectedUser.id ? data : user
      ));
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  // Handle user deactivation (soft delete)
  const handleDeactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('Users')
        .update({ 
          employmentstatus: 'Inactive',
          deactivation_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', userId);

      if (error) throw error;

      await logCRUDOperation('UPDATE', 'Users', userId);

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, employmentstatus: 'Inactive', deactivation_date: new Date().toISOString().split('T')[0] } 
          : user
      ));
      toast.success('User deactivated successfully');
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  // Handle user reactivation
  const handleReactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('Users')
        .update({ 
          employmentstatus: 'Active',
          deactivation_date: null
        })
        .eq('id', userId);

      if (error) throw error;

      await logCRUDOperation('UPDATE', 'Users', userId);

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, employmentstatus: 'Active', deactivation_date: null } 
          : user
      ));
      toast.success('User reactivated successfully');
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast.error('Failed to reactivate user');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      address: "",
      role: "Operative",
      contracttype: "Permanent",
      basehourlyrate: 0,
      currentproject: "",
      skills: [],
      employmentstatus: "Active"
    });
  };

  // Load user data into form for editing
  const loadUserForEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role || "Operative",
      contracttype: user.contracttype || "Permanent",
      basehourlyrate: user.basehourlyrate || 0,
      currentproject: user.currentproject || "",
      skills: user.skills || [],
      employmentstatus: user.employmentstatus || "Active"
    });
    setIsEditDialogOpen(true);
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Inactive': return 'secondary';
      case 'Suspended': return 'destructive';
      case 'Terminated': return 'destructive';
      default: return 'secondary';
    }
  };

  // Get role badge variant
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'Director': return 'destructive';
      case 'Project Manager':
      case 'Document Controller': return 'default';
      case 'Supervisor':
      case 'Foreman': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            User Management
          </h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions across the platform
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import Users
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.employmentstatus === 'Active').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive Users</p>
                <p className="text-2xl font-bold text-orange-600">
                  {users.filter(u => u.employmentstatus !== 'Active').length}
                </p>
              </div>
              <UserX className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => ['Admin', 'Director', 'Document Controller'].includes(u.role)).length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users by name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {employmentStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive" className="text-sm">
                  Show Inactive
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt={user.fullname}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-accent font-medium text-sm">
                                {user.firstname?.[0]}{user.lastname?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.fullname || `${user.firstname} ${user.lastname}`}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(user.employmentstatus)}>
                          {user.employmentstatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {projects.find(p => p.id === user.currentproject)?.projectname || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString() : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadUserForEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          {user.employmentstatus === 'Active' ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <UserX className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to deactivate {user.fullname}? This will revoke their access but preserve their data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeactivateUser(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Deactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivateUser(user.id)}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedUser(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user information and settings' : 'Add a new user to the system'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstname">First Name *</Label>
              <Input
                id="firstname"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastname">Last Name *</Label>
              <Input
                id="lastname"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contracttype">Contract Type</Label>
              <Select value={formData.contracttype} onValueChange={(value) => setFormData({ ...formData, contracttype: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="basehourlyrate">Base Hourly Rate (£)</Label>
              <Input
                id="basehourlyrate"
                type="number"
                step="0.01"
                value={formData.basehourlyrate}
                onChange={(e) => setFormData({ ...formData, basehourlyrate: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentproject">Current Project</Label>
              <Select value={formData.currentproject} onValueChange={(value) => setFormData({ ...formData, currentproject: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Project</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
              />
            </div>
            
            {selectedUser && (
              <div className="space-y-2">
                <Label htmlFor="employmentstatus">Employment Status</Label>
                <Select value={formData.employmentstatus} onValueChange={(value) => setFormData({ ...formData, employmentstatus: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedUser(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={selectedUser ? handleUpdateUser : handleCreateUser}>
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
