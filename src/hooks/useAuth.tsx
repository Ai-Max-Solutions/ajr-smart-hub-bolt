import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  current_project?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes - NO ASYNC to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          // Defer profile fetching to avoid blocking auth state updates
          setTimeout(() => {
            fetchUserProfile(session.user);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('Users')
        .select('whalesync_postgres_id, email, fullname, role, currentproject')
        .eq('supabase_auth_id', authUser.id)
        .single();

      if (error) {
        console.error('Database profile fetch failed:', error);
        // Fallback: create basic user from auth data
        setUser({
          user_id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          role: 'Operative',
          current_project: undefined
        });
        setLoading(false);
        return;
      }

      setUser({
        user_id: data.whalesync_postgres_id,
        email: data.email || authUser.email || '',
        full_name: data.fullname || '',
        role: data.role || 'Operative',
        current_project: data.currentproject
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback: create basic user from auth data
      setUser({
        user_id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        role: 'Operative',
        current_project: undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};