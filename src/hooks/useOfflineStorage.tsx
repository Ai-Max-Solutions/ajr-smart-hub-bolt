import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OfflineOperation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending operations from localStorage
    loadPendingOperations();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      syncPendingOperations();
    }
  }, [isOnline]);

  const loadPendingOperations = () => {
    try {
      const stored = localStorage.getItem('offline_operations');
      if (stored) {
        setPendingOperations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  };

  const savePendingOperations = (operations: OfflineOperation[]) => {
    try {
      localStorage.setItem('offline_operations', JSON.stringify(operations));
    } catch (error) {
      console.error('Failed to save pending operations:', error);
    }
  };

  const addOfflineOperation = useCallback((
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any
  ) => {
    const newOperation: OfflineOperation = {
      id: `offline_${Date.now()}_${Math.random()}`,
      table,
      operation,
      data,
      timestamp: Date.now(),
      synced: false
    };

    const updated = [...pendingOperations, newOperation];
    setPendingOperations(updated);
    savePendingOperations(updated);

    return newOperation.id;
  }, [pendingOperations]);

  const syncPendingOperations = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    const operations = [...pendingOperations];
    const successfulOperations: string[] = [];

    for (const operation of operations) {
      if (operation.synced) continue;

      try {
        let result;
        
        switch (operation.operation) {
          case 'insert':
            result = await supabase
              .from(operation.table as any)
              .insert(operation.data);
            break;
          case 'update':
            result = await supabase
              .from(operation.table as any)
              .update(operation.data)
              .eq('id', operation.data.id);
            break;
          case 'delete':
            result = await supabase
              .from(operation.table as any)
              .delete()
              .eq('id', operation.data.id);
            break;
        }

        if (result && !result.error) {
          successfulOperations.push(operation.id);
        }
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
      }
    }

    // Remove successful operations
    const remainingOperations = operations.filter(
      op => !successfulOperations.includes(op.id)
    );
    
    setPendingOperations(remainingOperations);
    savePendingOperations(remainingOperations);
    setIsSyncing(false);
  };

  const clearPendingOperations = () => {
    setPendingOperations([]);
    localStorage.removeItem('offline_operations');
  };

  return {
    isOnline,
    pendingOperations,
    isSyncing,
    addOfflineOperation,
    syncPendingOperations,
    clearPendingOperations,
    pendingCount: pendingOperations.length
  };
};