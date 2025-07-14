import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Filter, Search, Shield, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  created_at: string;
  user_id: string | null;
  ip_address: string | null;
  evidence_chain_hash: string | null;
  gdpr_retention_category: string;
  legal_hold: boolean;
  Users?: {
    fullname: string;
    email: string;
  };
}

export const AuditLogsViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, tableFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('enhanced_audit_log')
        .select(`
          *,
          Users!inner(fullname, email)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data || []) as AuditLog[]);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const searchTerm = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchTerm) ||
      log.table_name.toLowerCase().includes(searchTerm) ||
      log.record_id?.toLowerCase().includes(searchTerm) ||
      log.ip_address?.toLowerCase().includes(searchTerm)
    );
  });

  const exportLogs = async () => {
    try {
      const csvHeaders = [
        'Timestamp',
        'User',
        'Action',
        'Table',
        'Record ID',
        'IP Address',
        'Evidence Hash',
        'GDPR Category',
        'Legal Hold'
      ];

      const csvData = filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.Users?.fullname || 'System',
        log.action,
        log.table_name,
        log.record_id || 'N/A',
        log.ip_address || 'N/A',
        log.evidence_chain_hash?.substring(0, 16) + '...' || 'N/A',
        log.gdpr_retention_category,
        log.legal_hold ? 'Yes' : 'No'
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Audit logs exported successfully');
    } catch (error) {
      console.error('Failed to export logs:', error);
      toast.error('Failed to export audit logs');
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      'INSERT': 'default',
      'UPDATE': 'secondary',
      'DELETE': 'destructive',
      'LOGIN': 'secondary',
      'LOGOUT': 'secondary'
    };

    return (
      <Badge variant={variants[action] || 'default'} className="text-xs">
        {action}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5" />
              Audit Logs
            </CardTitle>
            <CardDescription>
              Complete audit trail of all system operations ({filteredLogs.length} entries)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportLogs} className="h-10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="INSERT">Insert</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Table" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              <SelectItem value="Projects">Projects</SelectItem>
              <SelectItem value="Levels">Levels</SelectItem>
              <SelectItem value="Plots">Plots</SelectItem>
              <SelectItem value="work_packages">Work Packages</SelectItem>
              <SelectItem value="document_versions">Documents</SelectItem>
              <SelectItem value="Users">Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>GDPR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.Users?.fullname || 'System'}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.table_name}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.record_id?.substring(0, 8) + '...' || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.ip_address || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {log.evidence_chain_hash && (
                        <Badge variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Evidence
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={log.legal_hold ? "destructive" : "secondary"} 
                          className="text-xs"
                        >
                          {log.gdpr_retention_category}
                        </Badge>
                        {log.legal_hold && (
                          <Badge variant="destructive" className="text-xs">
                            Hold
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};