
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Debounced fetch function to prevent rapid-fire requests
  const debouncedFetch = (() => {
    let timeoutId: NodeJS.Timeout;
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
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Debounce the profile fetch to avoid race conditions
          debouncedFetch(async () => {
            try {
              await withRetry(async () => {
                // Update last sign in
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ last_sign_in: new Date().toISOString() })
                  .eq('supabase_auth_id', session.user.id);

                if (updateError) {
                  console.warn('Failed to update last sign in:', updateError);
                }
              });
            } catch (error) {
              console.warn('Auth profile update failed:', error);
            }
          }, 300);
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
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        
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
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
