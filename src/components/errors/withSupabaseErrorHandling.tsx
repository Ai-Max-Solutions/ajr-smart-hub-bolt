
import React, { ComponentType } from 'react';
import { SupabaseErrorBoundary } from './SupabaseErrorBoundary';

interface WithSupabaseErrorHandlingOptions {
  operation?: string;
  fallback?: React.ReactNode;
}

export function withSupabaseErrorHandling<P extends object>(
  Component: ComponentType<P>,
  options: WithSupabaseErrorHandlingOptions = {}
) {
  const WrappedComponent = (props: P) => {
    const operation = options.operation || Component.displayName || Component.name || 'Unknown';
    
    return (
      <SupabaseErrorBoundary 
        operation={operation}
        fallback={options.fallback}
        onError={(error, errorInfo) => {
          console.error(`[${operation}] Component Error:`, {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            props: process.env.NODE_ENV === 'development' ? props : '[hidden in production]',
            timestamp: new Date().toISOString()
          });
        }}
      >
        <Component {...props} />
      </SupabaseErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withSupabaseErrorHandling(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
