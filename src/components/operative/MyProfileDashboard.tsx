
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User, Mail, Phone, Calendar, Building, UserCheck } from 'lucide-react';
import { RoleRefreshButton } from '@/components/auth/RoleRefreshButton';

export const MyProfileDashboard: React.FC = () => {
  const { profile, loading, error } = useUserProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-6">
              <p className="text-red-600">Error loading profile: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">No profile data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and account settings</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-blue-100">
                Your basic profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.firstname} {profile.lastname}
                </h2>
                <Badge variant={profile.role === 'Admin' ? 'destructive' : 'default'} className="mt-2">
                  {profile.role}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{profile.auth_email}</p>
                  </div>
                </div>

                {profile.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile.currentproject && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Current Project</p>
                      <p className="font-medium">{profile.currentproject}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">
                      {new Date(profile.airtable_created_time).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <UserCheck className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Employment Status</p>
                    <Badge variant={profile.employmentstatus === 'Active' ? 'default' : 'secondary'}>
                      {profile.employmentstatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings & Role Management */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription className="text-green-100">
                Manage your account and access level
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Role & Access</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Your current role determines which parts of the system you can access.
                  </p>
                  <Badge variant={profile.role === 'Admin' ? 'destructive' : 'default'} className="mb-3">
                    Current Role: {profile.role}
                  </Badge>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">Role Updated Recently?</h3>
                  <p className="text-sm text-yellow-700 mb-4">
                    If your role was recently changed by an admin, you might need to refresh your session to access your new dashboard.
                  </p>
                  <RoleRefreshButton />
                </div>

                {profile.onboarding_completed && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Onboarding Complete</h3>
                    <p className="text-sm text-green-700">
                      ✅ You've completed all required onboarding steps and have full access to the system.
                    </p>
                  </div>
                )}

                {profile.last_sign_in && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Last Activity</h3>
                    <p className="text-sm text-gray-700">
                      Last signed in: {new Date(profile.last_sign_in).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
