import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any;
  loading: boolean;
  isVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Debounced fetch function to prevent rapid-fire requests
  const debouncedFetch = (() => {
    let timeoutId: any;
    return (fn: Function, delay: number) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(fn, delay);
    };
  })();

  // Retry logic for failed requests
  const withRetry = async (fn: Function, maxAttempts = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.warn(`Auth retry attempt ${attempt}/${maxAttempts}:`, error);
        if (attempt === maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        console.log('🔐 Initial session loaded:', session?.user?.email);
        setUser(session?.user ?? null);
        setSession(session);
        
        if (session?.user) {
          // Debounce the profile fetch to avoid race conditions
          debouncedFetch(async () => {
            try {
              await withRetry(async () => {
                console.log('📊 Fetching user profile for verification check...');
                
                // Update last sign in and check verification status
                const { data: userData, error: fetchError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('supabase_auth_id', session.user.id)
                  .single() as { data: any; error: any };

                if (fetchError) {
                  console.warn('Failed to fetch user data:', fetchError);
                  setIsVerified(false);
                  return;
                }

                console.log('👤 User profile loaded:', {
                  role: userData?.role,
                  is_verified: userData?.is_verified,
                  email: session.user.email
                });

                // STRENGTHENED ADMIN BYPASS - Admins and Directors always bypass verification
                const isAdminRole = ['Admin', 'Director', 'PM'].includes(userData?.role);
                const shouldBypassVerification = isAdminRole;
                
                console.log('🛡️ Admin bypass check:', {
                  role: userData?.role,
                  isAdminRole,
                  shouldBypassVerification,
                  original_is_verified: userData?.is_verified
                });

                if (shouldBypassVerification) {
                  console.log('✅ Admin bypass granted - skipping verification requirement');
                  setIsVerified(true);
                } else {
                  setIsVerified(userData?.is_verified || false);
                }

                // Update last sign in
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ last_sign_in: new Date().toISOString() })
                  .eq('supabase_auth_id', session.user.id);

                if (updateError) {
                  console.warn('Failed to update last sign in:', updateError);
                }

                // Only redirect non-admin users who aren't verified
                if (!shouldBypassVerification && !userData?.is_verified) {
                  console.log('❌ Non-admin user not verified, redirecting to under-review');
                  if (!location.pathname.startsWith('/under-review') && !location.pathname.startsWith('/auth')) {
                    navigate('/under-review');
                  }
                } else if (shouldBypassVerification || userData?.is_verified) {
                  console.log('✅ User has access, ensuring not stuck on under-review page');
                  if (location.pathname.startsWith('/under-review')) {
                    navigate('/');
                  }
                }
              });
            } catch (error) {
              console.error('Auth profile update failed:', error);
              // For network errors, don't block admin access
              const isAdminEmail = session.user.email?.includes('@ajryan.') || 
                                  session.user.email === 'markcroud@icloud.com';
              if (isAdminEmail) {
                console.log('🚨 Admin email detected during error, granting access');
                setIsVerified(true);
              } else {
                setIsVerified(false);
              }
            }
          }, 300);
        } else {
          setIsVerified(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Debounce profile updates on sign in
          debouncedFetch(async () => {
            try {
              await withRetry(async () => {
                const { error } = await supabase
                  .from('users')
                  .update({ last_sign_in: new Date().toISOString() })
                  .eq('supabase_auth_id', session.user.id);

                if (error) {
                  console.warn('Failed to update last sign in:', error);
                }
              });
            } catch (error) {
              console.warn('Sign in profile update failed:', error);
            }
          }, 300);
        }
        
        if (event === 'SIGNED_OUT') {
          // Clear any pending debounced calls
          setUser(null);
          setIsVerified(false);
          
          // Only redirect if not already on auth page
          if (!location.pathname.startsWith('/auth')) {
            navigate('/auth');
          }
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: metadata,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    isVerified,
    signIn,
    signUp,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
