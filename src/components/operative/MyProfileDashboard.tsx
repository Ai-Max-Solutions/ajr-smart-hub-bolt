
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Calendar, Building, AlertCircle, RefreshCw } from 'lucide-react';
import { RoleTestingPanel } from '@/components/admin/RoleTestingPanel';

export const MyProfileDashboard = () => {
  const { profile, loading, error } = useUserProfile();
  const { userProfile, refreshSession } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading profile: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button onClick={refreshSession} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Session
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your profile details and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{profile?.fullname || `${profile?.firstname} ${profile?.lastname}`}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.auth_email}</span>
              </div>
              
              {profile?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{profile?.role}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Employment Status: {profile?.employmentstatus}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Onboarding Status</h4>
              <Badge variant={profile?.onboarding_completed ? "default" : "secondary"}>
                {profile?.onboarding_completed ? "Complete" : "In Progress"}
              </Badge>
            </div>

            {profile?.currentproject && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Current Project</h4>
                  <span className="text-sm text-muted-foreground">{profile.currentproject}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Role Testing Panel - Show for all users for testing */}
        <RoleTestingPanel />
      </div>
    </div>
  );
};
