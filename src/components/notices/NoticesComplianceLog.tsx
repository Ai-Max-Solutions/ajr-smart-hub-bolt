import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Download, 
  Filter, 
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Users
} from 'lucide-react';

interface ComplianceLogEntry {
  id: string;
  noticeTitle: string;
  noticeType: 'toolbox_talk' | 'safety_alert' | 'general';
  project: string;
  issuedBy: string;
  issuedDate: Date;
  totalRecipients: number;
  readCount: number;
  signedCount: number;
  pendingCount: number;
  expiryDate?: Date;
  signatureRequired: boolean;
}

const NoticesComplianceLog = () => {
  const [entries] = useState<ComplianceLogEntry[]>([
    {
      id: '1',
      noticeTitle: 'Scaffold Zone Closed - Do Not Enter',
      noticeType: 'safety_alert',
      project: 'Woodberry Down Phase 2',
      issuedBy: 'Jane Doe',
      issuedDate: new Date('2025-07-13T08:00:00'),
      totalRecipients: 24,
      readCount: 18,
      signedCount: 12,
      pendingCount: 6,
      signatureRequired: true
    },
    {
      id: '2',
      noticeTitle: 'Ladder Safety - Updated Procedures',
      noticeType: 'toolbox_talk',
      project: 'Woodberry Down Phase 2',
      issuedBy: 'Mark Wilson',
      issuedDate: new Date('2025-07-12T14:30:00'),
      totalRecipients: 18,
      readCount: 16,
      signedCount: 14,
      pendingCount: 2,
      signatureRequired: true
    },
    {
      id: '3',
      noticeTitle: 'Welfare Facilities Update',
      noticeType: 'general',
      project: 'Woodberry Down Phase 2',
      issuedBy: 'Sarah Johnson',
      issuedDate: new Date('2025-07-11T16:00:00'),
      totalRecipients: 24,
      readCount: 24,
      signedCount: 0,
      pendingCount: 0,
      signatureRequired: false
    },
    {
      id: '4',
      noticeTitle: 'Emergency Assembly Point Changes',
      noticeType: 'safety_alert',
      project: 'Camden Square Development',
      issuedBy: 'Mike Thompson',
      issuedDate: new Date('2025-07-10T09:15:00'),
      totalRecipients: 16,
      readCount: 16,
      signedCount: 16,
      pendingCount: 0,
      signatureRequired: true
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.noticeTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.issuedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = projectFilter === 'all' || entry.project === projectFilter;
    const matchesType = typeFilter === 'all' || entry.noticeType === typeFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'pending') {
      matchesStatus = entry.pendingCount > 0;
    } else if (statusFilter === 'complete') {
      matchesStatus = entry.pendingCount === 0;
    }

    return matchesSearch && matchesProject && matchesType && matchesStatus;
  });

  const totalNotices = entries.length;
  const totalRecipients = entries.reduce((sum, entry) => sum + entry.totalRecipients, 0);
  const totalPending = entries.reduce((sum, entry) => sum + entry.pendingCount, 0);
  const avgComplianceRate = entries.length > 0 
    ? entries.reduce((sum, entry) => {
        const rate = entry.signatureRequired 
          ? (entry.signedCount / entry.totalRecipients) * 100
          : (entry.readCount / entry.totalRecipients) * 100;
        return sum + rate;
      }, 0) / entries.length 
    : 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'safety_alert':
        return 'destructive';
      case 'toolbox_talk':
        return 'accent';
      case 'general':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'safety_alert':
        return 'Safety Alert';
      case 'toolbox_talk':
        return 'Toolbox Talk';
      case 'general':
        return 'Site Notice';
      default:
        return 'Notice';
    }
  };

  const getComplianceRate = (entry: ComplianceLogEntry) => {
    if (entry.signatureRequired) {
      return (entry.signedCount / entry.totalRecipients) * 100;
    }
    return (entry.readCount / entry.totalRecipients) * 100;
  };

  const getComplianceStatus = (rate: number) => {
    if (rate === 100) return 'complete';
    if (rate >= 80) return 'good';
    if (rate >= 60) return 'warning';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'good':
        return 'accent';
      case 'warning':
        return 'warning';
      case 'poor':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const projects = [...new Set(entries.map(entry => entry.project))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Notices Compliance Log</h2>
          <p className="text-muted-foreground">Monitor site communication compliance across all projects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Notices</p>
                <p className="text-2xl font-bold text-primary">{totalNotices}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recipients</p>
                <p className="text-2xl font-bold text-primary">{totalRecipients}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Actions</p>
                <p className="text-2xl font-bold text-destructive">{totalPending}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Compliance</p>
                <p className="text-2xl font-bold text-success">{Math.round(avgComplianceRate)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project} value={project}>{project}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="safety_alert">Safety Alerts</SelectItem>
                <SelectItem value="toolbox_talk">Toolbox Talks</SelectItem>
                <SelectItem value="general">General Notices</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Has Pending</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notice</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Issued By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => {
                const complianceRate = getComplianceRate(entry);
                const status = getComplianceStatus(complianceRate);
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={entry.noticeTitle}>
                        {entry.noticeTitle}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={getTypeColor(entry.noticeType) as any}>
                        {getTypeLabel(entry.noticeType)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-sm">{entry.project}</TableCell>
                    
                    <TableCell className="text-sm">{entry.issuedBy}</TableCell>
                    
                    <TableCell className="text-sm">
                      {entry.issuedDate.toLocaleDateString()}
                    </TableCell>
                    
                    <TableCell className="text-sm">
                      <div className="space-y-1">
                        <div>Total: {entry.totalRecipients}</div>
                        {entry.signatureRequired ? (
                          <div>Signed: {entry.signedCount}</div>
                        ) : (
                          <div>Read: {entry.readCount}</div>
                        )}
                        {entry.pendingCount > 0 && (
                          <div className="text-destructive">Pending: {entry.pendingCount}</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {Math.round(complianceRate)}%
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={getStatusColor(status) as any}>
                        {entry.pendingCount === 0 ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        )}
                        {entry.pendingCount === 0 ? 'Complete' : `${entry.pendingCount} Pending`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredEntries.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notices found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NoticesComplianceLog;