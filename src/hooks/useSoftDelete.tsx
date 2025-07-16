
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SoftDeleteOptions {
  table: string;
  recordId: string;
  reason?: string;
}

export const useSoftDelete = () => {
  const [loading, setLoading] = useState(false);

  const softDelete = async ({ table, recordId, reason }: SoftDeleteOptions): Promise<boolean> => {
    setLoading(true);
    try {
      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return false;
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from('Users')
        .select('id, fullname')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!userProfile) {
        toast.error('User profile not found');
        return false;
      }

      // Perform soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from(table)
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userProfile.id,
          deletion_reason: reason || null
        })
        .eq('id', recordId);

      if (error) throw error;

      // Log the deletion action
      await supabase
        .from('audit_logs')
        .insert({
          action: 'SOFT_DELETE',
          table_name: table,
          record_id: recordId,
          user_id: userProfile.id,
          timestamp: new Date().toISOString(),
          old_values: null,
          new_values: { 
            deleted_at: new Date().toISOString(),
            deleted_by: userProfile.id,
            deletion_reason: reason 
          }
        });

      toast.success('Record deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error performing soft delete:', error);
      toast.error('Failed to delete record: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const restore = async ({ table, recordId }: Omit<SoftDeleteOptions, 'reason'>): Promise<boolean> => {
    setLoading(true);
    try {
      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return false;
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from('Users')
        .select('id, fullname')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!userProfile) {
        toast.error('User profile not found');
        return false;
      }

      // Restore by clearing deletion fields
      const { error } = await supabase
        .from(table)
        .update({
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null
        })
        .eq('id', recordId);

      if (error) throw error;

      // Log the restoration action
      await supabase
        .from('audit_logs')
        .insert({
          action: 'RESTORE',
          table_name: table,
          record_id: recordId,
          user_id: userProfile.id,
          timestamp: new Date().toISOString(),
          old_values: null,
          new_values: { restored: true }
        });

      toast.success('Record restored successfully');
      return true;
    } catch (error: any) {
      console.error('Error restoring record:', error);
      toast.error('Failed to restore record: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const permanentDelete = async ({ table, recordId }: Omit<SoftDeleteOptions, 'reason'>): Promise<boolean> => {
    setLoading(true);
    try {
      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return false;
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from('Users')
        .select('id, fullname')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!userProfile) {
        toast.error('User profile not found');
        return false;
      }

      // Get record data before deletion for audit
      const { data: recordData } = await supabase
        .from(table)
        .select('*')
        .eq('id', recordId)
        .single();

      // Perform permanent deletion
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      // Log the permanent deletion
      await supabase
        .from('audit_logs')
        .insert({
          action: 'PERMANENT_DELETE',
          table_name: table,
          record_id: recordId,
          user_id: userProfile.id,
          timestamp: new Date().toISOString(),
          old_values: recordData,
          new_values: null
        });

      toast.success('Record permanently deleted');
      return true;
    } catch (error: any) {
      console.error('Error permanently deleting record:', error);
      toast.error('Failed to permanently delete record: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    softDelete,
    restore,
    permanentDelete,
    loading
  };
};
