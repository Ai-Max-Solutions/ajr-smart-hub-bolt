
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseError } from './useSupabaseError';

interface UserProfile {
  id: string;
  auth_email: string;
  firstname: string;
  lastname: string;
  fullname: string;
  role: string;
  system_role: string;
  employmentstatus: string;
  currentproject: string | null;
  phone: string;
  onboarding_completed: boolean;
  internalnotes: string | null;
  last_sign_in: string | null;
  airtable_created_time: string;
  avatar_url: string | null;
  is_verified: boolean;
}

export const useUserProfile = () => {
  const { user, userProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { withRetry, handleError } = useSupabaseError();

  useEffect(() => {
    if (user && userProfile) {
      // Use the userProfile from auth context when available
      setProfile({
        id: userProfile.id,
        auth_email: user.email || '',
        firstname: userProfile.firstname || '',
        lastname: userProfile.lastname || '',
        fullname: userProfile.fullname || userProfile.name || '',
        role: userProfile.role,
        system_role: userProfile.role,
        employmentstatus: userProfile.employmentstatus || 'Active',
        currentproject: userProfile.currentproject,
        phone: userProfile.phone || '',
        onboarding_completed: userProfile.onboarding_completed || false,
        internalnotes: userProfile.internalnotes,
        last_sign_in: userProfile.last_sign_in,
        airtable_created_time: userProfile.airtable_created_time,
        avatar_url: userProfile.avatar_url,
        is_verified: userProfile.is_verified || false
      });
      setLoading(false);
    } else if (user) {
      // Fallback to fetching profile if not available in auth context
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user, userProfile]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const userData = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('supabase_auth_id', user.id)
            .single();

          if (error) throw error;
          return data as any; // Cast to any to access is_verified field
        },
        { 
          operation: 'fetchUserProfile',
          table: 'users',
          userId: user.id
        }
      );

      if (userData) {
        setProfile({
          id: userData.id,
          auth_email: user.email || '',
          firstname: userData.firstname || '',
          lastname: userData.lastname || '',
          fullname: userData.fullname || '',
          role: userData.role,
          system_role: userData.role,
          employmentstatus: userData.employmentstatus || 'Active',
          currentproject: userData.currentproject,
          phone: userData.phone || '',
          onboarding_completed: userData.onboarding_completed || false,
          internalnotes: userData.internalnotes,
          last_sign_in: userData.last_sign_in,
          airtable_created_time: userData.airtable_created_time,
          avatar_url: userData.avatar_url,
          is_verified: userData.is_verified || false
        });
      }
    } catch (err: any) {
      handleError(err, { 
        operation: 'fetchUserProfile',
        table: 'users',
        userId: user.id
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      setError(null);

      // Map UserProfile updates to database schema
      const dbUpdates: any = {};
      if (updates.firstname !== undefined) dbUpdates.firstname = updates.firstname;
      if (updates.lastname !== undefined) dbUpdates.lastname = updates.lastname;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.employmentstatus !== undefined) dbUpdates.employmentstatus = updates.employmentstatus;
      if (updates.currentproject !== undefined) dbUpdates.currentproject = updates.currentproject;
      if (updates.onboarding_completed !== undefined) dbUpdates.onboarding_completed = updates.onboarding_completed;
      if (updates.internalnotes !== undefined) dbUpdates.internalnotes = updates.internalnotes;
      if (updates.role && ['Operative', 'Supervisor', 'Admin', 'PM', 'Director'].includes(updates.role)) {
        dbUpdates.role = updates.role;
      }

      await withRetry(
        async () => {
          const { error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('supabase_auth_id', user.id);

          if (error) throw error;
        },
        { 
          operation: 'updateUserProfile',
          table: 'users',
          userId: user.id
        }
      );

      // Refresh profile data
      await fetchProfile();
    } catch (err: any) {
      handleError(err, { 
        operation: 'updateUserProfile',
        table: 'users',
        userId: user.id
      });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile
  };
};
