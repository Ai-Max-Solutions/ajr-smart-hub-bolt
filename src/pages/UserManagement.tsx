import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RoleProtection } from '@/components/auth/RoleProtection';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_verified: boolean;
  employmentstatus: string;
  last_sign_in: string;
  supabase_auth_id: string;
}

export const UserManagement = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'Admin' | 'Director' | 'PM' | 'Supervisor' | 'Operative') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const toggleUserVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(`User ${!currentStatus ? 'verified' : 'unverified'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user verification:', error);
      toast.error('Failed to update user verification');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'Director':
        return 'destructive';
      case 'PM':
      case 'Supervisor':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <RoleProtection allowedRoles={['Admin', 'Director']}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user roles, verification status, and access permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.employmentstatus === 'Active' ? 'default' : 'secondary'}>
                          {user.employmentstatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_verified ? 'default' : 'destructive'}>
                          {user.is_verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in ? 
                          new Date(user.last_sign_in).toLocaleDateString() : 
                          'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => updateUserRole(user.id, newRole as 'Admin' | 'Director' | 'PM' | 'Supervisor' | 'Operative')}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Operative">Operative</SelectItem>
                              <SelectItem value="Supervisor">Supervisor</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Director">Director</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserVerification(user.id, user.is_verified)}
                          >
                            {user.is_verified ? 'Unverify' : 'Verify'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleProtection>
  );
};