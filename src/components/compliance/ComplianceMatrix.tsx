import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Filter, 
  Shield, 
  Calendar, 
  Users,
  AlertTriangle,
  CheckCircle,
  X,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types
interface ComplianceRecord {
  id: string;
  operativeName: string;
  project: string;
  cscs: QualificationStatus;
  sssts: QualificationStatus;
  smsts: QualificationStatus;
  gasSafe: QualificationStatus;
  asbestos: QualificationStatus;
  confinedSpace: QualificationStatus;
  induction: QualificationStatus;
  firstAid: QualificationStatus;
  overallCompliance: number;
  lastUpdated: string;
}

interface QualificationStatus {
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  expiryDate?: string;
  daysUntilExpiry?: number;
}

const ComplianceMatrix = () => {
  const { toast } = useToast();
  const [projectFilter, setProjectFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const complianceRecords: ComplianceRecord[] = [
    {
      id: '1',
      operativeName: 'John Smith',
      project: 'Woodberry Down Phase 2',
      cscs: { status: 'valid', expiryDate: '2025-12-31', daysUntilExpiry: 365 },
      sssts: { status: 'missing' },
      smsts: { status: 'missing' },
      gasSafe: { status: 'valid', expiryDate: '2025-03-15', daysUntilExpiry: 75 },
      asbestos: { status: 'expiring', expiryDate: '2024-08-30', daysUntilExpiry: 14 },
      confinedSpace: { status: 'missing' },
      induction: { status: 'valid', expiryDate: '2025-01-30', daysUntilExpiry: 20 },
      firstAid: { status: 'missing' },
      overallCompliance: 60,
      lastUpdated: '2024-01-20'
    },
    {
      id: '2',
      operativeName: 'Sarah Johnson',
      project: 'Kidbrooke Village Block C',
      cscs: { status: 'valid', expiryDate: '2025-09-15', daysUntilExpiry: 268 },
      sssts: { status: 'valid', expiryDate: '2025-11-20', daysUntilExpiry: 334 },
      smsts: { status: 'missing' },
      gasSafe: { status: 'valid', expiryDate: '2025-06-10', daysUntilExpiry: 162 },
      asbestos: { status: 'valid', expiryDate: '2025-04-25', daysUntilExpiry: 116 },
      confinedSpace: { status: 'valid', expiryDate: '2025-02-28', daysUntilExpiry: 49 },
      induction: { status: 'valid', expiryDate: '2025-01-15', daysUntilExpiry: 5 },
      firstAid: { status: 'valid', expiryDate: '2025-08-30', daysUntilExpiry: 233 },
      overallCompliance: 100,
      lastUpdated: '2024-01-19'
    },
    {
      id: '3',
      operativeName: 'Mike Davis',
      project: 'Woodberry Down Phase 2',
      cscs: { status: 'expired', expiryDate: '2023-12-31', daysUntilExpiry: -20 },
      sssts: { status: 'missing' },
      smsts: { status: 'missing' },
      gasSafe: { status: 'missing' },
      asbestos: { status: 'missing' },
      confinedSpace: { status: 'missing' },
      induction: { status: 'expired', expiryDate: '2023-11-15', daysUntilExpiry: -66 },
      firstAid: { status: 'missing' },
      overallCompliance: 0,
      lastUpdated: '2024-01-18'
    }
  ];

  const projects = ['Woodberry Down Phase 2', 'Kidbrooke Village Block C', 'Crystal Palace Park'];

  const getStatusIcon = (status: QualificationStatus) => {
    switch (status.status) {
      case 'valid':
        if (status.daysUntilExpiry && status.daysUntilExpiry <= 30) {
          return <AlertTriangle className="w-4 h-4 text-warning" />;
        }
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'expiring':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'expired':
        return <X className="w-4 h-4 text-destructive" />;
      case 'missing':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: QualificationStatus) => {
    switch (status.status) {
      case 'valid':
        if (status.daysUntilExpiry && status.daysUntilExpiry <= 30) {
          return <span className="text-xs text-warning">⚠️</span>;
        }
        return <span className="text-xs text-success">✅</span>;
      case 'expiring':
        return <span className="text-xs text-warning">⚠️</span>;
      case 'expired':
        return <span className="text-xs text-destructive">❌</span>;
      case 'missing':
        return <span className="text-xs text-muted-foreground">-</span>;
      default:
        return <span className="text-xs text-muted-foreground">-</span>;
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 80) return 'text-success';
    if (compliance >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const handleExportCSV = () => {
    toast({
      title: "Export Started",
      description: "Compliance matrix CSV is being generated...",
    });
  };

  const handleSendReminders = () => {
    toast({
      title: "Reminders Sent",
      description: "Expiry reminder emails have been sent to relevant operatives",
    });
  };

  const filteredRecords = complianceRecords.filter(record => {
    const matchesSearch = record.operativeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = projectFilter === 'all' || record.project === projectFilter;
    
    let matchesCompliance = true;
    if (complianceFilter === 'compliant') {
      matchesCompliance = record.overallCompliance === 100;
    } else if (complianceFilter === 'non-compliant') {
      matchesCompliance = record.overallCompliance < 100;
    }

    let matchesExpiry = true;
    if (expiryFilter === 'expiring-soon') {
      // Check if any qualification expires within 30 days
      const qualifications = [record.cscs, record.sssts, record.smsts, record.gasSafe, record.asbestos, record.confinedSpace, record.induction, record.firstAid];
      matchesExpiry = qualifications.some(q => q.daysUntilExpiry && q.daysUntilExpiry <= 30 && q.daysUntilExpiry > 0);
    } else if (expiryFilter === 'expired') {
      const qualifications = [record.cscs, record.sssts, record.smsts, record.gasSafe, record.asbestos, record.confinedSpace, record.induction, record.firstAid];
      matchesExpiry = qualifications.some(q => q.status === 'expired');
    }

    return matchesSearch && matchesProject && matchesCompliance && matchesExpiry;
  });

  const complianceStats = {
    total: complianceRecords.length,
    compliant: complianceRecords.filter(r => r.overallCompliance === 100).length,
    nonCompliant: complianceRecords.filter(r => r.overallCompliance < 100).length,
    expiringSoon: complianceRecords.filter(r => {
      const qualifications = [r.cscs, r.sssts, r.smsts, r.gasSafe, r.asbestos, r.confinedSpace, r.induction, r.firstAid];
      return qualifications.some(q => q.daysUntilExpiry && q.daysUntilExpiry <= 30 && q.daysUntilExpiry > 0);
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Compliance Matrix</CardTitle>
              <p className="text-primary-foreground/80">
                Complete overview of team qualifications and compliance status
              </p>
            </div>
            <Shield className="w-8 h-8 text-accent" />
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary">{complianceStats.total}</div>
            <div className="text-sm text-muted-foreground">Total Operatives</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-success">{complianceStats.compliant}</div>
            <div className="text-sm text-muted-foreground">100% Compliant</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-destructive">{complianceStats.nonCompliant}</div>
            <div className="text-sm text-muted-foreground">Non-Compliant</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-warning">{complianceStats.expiringSoon}</div>
            <div className="text-sm text-muted-foreground">Expiring Soon</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search operatives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project} value={project}>{project}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={complianceFilter} onValueChange={setComplianceFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Compliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">100% Compliant</SelectItem>
                <SelectItem value="non-compliant">Non-Compliant</SelectItem>
              </SelectContent>
            </Select>
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expiry Status</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleExportCSV} className="btn-accent">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleSendReminders}>
              <Calendar className="w-4 h-4 mr-2" />
              Send Expiry Reminders
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Compliance Matrix ({filteredRecords.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operative</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-center">CSCS</TableHead>
                  <TableHead className="text-center">SSSTS</TableHead>
                  <TableHead className="text-center">SMSTS</TableHead>
                  <TableHead className="text-center">Gas Safe</TableHead>
                  <TableHead className="text-center">Asbestos</TableHead>
                  <TableHead className="text-center">Confined Space</TableHead>
                  <TableHead className="text-center">Induction</TableHead>
                  <TableHead className="text-center">First Aid</TableHead>
                  <TableHead className="text-center">Overall</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.operativeName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{record.project}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(record.cscs)}
                        {getStatusBadge(record.cscs)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(record.sssts)}
                        {getStatusBadge(record.sssts)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(record.smsts)}
                        {getStatusBadge(record.smsts)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(record.gasSafe)}
                        {getStatusBadge(record.gasSafe)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(record.asbestos)}
                        {getStatusBadge(record.asbestos)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(record.confinedSpace)}
                        {getStatusBadge(record.confinedSpace)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(record.induction)}
                        {getStatusBadge(record.induction)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(record.firstAid)}
                        {getStatusBadge(record.firstAid)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${getComplianceColor(record.overallCompliance)}`}>
                        {record.overallCompliance}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceMatrix;