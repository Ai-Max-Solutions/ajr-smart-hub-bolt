import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  evidence_chain_hash?: string;
}

export const useAuditLog = () => {
  const logAction = useCallback(async (entry: AuditLogEntry) => {
    try {
      // Get current session info
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user ID from Users table
      const { data: userData } = await supabase
        .from('Users')
        .select('whalesync_postgres_id')
        .eq('supabase_auth_id', session.user.id)
        .single();

      if (!userData) return;

      // Log to enhanced audit log
      const { error } = await supabase
        .from('enhanced_audit_log')
        .insert({
          user_id: userData.whalesync_postgres_id,
          action: entry.action,
          table_name: entry.table_name,
          record_id: entry.record_id,
          old_values: entry.old_values,
          new_values: entry.new_values,
          evidence_chain_hash: entry.evidence_chain_hash,
          session_id: session.access_token.substring(0, 20) // Truncated for privacy
        });

      if (error) {
        console.error('Failed to log audit entry:', error);
      }

      // Also log to evidence chain for critical operations
      if (['INSERT', 'UPDATE', 'DELETE'].includes(entry.action.toUpperCase())) {
        await supabase.rpc('log_evidence_chain_event', {
          p_table_name: entry.table_name,
          p_record_id: entry.record_id,
          p_action: entry.action,
          p_data: entry.new_values || entry.old_values,
          p_user_id: userData.whalesync_postgres_id
        });
      }
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }, []);

  const logCRUDOperation = useCallback(async (
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    table: string,
    recordId: string,
    oldData?: any,
    newData?: any
  ) => {
    await logAction({
      action: operation,
      table_name: table,
      record_id: recordId,
      old_values: oldData,
      new_values: newData
    });
  }, [logAction]);

  return {
    logAction,
    logCRUDOperation
  };
};