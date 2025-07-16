
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
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          Users!audit_logs_user_id_fkey (
            id,
            fullname
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      // Apply filters
      if (filters?.table_name) {
        query = query.eq('table_name', filters.table_name);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.date_from) {
        query = query.gte('timestamp', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('timestamp', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedEntries = data?.map(entry => ({
        id: entry.id,
        action: entry.action,
        table_name: entry.table_name,
        record_id: entry.record_id,
        old_values: entry.old_values,
        new_values: entry.new_values,
        user_id: entry.user_id,
        user_name: entry.Users?.fullname || 'Unknown User',
        timestamp: entry.timestamp,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent
      })) || [];

      setEntries(processedEntries);
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: userProfile } = await supabase
        .from('Users')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!userProfile) return;

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          table_name: tableName,
          record_id: recordId,
          old_values: oldValues,
          new_values: newValues,
          user_id: userProfile.id,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging audit action:', error);
      }
    } catch (err) {
      console.error('Error in logAction:', err);
    }
  };

  return {
    entries,
    loading,
    error,
    refresh: fetchAuditLog,
    logAction
  };
};
