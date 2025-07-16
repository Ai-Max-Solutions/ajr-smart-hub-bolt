
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

      // Try to fetch from user_view first
      const { data: viewData, error: viewError } = await supabase
        .from('user_view')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (!viewError && viewData) {
        setProfile({
          id: viewData.auth_id,
          auth_email: viewData.auth_email,
          firstname: viewData.firstname,
          lastname: viewData.lastname,
          fullname: viewData.fullname,
          role: viewData.role,
          system_role: viewData.system_role,
          employmentstatus: viewData.employmentstatus,
          currentproject: viewData.currentproject,
          skills: viewData.skills,
          phone: viewData.phone,
          primaryskill: viewData.primaryskill
        });
        return;
      }

      // Fallback to Users table
      const { data: userData, error: userError } = await supabase
        .from('Users')
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
          firstname: userData.firstname,
          lastname: userData.lastname,
          fullname: userData.fullname,
          role: userData.role,
          system_role: userData.system_role,
          employmentstatus: userData.employmentstatus,
          currentproject: userData.currentproject,
          skills: userData.skills,
          phone: userData.phone,
          primaryskill: userData.primaryskill
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
        .from('Users')
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
