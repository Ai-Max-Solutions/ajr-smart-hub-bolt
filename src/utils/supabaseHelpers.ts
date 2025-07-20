import { supabase } from '@/integrations/supabase/client';

// Centralized Supabase operation wrapper
export async function executeSupabaseOperation<T>(
  operation: () => Promise<T>,
  context: {
    operationName: string;
    table?: string;
    retries?: number;
  }
): Promise<T> {
  const { operationName, table, retries = 3 } = context;
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Supabase] ${operationName} attempt ${attempt}/${retries}`, { table });
      
      const result = await operation();
      
      console.log(`[Supabase] ${operationName} successful`, { table, attempt });
      return result;
      
    } catch (error: any) {
      lastError = error;
      
      const isNetworkError = error.message?.includes('NetworkError') || 
                            error.message?.includes('fetch') ||
                            error.code === 'network_error';
      
      console.error(`[Supabase] ${operationName} failed (attempt ${attempt}/${retries}):`, {
        error: error.message,
        code: error.code,
        table,
        isNetworkError,
        timestamp: new Date().toISOString()
      });
      
      // Only retry on network errors
      if (!isNetworkError || attempt === retries) {
        break;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Re-export supabase client for convenience
export { supabase };