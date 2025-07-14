import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';

export interface UserProfile {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  fullname: string;
  role: string;
  system_role: string;
  employmentstatus: string;
  currentproject?: string;
  skills?: string[];
  department?: string;
  phone?: string;
  primaryskill?: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('Users')
          .select(`
            whalesync_postgres_id,
            email,
            firstname,
            lastname,
            fullname,
            role,
            system_role,
            employmentstatus,
            currentproject,
            skills,
            phone,
            primaryskill
          `)
          .eq('supabase_auth_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setError(error.message);
        } else if (data) {
          setProfile({
            id: data.whalesync_postgres_id,
            email: data.email,
            firstname: data.firstname || '',
            lastname: data.lastname || '',
            fullname: data.fullname || '',
            role: data.role || 'Operative',
            system_role: data.system_role || 'Worker',
            employmentstatus: data.employmentstatus || 'Active',
            currentproject: data.currentproject,
            skills: data.skills,
            phone: data.phone,
            primaryskill: data.primaryskill
          });
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading, error };
};