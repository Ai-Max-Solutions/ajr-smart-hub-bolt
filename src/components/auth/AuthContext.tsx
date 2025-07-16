
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          // Handle user data asynchronously without blocking
          setTimeout(async () => {
             try {
                // Check if user exists using the correct table name
                const { data: userData } = await supabase
                  .from('users')
                  .select('id, name, role')
                  .eq('supabase_auth_id', session.user.id)
                  .maybeSingle();
               
               // Update last sign in for the user (mock operation since column doesn't exist)
               // await supabase
               //   .from('users')
               //   .update({ updated_at: new Date().toISOString() })
               //   .eq('supabase_auth_id', session.user.id);
               
               // Check if user needs onboarding (placeholder for future implementation)
               
               // If user profile is incomplete (no name), redirect to personal details
               if (userData && !userData.name) {
                 return;
               }
               
                // Mock CSCS card status check since function doesn't exist
                if (userData) {
                  // Mock: assume CSCS is valid
                  const cscsStatus = { is_valid: true };
                 
                 // If CSCS card is missing, expired, or invalid, redirect to CSCS onboarding
                 if (cscsStatus && typeof cscsStatus === 'object' && 'is_valid' in cscsStatus && !cscsStatus.is_valid) {
                  return;
                }
              }
              
              toast.success('Successfully signed in!');
            } catch (error) {
              console.error('Error handling sign in:', error);
              // If user doesn't exist in Users table, they're new - redirect to onboarding
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out!');
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
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

      // The triggers handle user profile creation automatically
      // No need to manually insert into Users table

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

      // The triggers handle user profile creation automatically
      // No need to manually check or create Users table entries

      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred during sign out');
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

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
