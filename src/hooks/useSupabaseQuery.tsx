
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseError } from './useSupabaseError';

interface QueryOptions<T> {
  operation: string;
  table?: string;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  options: QueryOptions<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { withRetry } = useSupabaseError();

  const execute = useCallback(async () => {
    if (options.enabled === false) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await withRetry(
        queryFn,
        { 
          operation: options.operation,
          table: options.table
        }
      );
      
      setData(result);
      options.onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [queryFn, options, withRetry]);

  useEffect(() => {
    execute();
  }, [execute]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch
  };
}
