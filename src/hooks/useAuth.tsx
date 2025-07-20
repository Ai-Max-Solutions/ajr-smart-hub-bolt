
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseError } from './useSupabaseError';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  userProfile: any;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { withRetry, handleError } = useSupabaseError();

  const fetchUserProfile = async (userId: string) => {
    try {
      return await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('supabase_auth_id', userId)
            .single();

          if (error) throw error;
          return data;
        },
        { 
          operation: 'fetchUserProfile',
          table: 'users',
          userId 
        }
      );
    } catch (error) {
      handleError(error as Error, { 
        operation: 'fetchUserProfile',
        table: 'users',
        userId 
      });
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] Auth state changed:', event, session?.user?.id);
        
        // Ignore TOKEN_REFRESHED events to prevent auth flapping
        if (event === 'TOKEN_REFRESHED') {
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid deadlock with async operations
          setTimeout(() => {
            fetchUserProfile(session.user.id).then(setUserProfile);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session with retry logic
    withRetry(
      async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
      },
      { operation: 'getSession' }
    ).then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then(setUserProfile);
      }
      
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const result = await withRetry(
        async () => {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
              data: userData
            }
          });

          if (error) throw error;
          return data;
        },
        { operation: 'signUp' }
      );

      toast.success('Account created! Please check your email to verify your account.');
      return { error: null };
    } catch (error: any) {
      handleError(error, { operation: 'signUp' });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await withRetry(
        async () => {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;
          return data;
        },
        { operation: 'signIn' }
      );

      return { error: null };
    } catch (error: any) {
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('🔐 Wrong keys for this lock - check your email and password!');
      } else {
        handleError(error, { operation: 'signIn' });
      }
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await withRetry(
        async () => {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          });

          if (error) throw error;
        },
        { operation: 'resetPassword' }
      );

      toast.success('Password reset email sent!');
      return { error: null };
    } catch (error: any) {
      handleError(error, { operation: 'resetPassword' });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await withRetry(
        async () => {
          const { error } = await supabase.auth.signOut();
          
          // Handle harmless 403 "Session not found" errors as success
          if (error && error.message?.includes('session_not_found')) {
            console.log('[Auth] Session already expired, treating as successful logout');
            return;
          } else if (error) {
            throw error;
          }
        },
        { operation: 'signOut' },
        1 // Only retry once for sign out
      );
      
      // Clean up local storage
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('onboardingData');
      
      setUser(null);
      setSession(null);
      setUserProfile(null);
      toast.success('Logged out—see ya!');
    } catch (error: any) {
      // For sign out, even if it fails, clear local state
      setUser(null);
      setSession(null);
      setUserProfile(null);
      handleError(error, { operation: 'signOut' });
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    userProfile,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
