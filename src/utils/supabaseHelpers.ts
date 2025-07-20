
import { supabase } from '@/integrations/supabase/client';

// Centralized Supabase operation wrapper
export async function executeSupabaseOperation<T>(
  operation: () => Promise<{ data: T; error: any }>,
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
      
      const { data, error } = await operation();
      
      if (error) {
        throw error;
      }
      
      console.log(`[Supabase] ${operationName} successful`, { table, attempt });
      return data;
      
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

// Common Supabase operations with built-in error handling
export const supabaseHelpers = {
  async select<T>(tableName: string, query?: any): Promise<T[]> {
    return executeSupabaseOperation(
      () => supabase.from(tableName).select(query || '*'),
      { operationName: 'select', table: tableName }
    );
  },

  async selectSingle<T>(tableName: string, filter: any, query?: any): Promise<T> {
    return executeSupabaseOperation(
      () => supabase.from(tableName).select(query || '*').match(filter).single(),
      { operationName: 'selectSingle', table: tableName }
    );
  },

  async insert<T>(tableName: string, data: any): Promise<T> {
    return executeSupabaseOperation(
      () => supabase.from(tableName).insert(data).select().single(),
      { operationName: 'insert', table: tableName }
    );
  },

  async update<T>(tableName: string, data: any, filter: any): Promise<T> {
    return executeSupabaseOperation(
      () => supabase.from(tableName).update(data).match(filter).select().single(),
      { operationName: 'update', table: tableName }
    );
  },

  async delete(tableName: string, filter: any): Promise<void> {
    return executeSupabaseOperation(
      () => supabase.from(tableName).delete().match(filter),
      { operationName: 'delete', table: tableName }
    );
  },

  async rpc<T>(functionName: string, params?: any): Promise<T> {
    return executeSupabaseOperation(
      () => supabase.rpc(functionName, params),
      { operationName: `rpc:${functionName}` }
    );
  }
};
