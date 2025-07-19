import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Download, 
  UserCheck,
  UserX,
  Wrench
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Enums } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { AdminRoleRefresh } from "./AdminRoleRefresh";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  employmentstatus: string;
  last_sign_in: string;
  created_at: string;
}

const AdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const roles = ["Operative", "Supervisor", "PM", "Manager", "Admin", "Director", "DPO"];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      const transformedUsers = (data || []).map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || '',
        role: user.role || 'Operative',
        employmentstatus: user.employmentstatus || 'Active',
        last_sign_in: user.last_sign_in || user.created_at,
        created_at: user.created_at
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load the crew roster - check the pipes!');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: Enums<'user_role_enum'>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success(`Role updated - user now has the right tools for the job! 🔧`);
      
      // Show additional message about session refresh
      setTimeout(() => {
        toast.info(`Tell the user to refresh their role or sign out/in to access their new dashboard.`, {
          duration: 8000
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to change role - pipe might be blocked!');
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      
      const { error } = await supabase
        .from('users')
        .update({ employmentstatus: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, employmentstatus: newStatus } : user
      ));
      
      toast.success(`User ${newStatus.toLowerCase()} - access ${newStatus === 'Active' ? 'flowing' : 'sealed'}! 🚰`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Status change failed - valve might be stuck!');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Inactive': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'Director': 
      case 'DPO': return 'destructive';
      case 'Manager':
      case 'PM': return 'default';
      case 'Supervisor': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <span className="ml-2">Loading the crew roster...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            Crew Management - Wrangling the Team
          </h2>
          <p className="text-muted-foreground">
            No loose ends here - manage your team's roles and access levels
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Crew List
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Team Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Crew</p>
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
                <p className="text-sm text-muted-foreground">Active Workers</p>
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
                <p className="text-sm text-muted-foreground">Off Duty</p>
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
                <p className="text-sm text-muted-foreground">Supervisors+</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => ['Admin', 'Director', 'Manager', 'PM', 'Supervisor'].includes(u.role)).length}
                </p>
              </div>
              <Wrench className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search crew by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Roster ({filteredUsers.length} crew members)</CardTitle>
          <CardDescription>
            {filteredUsers.length === 0 && searchQuery 
              ? "No crew found - try different search terms!" 
              : "Manage roles and access for your team"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No matches in the crew roster!" : "No users? Time to hire some proper workers! 🔧"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.id, newRole as Enums<'user_role_enum'>)}
                        >
                          <SelectTrigger className="w-32">
                            <Badge variant={getRoleVariant(user.role)}>
                              {user.role}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(user.employmentstatus)}
                          className="cursor-pointer"
                          onClick={() => handleStatusToggle(user.id, user.employmentstatus)}
                        >
                          {user.employmentstatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString() : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AdminRoleRefresh 
                            userId={user.id}
                            userName={user.name}
                            onRefreshComplete={() => {
                              console.log(`Refresh completed for ${user.name}`);
                            }}
                          />
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Boot {user.name} from the crew? This will cut off their access completely - no going back!
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Them</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Boot Them Out
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
};

export default AdminUserManagement;
