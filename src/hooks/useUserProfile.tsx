
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
  currentproject: string;
  skills: string[];
  phone: string;
  primaryskill: string;
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
          firstname: userData.name?.split(' ')[0] || '',
          lastname: userData.name?.split(' ').slice(1).join(' ') || '',
          fullname: userData.name || '',
          role: userData.role,
          system_role: userData.role,
          employmentstatus: 'Active',
          currentproject: '',
          skills: [],
          phone: userData.phone || '',
          primaryskill: ''
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

      const { error } = await supabase
        .from('users')
        .update(updates)
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
