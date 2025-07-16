import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

interface CSCSAccessGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface CSCSStatus {
  is_valid: boolean;
  status: string;
  reason: string;
  requires_upload: boolean;
  days_until_expiry?: number;
  warning_level?: string;
}

export const CSCSAccessGate: React.FC<CSCSAccessGateProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, session } = useAuth();
  const location = useLocation();
  
  // Determine if we should check CSCS based on route
  const shouldCheckCSCS = !location.pathname.startsWith('/onboarding') && 
                          !location.pathname.startsWith('/auth');
  
  const [cscsStatus, setCSCSStatus] = useState<CSCSStatus | null>(null);
  const [loading, setLoading] = useState(shouldCheckCSCS);

  console.info('[CSCS] Gate Attempt:', location.pathname, 'User:', user?.email, 'ShouldCheck:', shouldCheckCSCS);

  // Early bailout for onboarding routes - return children immediately
  if (location.pathname.startsWith('/onboarding')) {
    console.info('[CSCS] Gate Skipped: onboarding route, no DB query attempted');
    return <>{children}</>;
  }

  // Early bailout for auth routes
  if (location.pathname.startsWith('/auth')) {
    console.info('[CSCS] Gate Skipped: auth route, no DB query attempted');
    return <>{children}</>;
  }

  useEffect(() => {
    const checkCSCSStatus = async () => {
      // EARLY EXIT: Skip CSCS validation for onboarding/auth routes
      if (!shouldCheckCSCS) {
        console.log('[CSCSAccessGate] useEffect skip - route does not require CSCS check');
        return;
      }

      if (!user || !session) {
        console.log('[CSCSAccessGate] No user or session, allowing access');
        setLoading(false);
        return;
      }

      console.log('[CSCSAccessGate] Checking CSCS status for user:', user.id);

      try {
        // First get the user's data including cscs_required flag
        const { data: userData, error: userError } = await supabase
          .from('Users')
          .select('whalesync_postgres_id, email, onboarding_completed, firstname, lastname, cscs_required')
          .eq('supabase_auth_id', user.id)
          .maybeSingle();

        console.log('[CSCSAccessGate] User query result:', { userData, userError, authUserId: user.id });

        if (userError) {
          console.error('[CSCSAccessGate] Error fetching user data:', userError);
          setCSCSStatus({
            is_valid: false,
            status: 'error',
            reason: 'Error fetching user data',
            requires_upload: true
          });
          return;
        }

        if (!userData) {
          console.log('[CSCSAccessGate] User not found in Users table - allowing access for new users');
          setCSCSStatus({
            is_valid: true,
            status: 'new_user',
            reason: 'New user - onboarding required',
            requires_upload: false
          });
          setLoading(false);
          return;
        }

        // EARLY EXIT: If cscs_required is false, skip all CSCS validation
        if (!userData.cscs_required) {
          console.log('[CSCSAccessGate] cscs_required is false, skipping CSCS validation entirely');
          setCSCSStatus({
            is_valid: true,
            status: 'cscs_not_required',
            reason: 'CSCS validation not required for this user',
            requires_upload: false
          });
          setLoading(false);
          return;
        }

        // Query CSCS cards - try with auth ID first, then whalesync ID if needed
        console.log('[CSCSAccessGate] Querying CSCS cards with auth ID:', user.id);
        let { data: cscsCard, error: cscsError } = await supabase
          .from('cscs_cards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('[CSCSAccessGate] CSCS query with auth ID result:', { cscsCard, cscsError });

        // If no card found with auth ID, try with whalesync_postgres_id
        if (!cscsCard && !cscsError) {
          console.log('[CSCSAccessGate] Trying with whalesync_postgres_id:', userData.whalesync_postgres_id);
          const { data: cscsCard2, error: cscsError2 } = await supabase
            .from('cscs_cards')
            .select('*')
            .eq('user_id', userData.whalesync_postgres_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          console.log('[CSCSAccessGate] CSCS query with whalesync ID result:', { cscsCard2, cscsError2 });
          
          // Use the result from the second query
          cscsCard = cscsCard2;
          cscsError = cscsError2;
        }

        console.log('[CSCSAccessGate] Final query result:', { cscsCard, cscsError });

        if (cscsError) {
          console.error('[CSCSAccessGate] Database error:', cscsError);
          setCSCSStatus({
            is_valid: false,
            status: 'error',
            reason: 'Error checking CSCS status',
            requires_upload: true
          });
          return;
        }

        // KEY CHANGE: If no CSCS card exists, skip validation entirely
        if (!cscsCard) {
          console.log('[CSCSAccessGate] No CSCS card found - skipping validation entirely (user can proceed)');
          setCSCSStatus({
            is_valid: true,
            status: 'no_card_uploaded',
            reason: 'No CSCS card uploaded yet - validation skipped',
            requires_upload: false
          });
          setLoading(false);
          return;
        }

        // User has a CSCS card, now validate it
        const today = new Date();
        const expiryDate = new Date(cscsCard.expiry_date);
        
        console.log('[CSCSAccessGate] Card found, validating:', {
          cardNumber: cscsCard.card_number,
          expiryDate: cscsCard.expiry_date,
          isValid: expiryDate > today
        });
        
        if (expiryDate > today) {
          // Card is valid
          console.log('[CSCSAccessGate] CSCS card is valid, allowing access');
          setCSCSStatus({
            is_valid: true,
            status: 'valid',
            reason: 'CSCS card is valid',
            requires_upload: false
          });
        } else {
          // Card is expired
          console.log('[CSCSAccessGate] CSCS card is expired');
          setCSCSStatus({
            is_valid: false,
            status: 'expired',
            reason: 'CSCS card has expired',
            requires_upload: true
          });
        }
      } catch (error) {
        console.error('[CSCSAccessGate] Unexpected error:', error);
        // Only require upload on genuine errors, not normal "no data" cases
        setCSCSStatus({
          is_valid: false,
          status: 'error',
          reason: 'Error checking CSCS status',
          requires_upload: true
        });
      } finally {
        setLoading(false);
      }
    };

    checkCSCSStatus();
  }, [user, session, location.pathname]);

  // Show loading spinner while checking
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if no session
  if (!session || !user) {
    return <Navigate to="/auth" replace />;
  }

  // If CSCS is invalid, redirect to CSCS onboarding
  if (cscsStatus && !cscsStatus.is_valid) {
    return <Navigate to="/onboarding/cscs" replace />;
  }

  // Show warning for cards expiring soon
  if (cscsStatus?.warning_level) {
    return (
      <div className="space-y-4">
        <Alert className={`border-${cscsStatus.warning_level === 'critical' ? 'destructive' : 'yellow-500'}/50`}>
          <AlertTriangle className={`h-4 w-4 text-${cscsStatus.warning_level === 'critical' ? 'destructive' : 'yellow-500'}`} />
          <AlertDescription>
            <strong>CSCS Card Warning:</strong> {cscsStatus.reason}
            {cscsStatus.days_until_expiry && (
              <span className="block text-sm mt-1">
                Days until expiry: {cscsStatus.days_until_expiry}
              </span>
            )}
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // CSCS is valid, render children
  return <>{children}</>;
};