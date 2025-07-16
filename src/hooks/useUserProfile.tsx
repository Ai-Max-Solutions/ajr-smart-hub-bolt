
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';

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
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('supabase_auth_id', user.id)
        .single();

      if (userError) {
        throw userError;
      }

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
          airtable_created_time: userData.airtable_created_time
        });
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
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

      const { error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('supabase_auth_id', user.id);

      if (error) throw error;

      // Refresh profile data
      await fetchProfile();
    } catch (err: any) {
      console.error('Error updating profile:', err);
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
