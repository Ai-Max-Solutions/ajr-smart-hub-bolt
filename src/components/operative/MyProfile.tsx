
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, Edit, Save, X, Mail, Phone, MapPin, Calendar, Award } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  phone: string;
  role: string;
  skills: string[];
  address: string;
  employmentstatus: string;
  performance_rating: number;
  avatar_url: string;
  airtable_created_time: string;
}

export const MyProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const queryClient = useQueryClient();

  // Get current user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .eq('supabase_auth_id', user.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('Users')
        .update(updates)
        .eq('supabase_auth_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
      setEditData({});
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      firstname: profile?.firstname || '',
      lastname: profile?.lastname || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
  };

  const handleSave = () => {
    if (editData.firstname && editData.lastname) {
      updateProfileMutation.mutate({
        ...editData,
        fullname: `${editData.firstname} ${editData.lastname}`,
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ajryan-yellow"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-ajryan-dark">My Profile</h2>
        {!isEditing ? (
          <Button onClick={handleEdit} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleCancel} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editData.firstname || ''}
                    onChange={(e) => setEditData({ ...editData, firstname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editData.lastname || ''}
                    onChange={(e) => setEditData({ ...editData, lastname: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{profile.fullname || 'Not provided'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={editData.address || ''}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    placeholder="Enter address"
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <span>{profile.address || 'Not provided'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Role</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{profile.role}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Employment Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={profile.employmentstatus === 'Active' ? 'default' : 'secondary'}>
                    {profile.employmentstatus}
                  </Badge>
                </div>
              </div>
              {profile.performance_rating && (
                <div>
                  <Label className="text-sm text-muted-foreground">Performance Rating</Label>
                  <p className="font-medium">{profile.performance_rating}/5</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined {format(new Date(profile.airtable_created_time), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <Badge key={index} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No skills recorded</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
