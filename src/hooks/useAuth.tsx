import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  refreshSession: () => Promise<{ success: boolean; error?: any }>;
  forceProfileRefresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('supabase_auth_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  // NEW: Force profile refresh with cache clearing
  const forceProfileRefresh = async () => {
    console.log('[Auth] Force refreshing user profile...');
    if (user) {
      // Clear current profile to force fresh fetch
      setUserProfile(null);
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
      console.log('[Auth] Profile force refreshed:', profile);
    }
  };

  // NEW: Session refresh method
  const refreshSession = async (): Promise<{ success: boolean; error?: any }> => {
    try {
      console.log('[Auth] Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[Auth] Session refresh failed:', error);
        return { success: false, error };
      }

      if (data.session) {
        console.log('[Auth] Session refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
        
        // Force profile refresh after session refresh
        setTimeout(() => {
          forceProfileRefresh();
        }, 100);
        
        return { success: true };
      }

      return { success: false, error: 'No session returned' };
    } catch (error) {
      console.error('[Auth] Session refresh error:', error);
      return { success: false, error };
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

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then(setUserProfile);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Account created! Please check your email to verify your account.');
      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Password reset email sent!');
      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Handle harmless 403 "Session not found" errors as success
      if (error && error.message?.includes('session_not_found')) {
        console.log('[Auth] Session already expired, treating as successful logout');
      } else if (error) {
        throw error;
      }
      
      // Clean up local storage
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('onboardingData');
      
      setUser(null);
      setSession(null);
      setUserProfile(null);
      toast.success('Logged out—see ya!');
    } catch (error: any) {
      toast.error('Error signing out: ' + error.message);
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
    refreshProfile,
    refreshSession,
    forceProfileRefresh
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
