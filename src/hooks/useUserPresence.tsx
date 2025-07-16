import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UserPresence {
  id: string;
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  current_location?: string;
  device_info: any;
  custom_status?: string;
  updated_at: string;
  user?: {
    fullname: string;
    role: string;
  };
}

export const useUserPresence = () => {
  const { user } = useAuth();
  const [presenceData, setPresenceData] = useState<Record<string, UserPresence>>({});
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);

  // Mock presence data
  const mockPresence: UserPresence[] = [
    {
      id: 'presence1',
      user_id: 'user1',
      status: 'online',
      last_seen: new Date().toISOString(),
      current_location: 'Site A',
      device_info: { type: 'mobile', platform: 'android' },
      custom_status: 'Available',
      updated_at: new Date().toISOString(),
      user: { fullname: 'John Smith', role: 'Operative' }
    },
    {
      id: 'presence2',
      user_id: 'user2',
      status: 'away',
      last_seen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      current_location: 'Site B',
      device_info: { type: 'desktop', platform: 'windows' },
      updated_at: new Date().toISOString(),
      user: { fullname: 'Jane Doe', role: 'Supervisor' }
    },
    {
      id: 'presence3',
      user_id: 'user3',
      status: 'busy',
      last_seen: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      current_location: 'Office',
      device_info: { type: 'tablet', platform: 'ios' },
      custom_status: 'In meeting',
      updated_at: new Date().toISOString(),
      user: { fullname: 'Mike Johnson', role: 'Project Manager' }
    }
  ];

  // Update current user presence (mock implementation)
  const updatePresence = useCallback(async (
    status: 'online' | 'away' | 'busy' | 'offline' = 'online',
    location?: string,
    customStatus?: string
  ) => {
    if (!user) return;

    try {
      // Mock presence update
      console.log('Updating presence:', {
        user_id: user.id,
        status,
        location,
        customStatus,
        timestamp: new Date().toISOString()
      });

      // Update local state if current user
      const updatedPresence: UserPresence = {
        id: `presence_${user.id}`,
        user_id: user.id,
        status,
        last_seen: new Date().toISOString(),
        current_location: location,
        device_info: { type: 'browser', platform: 'web' },
        custom_status: customStatus,
        updated_at: new Date().toISOString(),
        user: { fullname: 'Current User', role: 'User' }
      };

      setPresenceData(prev => ({
        ...prev,
        [user.id]: updatedPresence
      }));
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Fetch all user presence data (mock implementation)
  const fetchPresence = useCallback(async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const presenceMap: Record<string, UserPresence> = {};
      mockPresence.forEach(presence => {
        presenceMap[presence.user_id] = presence;
      });

      setPresenceData(presenceMap);
      setOnlineUsers(mockPresence.filter(p => p.status === 'online'));
    } catch (error) {
      console.error('Error fetching presence:', error);
    }
  }, []);

  // Get user presence by ID
  const getUserPresence = useCallback((userId: string): UserPresence | null => {
    return presenceData[userId] || null;
  }, [presenceData]);

  // Get users by status
  const getUsersByStatus = useCallback((status: UserPresence['status']): UserPresence[] => {
    return Object.values(presenceData).filter(presence => presence.status === status);
  }, [presenceData]);

  // Get users at location
  const getUsersAtLocation = useCallback((location: string): UserPresence[] => {
    return Object.values(presenceData).filter(presence => 
      presence.current_location?.toLowerCase().includes(location.toLowerCase())
    );
  }, [presenceData]);

  // Set custom status
  const setCustomStatus = useCallback(async (status: string) => {
    if (!user) return;

    try {
      await updatePresence('online', undefined, status);
    } catch (error) {
      console.error('Error setting custom status:', error);
    }
  }, [user, updatePresence]);

  // Go offline
  const goOffline = useCallback(async () => {
    if (!user) return;

    try {
      await updatePresence('offline');
    } catch (error) {
      console.error('Error going offline:', error);
    }
  }, [user, updatePresence]);

  // Start heartbeat (mock implementation)
  const startHeartbeat = useCallback(() => {
    if (!user) return;

    const interval = setInterval(() => {
      updatePresence('online');
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user, updatePresence]);

  // Track location (mock implementation)
  const trackLocation = useCallback(async (location: string) => {
    if (!user) return;

    try {
      await updatePresence('online', location);
    } catch (error) {
      console.error('Error tracking location:', error);
    }
  }, [user, updatePresence]);

  // Initialize presence
  useEffect(() => {
    fetchPresence();
    
    if (user) {
      updatePresence('online');
      const cleanup = startHeartbeat();
      
      // Update presence when user becomes active
      const handleActivity = () => updatePresence('online');
      const handleVisibilityChange = () => {
        if (document.hidden) {
          updatePresence('away');
        } else {
          updatePresence('online');
        }
      };

      document.addEventListener('click', handleActivity);
      document.addEventListener('keypress', handleActivity);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        cleanup?.();
        document.removeEventListener('click', handleActivity);
        document.removeEventListener('keypress', handleActivity);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        goOffline();
      };
    }
  }, [user, fetchPresence, updatePresence, startHeartbeat, goOffline]);

  return {
    presenceData,
    onlineUsers,
    updatePresence,
    fetchPresence,
    getUserPresence,
    getUsersByStatus,
    getUsersAtLocation,
    setCustomStatus,
    goOffline,
    trackLocation
  };
};