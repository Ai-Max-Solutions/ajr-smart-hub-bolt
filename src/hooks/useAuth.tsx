
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

  // Handle profile updates asynchronously outside of auth state change
  const handleProfileUpdate = async (user: User) => {
    try {
      console.log('📊 Fetching user profile for verification check...');
      
      const userData = await fetchUserProfileSafe(user.id);

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
        email: user.email
      });

      setUserProfile(userData);

      // Check account status and trial expiry
      const isAdminRole = ['Admin', 'Director', 'PM'].includes(userData?.role);
      const accountStatus = userData?.account_status;
      const trialExpired = userData?.trial_expires_at && new Date(userData.trial_expires_at) < new Date();
      
      console.log('🛡️ Account status check:', {
        role: userData?.role,
        account_status: accountStatus,
        trial_expires_at: userData?.trial_expires_at,
        trialExpired,
        isAdminRole
      });

      // Determine if user has access
      let hasAccess = false;
      
      if (isAdminRole) {
        hasAccess = true;
        console.log('✅ Admin access granted');
      } else if (accountStatus === 'active') {
        hasAccess = true;
        console.log('✅ Active account access granted');
      } else if (accountStatus === 'trial' && !trialExpired) {
        hasAccess = true;
        console.log('✅ Trial access granted');
      } else {
        hasAccess = false;
        console.log('❌ Access denied - account expired or suspended');
      }
      
      setIsVerified(hasAccess);

      // Update last sign in without calling the problematic function
      try {
        await supabase
          .from('users')
          .update({ last_sign_in: new Date().toISOString() })
          .eq('supabase_auth_id', user.id);
      } catch (updateError) {
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
    } catch (error) {
      console.error('Profile update failed:', error);
      // For network errors, don't block admin access
      const isAdminEmail = user.email?.includes('@ajryan.') || 
                          user.email === 'markcroud@icloud.com';
      if (isAdminEmail) {
        console.log('🚨 Admin email detected during error, granting access');
        setIsVerified(true);
      } else {
        setIsVerified(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (!mounted) return;

        console.log('🔐 Initial session loaded:', session?.user?.email);
        setUser(session?.user ?? null);
        setSession(session);
        
        if (session?.user) {
          // Defer profile update to avoid blocking auth initialization
          setTimeout(() => {
            if (mounted) {
              handleProfileUpdate(session.user);
            }
          }, 100);
        } else {
          setIsVerified(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes - CRITICAL: No async in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        // Only synchronous state updates in callback
        setUser(session?.user ?? null);
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
        // Defer any async operations outside the callback
          setTimeout(() => {
            if (mounted) {
              handleProfileUpdate(session.user);
            }
          }, 100);
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setIsVerified(false);
          
          // Defer navigation to avoid conflicts
          setTimeout(() => {
            if (mounted && !location.pathname.startsWith('/auth')) {
              navigate('/auth');
            }
          }, 0);
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
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

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: metadata,
        },
      });

      // If signup successful but no user profile was created, try to create it manually
      if (!error && data.user && !data.session) {
        try {
          // Give the trigger a moment to run, then check if profile exists
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('supabase_auth_id', data.user.id)
              .single();
            
            if (!profile) {
              console.warn('Profile not created by trigger, calling ensure function');
              await supabase.rpc('ensure_user_profile', { auth_user_id: data.user.id });
            }
          }, 1000);
        } catch (fallbackError) {
          console.warn('Fallback profile creation failed:', fallbackError);
        }
      }
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
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
      console.error('Reset password error:', error);
      return { error };
    }
  };

  const checkActivationStatus = (userProfile: any) => {
    if (!userProfile) return ACTIVATION_STATUS.PROVISIONAL;
    
    const now = new Date();
    const expiry = userProfile.trial_expires_at ? new Date(userProfile.trial_expires_at) : null;
    
    // Map account_status to activation status
    const accountStatus = userProfile.account_status;
    if (accountStatus === 'trial' && expiry && now > expiry) {
      return ACTIVATION_STATUS.PENDING;
    }
    
    // Map account status to activation status enum
    switch (accountStatus) {
      case 'active': return ACTIVATION_STATUS.ACTIVE;
      case 'trial': return ACTIVATION_STATUS.PROVISIONAL;
      case 'suspended': return ACTIVATION_STATUS.PENDING;
      default: return ACTIVATION_STATUS.PROVISIONAL;
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
    checkActivationStatus,
    signIn,
    signUp,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
