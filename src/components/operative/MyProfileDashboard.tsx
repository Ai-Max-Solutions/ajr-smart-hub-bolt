
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ManualRoleRefresh } from '@/components/auth/ManualRoleRefresh';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Phone, Building, Calendar } from 'lucide-react';

export const MyProfileDashboard: React.FC = () => {
  const { userProfile, user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Role & Session Management */}
      <ManualRoleRefresh />

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile?.name || 'Not set'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email || 'Not set'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile?.phone || 'Not set'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{userProfile?.role || 'Not set'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {userProfile?.created_at 
                    ? new Date(userProfile.created_at).toLocaleDateString()
                    : 'Not available'
                  }
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile?.employmentstatus || 'Active'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Onboarding Complete</span>
              <span className={userProfile?.onboarding_completed ? 'text-green-600' : 'text-orange-600'}>
                {userProfile?.onboarding_completed ? 'Yes' : 'In Progress'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Account Status</span>
              <span className={!userProfile?.is_blocked ? 'text-green-600' : 'text-red-600'}>
                {!userProfile?.is_blocked ? 'Active' : 'Blocked'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
