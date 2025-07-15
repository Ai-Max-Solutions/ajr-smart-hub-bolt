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
        setLoading(false);
        return;
      }

      try {
        // Get user's whalesync_postgres_id
        const { data: userData, error: userError } = await supabase
          .from('Users')
          .select('whalesync_postgres_id')
          .eq('supabase_auth_id', user.id)
          .single();

        if (userError || !userData) {
          console.error('User not found:', userError);
          setLoading(false);
          return;
        }

        // Check CSCS status
        const { data: status, error: statusError } = await supabase.rpc('check_user_cscs_status', {
          p_user_id: userData.whalesync_postgres_id
        });

        if (statusError) {
          console.error('Error checking CSCS status:', statusError);
        } else if (status && typeof status === 'object' && !Array.isArray(status) && 'is_valid' in status) {
          setCSCSStatus(status as unknown as CSCSStatus);
        }
      } catch (error) {
        console.error('Error in CSCS check:', error);
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