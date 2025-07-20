import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface SecurityEvent {
  type: 'suspicious_activity' | 'failed_auth' | 'permission_escalation';
  details: string;
  timestamp: Date;
  userId?: string;
}

/**
 * Security monitoring hook for client-side threat detection
 * Note: This is basic client-side monitoring only
 * Implement comprehensive server-side monitoring for production
 */
export function useSecurityMonitoring() {
  const logSecurityEvent = useCallback((event: SecurityEvent) => {
    // Log to console (in production, send to security monitoring service)
    console.warn('[SECURITY EVENT]', {
      ...event,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Show user notification for critical events
    if (event.type === 'permission_escalation' || event.type === 'suspicious_activity') {
      toast.error('Security alert: Suspicious activity detected');
    }
  }, []);

  const checkForSuspiciousActivity = useCallback(() => {
    // Basic client-side checks
    const checks = [
      // Check for multiple rapid authentication attempts
      () => {
        const authAttempts = localStorage.getItem('auth_attempts');
        if (authAttempts && parseInt(authAttempts) > 5) {
          return 'Multiple authentication attempts detected';
        }
        return null;
      },
      
      // Check for developer tools (basic detection)
      () => {
        const devtools = /./;
        devtools.toString = function() {
          logSecurityEvent({
            type: 'suspicious_activity',
            details: 'Developer tools detected',
            timestamp: new Date()
          });
          return 'devtools';
        };
        console.log('%c', devtools);
        return null;
      }
    ];

    checks.forEach(check => {
      const result = check();
      if (result) {
        logSecurityEvent({
          type: 'suspicious_activity',
          details: result,
          timestamp: new Date()
        });
      }
    });
  }, [logSecurityEvent]);

  useEffect(() => {
    // Run security checks periodically
    const interval = setInterval(checkForSuspiciousActivity, 30000); // Every 30 seconds
    
    // Initial check
    checkForSuspiciousActivity();
    
    return () => clearInterval(interval);
  }, [checkForSuspiciousActivity]);

  return {
    logSecurityEvent,
    checkForSuspiciousActivity
  };
}