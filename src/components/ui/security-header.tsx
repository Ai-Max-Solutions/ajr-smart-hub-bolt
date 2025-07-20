import { useEffect } from 'react';

/**
 * Security header component that applies basic CSP and security headers
 * Note: This provides client-side security measures only
 * For production, implement server-side CSP headers
 */
export function SecurityHeader() {
  useEffect(() => {
    // Add security meta tags dynamically (client-side only)
    const addMetaTag = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Basic security headers (limited client-side implementation)
    addMetaTag('referrer', 'strict-origin-when-cross-origin');
    addMetaTag('x-content-type-options', 'nosniff');
    
    // Content Security Policy (basic - should be implemented server-side)
    const cspContent = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co"
    ].join('; ');
    
    addMetaTag('content-security-policy', cspContent);
    
    // Cleanup function
    return () => {
      // Note: Meta tags added dynamically are not removed to maintain security
    };
  }, []);

  return null; // This component doesn't render anything
}