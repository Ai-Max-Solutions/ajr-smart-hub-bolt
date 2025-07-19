
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { RefreshCw, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const ManualRoleRefresh = () => {
  const { refreshSession, forceProfileRefresh, userProfile, signOut } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const getRoleDashboard = (role: string) => {
    const roleMappings = {
      'pm': '/projects',
      'manager': '/projects', 
      'director': '/director',
      'admin': '/admin',
      'dpo': '/admin',
      'operative': '/operative',
      'supervisor': '/operative'
    };
    
    return roleMappings[role?.toLowerCase()] || '/operative';
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    console.log('[ManualRoleRefresh] Starting manual role refresh...');
    
    try {
      // Refresh session first
      const { success, error } = await refreshSession();
      
      if (!success) {
        throw new Error(error?.message || 'Session refresh failed');
      }
      
      // Force profile refresh
      await forceProfileRefresh();
      
      toast.success('Role refreshed successfully!');
      
      // Navigate to correct dashboard if role changed
      if (userProfile?.role) {
        const correctDashboard = getRoleDashboard(userProfile.role);
        console.log('[ManualRoleRefresh] Navigating to:', correctDashboard);
        navigate(correctDashboard, { replace: true });
      }
      
    } catch (error: any) {
      console.error('[ManualRoleRefresh] Error:', error);
      toast.error(`Refresh failed: ${error.message}. Try signing out and back in.`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualSignOut = async () => {
    toast.info('Signing you out for a fresh session...');
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Role & Session Management</h3>
        <p className="text-sm text-muted-foreground">
          If your role was recently updated and you're not seeing the correct dashboard, 
          use these options to refresh your session.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh My Role'}
        </Button>
        
        <Button
          onClick={handleManualSignOut}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out & Back In
        </Button>
      </div>
      
      {userProfile?.role && (
        <div className="text-sm text-muted-foreground">
          Current role: <span className="font-medium">{userProfile.role}</span>
        </div>
      )}
    </div>
  );
};
