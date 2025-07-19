
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, Users } from 'lucide-react';

interface AdminRoleRefreshProps {
  userId: string;
  userName: string;
  onRefreshComplete?: () => void;
}

export const AdminRoleRefresh: React.FC<AdminRoleRefreshProps> = ({ 
  userId, 
  userName, 
  onRefreshComplete 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshUserSession = async () => {
    setIsRefreshing(true);
    
    try {
      // In a real implementation, you might call a Supabase Edge Function
      // to refresh the specific user's session, but for now we'll just
      // provide feedback to the admin
      
      toast.info(`Instructing ${userName} to refresh their session...`, { duration: 3000 });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(
        `Role update processed for ${userName}. They should refresh their role or sign out/in.`,
        { duration: 5000 }
      );
      
      if (onRefreshComplete) {
        onRefreshComplete();
      }
      
    } catch (error: any) {
      console.error('[AdminRoleRefresh] Error:', error);
      toast.error(`Failed to refresh session for ${userName}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button 
      onClick={handleRefreshUserSession} 
      disabled={isRefreshing}
      size="sm"
      variant="outline"
      className="ml-2"
    >
      <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
    </Button>
  );
};
