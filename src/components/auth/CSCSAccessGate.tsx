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

  // If CSCS is invalid, show access denied or redirect
  if (cscsStatus && !cscsStatus.is_valid) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-destructive" />
            <h1 className="mt-4 text-3xl font-bold text-aj-navy-deep">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">
              Valid CSCS card required for site access
            </p>
          </div>

          <Alert variant="destructive" className="border-aj-yellow/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Access Denied:</strong> You must upload your valid CSCS Card before you can access site details.
              <br />
              <span className="text-sm mt-1 block">
                Reason: {cscsStatus.reason}
              </span>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/onboarding/cscs'}
              className="w-full bg-aj-yellow text-aj-navy-deep hover:bg-aj-yellow/90"
            >
              Upload CSCS Card
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/auth'}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Your CSCS card is required for health & safety compliance.</p>
          </div>
        </div>
      </div>
    );
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