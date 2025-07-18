
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RefreshCw, Zap } from 'lucide-react';

type UserRole = 'Operative' | 'PM' | 'Supervisor' | 'Admin' | 'Director';

export const RoleTestingPanel = () => {
  const { userProfile, refreshSession } = useAuth();
  const [testEmail, setTestEmail] = useState('markcroud@icloud.com');
  const [testRole, setTestRole] = useState<UserRole>('PM');
  const [isUpdating, setIsUpdating] = useState(false);

  const updateUserRole = async () => {
    if (!testEmail || !testRole) {
      toast.error('Please provide both email and role');
      return;
    }

    setIsUpdating(true);
    try {
      // Update role in database
      const { error } = await supabase
        .from('users')
        .update({ role: testRole })
        .eq('email', testEmail);

      if (error) {
        toast.error(`Failed to update role: ${error.message}`);
        return;
      }

      toast.success(`Role updated to ${testRole} for ${testEmail}`);
      
      // If updating current user, refresh session
      if (testEmail === userProfile?.email) {
        toast.info("Refreshing your session to apply new role...");
        setTimeout(() => {
          refreshSession();
        }, 1000);
      }
    } catch (error: any) {
      toast.error('Unexpected error updating role');
      console.error('Role update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Role Testing Panel
        </CardTitle>
        <CardDescription>
          Update user roles and test session refresh
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">User Email</Label>
          <Input
            id="test-email"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-role">New Role</Label>
          <Select value={testRole} onValueChange={(value) => setTestRole(value as UserRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Operative">Operative</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
              <SelectItem value="Supervisor">Supervisor</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Director">Director</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={updateUserRole} 
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? 'Updating...' : 'Update Role'}
          </Button>
          
          <Button 
            onClick={refreshSession} 
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh My Session
          </Button>
        </div>

        {userProfile && (
          <div className="text-sm text-muted-foreground">
            <p><strong>Current Role:</strong> {userProfile.role}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
            <p><strong>Onboarding:</strong> {userProfile.onboarding_completed ? 'Complete' : 'Incomplete'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
