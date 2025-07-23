
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const handleAuthError = (error: any) => {
  console.error('Auth error:', error);
  
  if (error?.message?.includes('Invalid login credentials')) {
    toast.error('Invalid email or password');
  } else if (error?.message?.includes('Email not confirmed')) {
    toast.error('Please check your email and click the confirmation link');
  } else if (error?.message?.includes('User not found')) {
    toast.error('No account found with this email');
  } else if (error?.message?.includes('Invalid refresh token')) {
    toast.error('Session expired. Please sign in again');
  } else {
    toast.error(error?.message || 'Authentication failed');
  }
};

export const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries = 3,
  delay = 1000
): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

export const ensureUserProfile = async (user: any) => {
  if (!user) return null;
  
  try {
    // Check if user profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_auth_id', user.id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return null;
    }
    
    if (existingProfile) {
      return existingProfile;
    }
    
    // Create profile if it doesn't exist
    const { data: newProfile, error: insertError } = await supabase
      .from('users')
      .insert({
        supabase_auth_id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
        role: 'Operative',
        is_verified: false,
        account_status: 'trial',
        trial_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return null;
    }
    
    return newProfile;
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return null;
  }
};
