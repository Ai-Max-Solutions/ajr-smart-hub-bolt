
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  work_types?: string[];
  cscs_card?: {
    card_type: string;
    card_color: string;
    qualifications: any;
  } | null;
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
        // Fetch user work types
        const { data: workTypesData } = await supabase
          .from('user_work_types')
          .select('work_type')
          .eq('user_id', userData.id);

        // Fetch CSCS card info
        const { data: cscsData } = await supabase
          .from('cscs_cards')
          .select('card_type, card_color, qualifications')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

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
          work_types: workTypesData?.map(wt => wt.work_type) || [],
          cscs_card: cscsData || null
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
      if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
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
