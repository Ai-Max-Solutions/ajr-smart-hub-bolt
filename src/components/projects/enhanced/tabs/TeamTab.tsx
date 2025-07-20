import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Trash2, 
  Users,
  Search,
  Mail,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TeamTabProps {
  projectId: string;
  teamMembers: TeamMember[];
  isLoading: boolean;
}

export const TeamTab: React.FC<TeamTabProps> = ({
  projectId,
  teamMembers,
  isLoading
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('Member');

  // Fetch all users for selection
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: isAddingMember,
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('project_team_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role: role
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', projectId] });
      setIsAddingMember(false);
      setSearchQuery('');
      setSelectedRole('Member');
      toast({
        title: "Team Member Added",
        description: "New team member has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add team member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('project_team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', projectId] });
      toast({
        title: "Team Member Removed",
        description: "Team member has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove team member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddMember = (userId: string) => {
    addTeamMemberMutation.mutate({ userId, role: selectedRole });
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      removeTeamMemberMutation.mutate(memberId);
    }
  };

  const filteredUsers = allUsers.filter(user => {
    // Filter out users already in the team
    const isAlreadyMember = teamMembers.some(member => member.user_id === user.id);
    if (isAlreadyMember) return false;

    // Filter by search query
    if (searchQuery) {
      return user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             user.email.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'director':
        return 'destructive';
      case 'pm':
      case 'supervisor':
        return 'default';
      case 'operative':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage project team members and their roles
          </p>
        </div>
        <Button onClick={() => setIsAddingMember(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Add Member Form */}
      {isAddingMember && (
        <Card>
          <CardHeader>
            <CardTitle>Add Team Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Search Users</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="Member">Member</option>
                  <option value="Lead">Lead</option>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
            </div>

            {/* User Selection List */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? 'No users found matching your search' : 'No available users to add'}
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(user.id)}
                      disabled={addTeamMemberMutation.isPending}
                    >
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingMember(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Team ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No team members assigned</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {member.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.user.email}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getRoleBadgeColor(member.user.role)}>
                        <User className="h-3 w-3 mr-1" />
                        {member.user.role}
                      </Badge>
                      <Badge variant="outline">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id, member.user.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};