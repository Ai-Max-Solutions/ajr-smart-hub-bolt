
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { RefreshCw, LogOut } from 'lucide-react';

export const RoleRefreshButton: React.FC = () => {
  const { refreshSession, signOut, userProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const handleRefreshRole = async () => {
    setIsRefreshing(true);
    
    try {
      toast.info('Updating your powers...', { duration: 2000 });
      
      const result = await refreshSession();
      
      if (result.success) {
        toast.success('Role refreshed—heading to your dash!');
        
        // Wait a moment for the profile to update, then navigate
        setTimeout(() => {
          const role = userProfile?.role?.toLowerCase() || 'operative';
          
          console.log('[RoleRefresh] Navigating based on role:', role);
          
          if (role === 'pm') {
            navigate('/projects', { replace: true });
          } else if (role === 'admin' || role === 'dpo') {
            navigate('/admin', { replace: true });
          } else if (role === 'director') {
            navigate('/director', { replace: true });
          } else {
            navigate('/operative', { replace: true });
          }
        }, 1000);
        
      } else {
        throw new Error(result.error?.message || 'Refresh failed');
      }
    } catch (error: any) {
      console.error('[RoleRefresh] Error:', error);
      toast.error(`Refresh failed: ${error.message}. Try signing out and back in.`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualLogout = async () => {
    toast.info('Signing you out for a fresh start...');
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex flex-col gap-3">
      <Button 
        onClick={handleRefreshRole} 
        disabled={isRefreshing}
        className="w-full"
        variant="outline"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Updating Role...' : 'Refresh My Role'}
      </Button>
      
      <Button 
        onClick={handleManualLogout} 
        variant="ghost"
        size="sm"
        className="w-full text-muted-foreground"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out & Back In
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        If your role was recently changed, use this to update your access level
      </p>
    </div>
  );
};
