import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
  const [cscsStatus, setCSCSStatus] = useState<CSCSStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCSCSStatus = async () => {
      if (!user || !session) {
        console.log('[CSCSAccessGate] No user or session, allowing access');
        setLoading(false);
        return;
      }

      console.log('[CSCSAccessGate] Checking CSCS status for user:', user.id);

      try {
        // Get the most recent CSCS card using maybeSingle to avoid errors when no data exists
        const { data: cscsCard, error: cscsError } = await supabase
          .from('cscs_cards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('[CSCSAccessGate] Query result:', { cscsCard, cscsError });

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

        if (cscsCard) {
          // User has a CSCS card, check if it's valid (not expired)
          const today = new Date();
          const expiryDate = new Date(cscsCard.expiry_date);
          
          console.log('[CSCSAccessGate] Card found:', {
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
        } else {
          // No CSCS card found, user needs to upload
          console.log('[CSCSAccessGate] No CSCS card found, requiring upload');
          setCSCSStatus({
            is_valid: false,
            status: 'missing',
            reason: 'No CSCS card uploaded',
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
  }, [user, session]);

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