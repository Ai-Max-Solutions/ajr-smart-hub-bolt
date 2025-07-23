import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { validateEmail, validatePasswordStrength } from '@/utils/inputSanitization';
import { ACTIVATION_STATUS } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any;
  loading: boolean;
  isVerified: boolean;
  checkActivationStatus: (userProfile: any) => string;
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

  // Fetch user profile safely using direct database query
  const fetchUserProfileSafe = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('supabase_auth_id', authId)
        .single();
      
      if (error) {
        console.warn('Failed to fetch user profile safely:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

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
                
                // Use the safe fetch function
                const userData = await fetchUserProfileSafe(session.user.id);

                if (!userData) {
                  console.warn('Failed to fetch user data safely');
                  setIsVerified(false);
                  setUserProfile(null);
                  return;
                }

                console.log('👤 User profile loaded:', {
                  name: userData?.name,
                  role: userData?.role,
                  is_verified: userData?.is_verified,
                  email: session.user.email
                });

                // Set the user profile in state
                setUserProfile(userData);

                // Check account status and trial expiry
                const isAdminRole = ['Admin', 'Director', 'PM'].includes(userData?.role);
                const accountStatus = (userData as any)?.account_status;
                const trialExpired = (userData as any)?.trial_expires_at && new Date((userData as any).trial_expires_at) < new Date();
                
                console.log('🛡️ Account status check:', {
                  role: userData?.role,
                  account_status: accountStatus,
                  trial_expires_at: (userData as any)?.trial_expires_at,
                  trialExpired,
                  isAdminRole
                });

                // Determine if user has access
                let hasAccess = false;
                
                if (isAdminRole) {
                  // Admins always have access
                  hasAccess = true;
                  console.log('✅ Admin access granted');
                } else if (accountStatus === 'active') {
                  // Permanently activated users have access
                  hasAccess = true;
                  console.log('✅ Active account access granted');
                } else if (accountStatus === 'trial' && !trialExpired) {
                  // Trial users within trial period have access
                  hasAccess = true;
                  console.log('✅ Trial access granted');
                } else {
                  // Expired or suspended accounts don't have access
                  hasAccess = false;
                  console.log('❌ Access denied - account expired or suspended');
                }
                
                setIsVerified(hasAccess);

                // Update last sign in
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ last_sign_in: new Date().toISOString() })
                  .eq('supabase_auth_id', session.user.id);

                if (updateError) {
                  console.warn('Failed to update last sign in:', updateError);
                }

                // Handle navigation based on access
                if (!hasAccess) {
                  console.log('❌ User denied access, redirecting to under-review');
                  if (!location.pathname.startsWith('/under-review') && !location.pathname.startsWith('/auth')) {
                    navigate('/under-review');
                  }
                } else {
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
      (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setSession(session);
        
        setTimeout(async () => {
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
            // Clear all user state
            setUser(null);
            setUserProfile(null);
            setIsVerified(false);
            
            // Only redirect if not already on auth page
            if (!location.pathname.startsWith('/auth')) {
              navigate('/auth');
            }
          }
          
          setLoading(false);
        }, 0);
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
      // Validate password strength before attempting signup
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return { error: { message: passwordValidation.message } };
      }

      // Sanitize and validate email
      if (!validateEmail(email)) {
        return { error: { message: 'Please enter a valid email address' } };
      }

      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
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

  const checkActivationStatus = (userProfile: any) => {
    if (!userProfile) return ACTIVATION_STATUS.PROVISIONAL;
    
    const now = new Date();
    const expiry = userProfile.activation_expiry ? new Date(userProfile.activation_expiry) : null;
    
    if (userProfile.activation_status === ACTIVATION_STATUS.PROVISIONAL && expiry && now > expiry) {
      return ACTIVATION_STATUS.PENDING;
    }
    
    return userProfile.activation_status || ACTIVATION_STATUS.PROVISIONAL;
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
    checkActivationStatus,
    signIn,
    signUp,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
