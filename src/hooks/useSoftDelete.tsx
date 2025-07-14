import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from './useAuditLog';
import { toast } from 'sonner';

export const useSoftDelete = () => {
  const { logCRUDOperation } = useAuditLog();

  const softDelete = useCallback(async (
    table: string,
    recordId: string,
    reason?: string
  ) => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { data: userData } = await supabase
        .from('Users')
        .select('whalesync_postgres_id')
        .eq('supabase_auth_id', session.user.id)
        .single();

      if (!userData) throw new Error('User not found');

      // Get the record data before archiving
      const { data: recordData, error: fetchError } = await supabase
        .from(table as any)
        .select('*')
        .eq('whalesync_postgres_id', recordId)
        .single();

      if (fetchError) throw fetchError;

      // Assume soft delete is supported and update the record
      const { error: updateError } = await supabase
        .from(table as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('whalesync_postgres_id', recordId);

      if (updateError) {
        console.warn('Soft delete update failed, using registry only:', updateError);
      }

      // Log in soft delete registry
      const { error: registryError } = await supabase
        .from('soft_delete_registry')
        .insert({
          table_name: table,
          record_id: recordId,
          deleted_by: userData.whalesync_postgres_id,
          deletion_reason: reason,
          archived_data: recordData
        });

      if (registryError) throw registryError;

      // Log the operation
      await logCRUDOperation('DELETE', table, recordId, recordData);

      toast.success(`${table} record archived successfully`);
      return true;
    } catch (error) {
      console.error('Soft delete failed:', error);
      toast.error('Failed to archive record');
      return false;
    }
  }, [logCRUDOperation]);

  const restoreRecord = useCallback(async (
    table: string,
    recordId: string
  ) => {
    try {
      // Remove from soft delete registry
      const { error: registryError } = await supabase
        .from('soft_delete_registry')
        .delete()
        .eq('table_name', table)
        .eq('record_id', recordId);

      if (registryError) throw registryError;

      // Update the record to remove deleted_at
      const { error: updateError } = await supabase
        .from(table as any)
        .update({ deleted_at: null })
        .eq('whalesync_postgres_id', recordId);

      if (updateError) throw updateError;

      await logCRUDOperation('UPDATE', table, recordId, {}, { restored: true });

      toast.success('Record restored successfully');
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error('Failed to restore record');
      return false;
    }
  }, [logCRUDOperation]);

  return {
    softDelete,
    restoreRecord
  };
};