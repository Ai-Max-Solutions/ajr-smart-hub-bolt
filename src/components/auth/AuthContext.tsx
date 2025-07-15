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
              // Check if user exists in Users table and onboarding status
              const { data: userData } = await supabase
                .from('Users')
                .select('whalesync_postgres_id, firstname, lastname, onboarding_completed')
                .eq('supabase_auth_id', session.user.id)
                .single();
              
              // Update last sign in for the user
              await supabase
                .from('Users')
                .update({ last_sign_in: new Date().toISOString() })
                .eq('supabase_auth_id', session.user.id);
              
              // If user hasn't completed onboarding, redirect to onboarding flow
              if (userData && !userData.onboarding_completed) {
                window.location.href = '/onboarding/signup';
                return;
              }
              
              // If user profile is incomplete (no names), redirect to personal details
              if (userData && (!userData.firstname || !userData.lastname)) {
                window.location.href = '/onboarding/personal-details';
                return;
              }
              
              // Check CSCS card status
              if (userData) {
                const { data: cscsStatus } = await supabase.rpc('check_user_cscs_status', {
                  p_user_id: userData.whalesync_postgres_id
                });
                
                // If CSCS card is missing, expired, or invalid, redirect to CSCS onboarding
                if (cscsStatus && typeof cscsStatus === 'object' && 'is_valid' in cscsStatus && !cscsStatus.is_valid) {
                  window.location.href = '/onboarding/cscs';
                  return;
                }
              }
              
              toast.success('Successfully signed in!');
            } catch (error) {
              console.error('Error handling sign in:', error);
              // If user doesn't exist in Users table, they're new - redirect to onboarding
              window.location.href = '/onboarding/signup';
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

      // If user was created, also create entry in Users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('Users')
          .insert({
            supabase_auth_id: data.user.id,
            email: data.user.email,
            firstname: userData?.first_name || '',
            lastname: userData?.last_name || '',
            fullname: userData?.full_name || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim(),
            role: 'Operative',
            employmentstatus: 'Active',
            auth_provider: 'supabase',
            system_role: 'Worker'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
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

      // Check if user has a record in Users table, create if missing
      if (data.user) {
        const { data: existingUser, error: userError } = await supabase
          .from('Users')
          .select('whalesync_postgres_id')
          .eq('supabase_auth_id', data.user.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // User doesn't exist in Users table, create record
          const { error: createError } = await supabase
            .from('Users')
            .insert({
              supabase_auth_id: data.user.id,
              email: data.user.email,
              firstname: '',
              lastname: '',
              fullname: '',
              role: 'Operative',
              employmentstatus: 'Active',
              auth_provider: 'supabase',
              system_role: 'Worker',
              onboarding_completed: false,
              cscs_upload_required: true,
              cscs_validation_status: 'pending'
            });

          if (createError) {
            console.error('Error creating user profile:', createError);
            toast.error('Error setting up user profile');
            return { error: createError };
          }
        }
      }

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