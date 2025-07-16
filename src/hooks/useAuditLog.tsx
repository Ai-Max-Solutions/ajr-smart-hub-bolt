
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: any;
  new_values: any;
  user_id: string;
  user_name: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export const useAuditLog = (filters?: {
  table_name?: string;
  user_id?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
}) => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLog();
  }, [filters]);

  const fetchAuditLog = async () => {
    setLoading(true);
    setError(null);

    try {
      // For now, return mock data since audit_logs table might not exist
      const mockEntries: AuditLogEntry[] = [
        {
          id: '1',
          action: 'CREATE',
          table_name: 'Users',
          record_id: '123',
          old_values: null,
          new_values: { name: 'Test User' },
          user_id: 'admin',
          user_name: 'Admin User',
          timestamp: new Date().toISOString(),
        }
      ];

      setEntries(mockEntries);
    } catch (err: any) {
      console.error('Error fetching audit log:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (
    action: string,
    tableName: string,
    recordId: string,
    oldValues?: any,
    newValues?: any
  ) => {
    try {
      console.log('Logging action:', { action, tableName, recordId, oldValues, newValues });
      // Mock implementation for now
    } catch (err) {
      console.error('Error in logAction:', err);
    }
  };

  const logCRUDOperation = async (
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    tableName: string,
    recordId: string,
    data?: any
  ) => {
    await logAction(operation, tableName, recordId, null, data);
  };

  return {
    entries,
    loading,
    error,
    refresh: fetchAuditLog,
    logAction,
    logCRUDOperation
  };
};
