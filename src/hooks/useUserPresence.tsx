import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  // Update current user presence
  const updatePresence = useCallback(async (
    status: 'online' | 'away' | 'busy' | 'offline' = 'online',
    location?: string,
    customStatus?: string
  ) => {
    if (!user) return;

    try {
      await supabase.rpc('update_user_presence', {
        p_status: status,
        p_location: location,
        p_custom_status: customStatus
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Fetch all user presence data
  const fetchPresence = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          *,
          user:Users!user_presence_user_id_fkey (
            fullname,
            role
          )
        `);

      if (error) throw error;

      const presenceMap: Record<string, UserPresence> = {};
      const online: UserPresence[] = [];

      (data || []).forEach((item: any) => {
        const presence: UserPresence = {
          id: item.id,
          user_id: item.user_id,
          status: item.status,
          last_seen: item.last_seen,
          current_location: item.current_location,
          device_info: item.device_info,
          custom_status: item.custom_status,
          updated_at: item.updated_at,
          user: item.user
        };

        presenceMap[item.user_id] = presence;

        if (item.status === 'online' || item.status === 'away' || item.status === 'busy') {
          online.push(presence);
        }
      });

      setPresenceData(presenceMap);
      setOnlineUsers(online);
    } catch (error) {
      console.error('Error fetching presence:', error);
    }
  }, []);

  // Set up real-time presence subscription
  useEffect(() => {
    if (!user) return;

    // Update presence to online when component mounts
    updatePresence('online', window.location.pathname);

    // Set up real-time subscription
    const channel = supabase
      .channel('presence-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const presence = payload.new as UserPresence;
            setPresenceData(prev => ({
              ...prev,
              [presence.user_id]: presence
            }));

            if (presence.status === 'online' || presence.status === 'away' || presence.status === 'busy') {
              setOnlineUsers(prev => {
                const filtered = prev.filter(p => p.user_id !== presence.user_id);
                return [...filtered, presence];
              });
            } else {
              setOnlineUsers(prev => prev.filter(p => p.user_id !== presence.user_id));
            }
          } else if (payload.eventType === 'DELETE') {
            const presence = payload.old as UserPresence;
            setPresenceData(prev => {
              const { [presence.user_id]: removed, ...rest } = prev;
              return rest;
            });
            setOnlineUsers(prev => prev.filter(p => p.user_id !== presence.user_id));
          }
        }
      )
      .subscribe();

    // Update presence periodically
    const presenceInterval = setInterval(() => {
      updatePresence('online', window.location.pathname);
    }, 30000); // Every 30 seconds

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online', window.location.pathname);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page unload
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(presenceInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence('offline');
    };
  }, [user, updatePresence]);

  // Initial fetch
  useEffect(() => {
    fetchPresence();
  }, [fetchPresence]);

  return {
    presenceData,
    onlineUsers,
    updatePresence,
    fetchPresence
  };
};