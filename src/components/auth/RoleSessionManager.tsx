
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const RoleSessionManager = () => {
  const { user, userProfile, refreshSession, forceProfileRefresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRefreshed, setHasRefreshed] = useState(false);

  // Role to dashboard mapping
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

  useEffect(() => {
    const handleRoleRefresh = async () => {
      // Only run once per session and only for authenticated users
      if (!user || hasRefreshed) return;
      
      // Skip if already on auth pages
      if (location.pathname.startsWith('/auth') || location.pathname.startsWith('/onboarding')) {
        return;
      }

      console.log('[RoleSessionManager] Starting role refresh for user:', user.id);
      
      try {
        // First, refresh the session to get latest tokens
        const { success } = await refreshSession();
        
        if (success) {
          console.log('[RoleSessionManager] Session refreshed successfully');
          
          // Small delay to ensure profile is updated
          setTimeout(async () => {
            await forceProfileRefresh();
            
            // Check if we need to redirect based on role
            if (userProfile?.role) {
              const expectedDashboard = getRoleDashboard(userProfile.role);
              const currentPath = location.pathname;
              
              console.log('[RoleSessionManager] Role check:', {
                role: userProfile.role,
                currentPath,
                expectedDashboard
              });
              
              // Only redirect if we're not already on the correct dashboard path
              if (!currentPath.startsWith(expectedDashboard)) {
                console.log('[RoleSessionManager] Redirecting to correct dashboard:', expectedDashboard);
                toast.success(`Welcome back! Routing to your ${userProfile.role} dashboard.`);
                navigate(expectedDashboard, { replace: true });
              }
            }
          }, 500);
        } else {
          console.log('[RoleSessionManager] Session refresh failed, using existing session');
        }
        
        setHasRefreshed(true);
      } catch (error) {
        console.error('[RoleSessionManager] Error during role refresh:', error);
        setHasRefreshed(true);
      }
    };

    // Run the refresh check
    handleRoleRefresh();
  }, [user, hasRefreshed, refreshSession, forceProfileRefresh, userProfile?.role, navigate, location.pathname]);

  // This component doesn't render anything
  return null;
};
