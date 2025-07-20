
import { useCallback } from 'react';
import { toast } from 'sonner';

export interface SupabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

export interface ErrorContext {
  operation: string;
  table?: string;
  userId?: string;
  attempt?: number;
}

export const useSupabaseError = () => {
  const handleError = useCallback((error: SupabaseError, context: ErrorContext) => {
    const { operation, table, userId, attempt = 1 } = context;
    
    // Log to console with context
    console.error(`[Supabase Error] ${operation}:`, {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      table,
      userId,
      attempt,
      timestamp: new Date().toISOString()
    });

    // Categorize error type
    const isNetworkError = error.message?.includes('NetworkError') || 
                          error.message?.includes('fetch') ||
                          error.code === 'network_error';
    
    const isAuthError = error.code?.includes('auth') || 
                       error.message?.includes('JWT') ||
                       error.message?.includes('session_not_found');
    
    const isValidationError = error.code?.includes('check_violation') ||
                             error.code?.includes('unique_violation') ||
                             error.code?.includes('foreign_key_violation');

    // Generate plumbing-themed error messages
    let toastMessage = '';
    if (isNetworkError) {
      toastMessage = attempt === 1 
        ? `🔧 Pipe disconnection detected! Reconnecting the flow...`
        : `🚰 Still wrestling with the pipes (attempt ${attempt})...`;
    } else if (isAuthError) {
      toastMessage = `🔐 Access valve needs adjustment - please sign in again!`;
    } else if (isValidationError) {
      toastMessage = `⚠️ Data quality check failed - check your input and try again!`;
    } else {
      toastMessage = `🛠️ System hiccup detected - our engineers are on it!`;
    }

    // Show toast with appropriate action
    if (isNetworkError && attempt <= 3) {
      toast.loading(toastMessage, {
        id: `retry-${operation}`,
        duration: 2000
      });
    } else {
      toast.error(toastMessage, {
        id: `error-${operation}`,
        action: isAuthError ? {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth'
        } : undefined
      });
    }

    return {
      isNetworkError,
      isAuthError,
      isValidationError,
      shouldRetry: isNetworkError && attempt <= 3
    };
  }, []);

  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxAttempts = 3,
    delay = 1000
  ): Promise<T> => {
    let lastError: SupabaseError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Success after retry - show success toast
        if (attempt > 1) {
          toast.success(`🎉 Connection restored! Operation completed successfully.`, {
            id: `retry-${context.operation}`
          });
        }
        
        return result;
      } catch (error) {
        lastError = error as SupabaseError;
        const errorInfo = handleError(lastError, { ...context, attempt });
        
        // Only retry for network errors
        if (!errorInfo.shouldRetry || attempt === maxAttempts) {
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError!;
  }, [handleError]);

  return { handleError, withRetry };
};
