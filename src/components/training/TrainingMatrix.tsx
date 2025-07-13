import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Filter, Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MatrixData {
  operativeId: string;
  operativeName: string;
  role: string;
  project: string;
  trainings: {
    [key: string]: {
      status: 'approved' | 'expired' | 'due-soon' | 'pending' | 'not-required';
      completedDate?: Date;
      expiryDate?: Date;
      version?: string;
    };
  };
}

const TrainingMatrix = () => {
  const [matrixData] = useState<MatrixData[]>([
    {
      operativeId: '1',
      operativeName: 'John Smith',
      role: 'Site Operative',
      project: 'Woodberry Down Phase 2',
      trainings: {
        'cscs': { status: 'approved', completedDate: new Date('2024-01-15'), expiryDate: new Date('2025-01-15') },
        'induction': { status: 'approved', completedDate: new Date('2024-01-15'), expiryDate: new Date('2025-01-15') },
        'manual-handling': { status: 'approved', completedDate: new Date('2024-06-10'), expiryDate: new Date('2025-06-10') },
        'ladder-safety': { status: 'due-soon', completedDate: new Date('2024-07-10'), expiryDate: new Date('2025-01-10') },
        'asbestos': { status: 'expired', completedDate: new Date('2023-03-20'), expiryDate: new Date('2024-03-20') },
        'confined-space': { status: 'pending', completedDate: new Date('2024-12-09') },
        'first-aid': { status: 'not-required' }
      }
    },
    {
      operativeId: '2',
      operativeName: 'Sarah Wilson',
      role: 'Senior Operative',
      project: 'Woodberry Down Phase 2',
      trainings: {
        'cscs': { status: 'approved', completedDate: new Date('2024-02-01'), expiryDate: new Date('2025-02-01') },
        'induction': { status: 'approved', completedDate: new Date('2024-02-01'), expiryDate: new Date('2025-02-01') },
        'manual-handling': { status: 'approved', completedDate: new Date('2024-05-15'), expiryDate: new Date('2025-05-15') },
        'ladder-safety': { status: 'approved', completedDate: new Date('2024-08-20'), expiryDate: new Date('2025-08-20') },
        'asbestos': { status: 'approved', completedDate: new Date('2024-04-10'), expiryDate: new Date('2025-04-10') },
        'confined-space': { status: 'approved', completedDate: new Date('2024-06-05'), expiryDate: new Date('2025-06-05') },
        'first-aid': { status: 'approved', completedDate: new Date('2024-03-12'), expiryDate: new Date('2027-03-12') }
      }
    },
    {
      operativeId: '3',
      operativeName: 'Mike Johnson',
      role: 'Site Operative',
      project: 'Manor House Development',
      trainings: {
        'cscs': { status: 'approved', completedDate: new Date('2024-03-10'), expiryDate: new Date('2025-03-10') },
        'induction': { status: 'pending', completedDate: new Date('2024-12-08') },
        'manual-handling': { status: 'approved', completedDate: new Date('2024-07-22'), expiryDate: new Date('2025-07-22') },
        'ladder-safety': { status: 'approved', completedDate: new Date('2024-09-15'), expiryDate: new Date('2025-09-15') },
        'asbestos': { status: 'due-soon', completedDate: new Date('2024-01-30'), expiryDate: new Date('2025-01-30') },
        'confined-space': { status: 'not-required' },
        'first-aid': { status: 'pending', completedDate: new Date('2024-12-08') }
      }
    },
    {
      operativeId: '4',
      operativeName: 'Emma Davis',
      role: 'Apprentice',
      project: 'Manor House Development',
      trainings: {
        'cscs': { status: 'approved', completedDate: new Date('2024-09-01'), expiryDate: new Date('2025-09-01') },
        'induction': { status: 'approved', completedDate: new Date('2024-09-01'), expiryDate: new Date('2025-09-01') },
        'manual-handling': { status: 'approved', completedDate: new Date('2024-09-05'), expiryDate: new Date('2025-09-05') },
        'ladder-safety': { status: 'pending', completedDate: new Date('2024-12-10') },
        'asbestos': { status: 'not-required' },
        'confined-space': { status: 'not-required' },
        'first-aid': { status: 'pending', completedDate: new Date('2024-12-05') }
      }
    }
  ]);

  const [filters, setFilters] = useState({
    search: '',
    project: 'all',
    status: 'all',
    trainingType: 'all'
  });

  const [selectedOperatives, setSelectedOperatives] = useState<string[]>([]);

  const trainingTypes = [
    { key: 'cscs', label: 'CSCS Card' },
    { key: 'induction', label: 'Site Induction' },
    { key: 'manual-handling', label: 'Manual Handling' },
    { key: 'ladder-safety', label: 'Ladder Safety' },
    { key: 'asbestos', label: 'Asbestos Awareness' },
    { key: 'confined-space', label: 'Confined Space' },
    { key: 'first-aid', label: 'First Aid' }
  ];

  const projects = [...new Set(matrixData.map(item => item.project))];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'due-soon':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'not-required':
        return <span className="text-muted-foreground">-</span>;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'expired': return 'Expired';
      case 'due-soon': return 'Due Soon';
      case 'pending': return 'Pending';
      case 'not-required': return 'Not Required';
      default: return '';
    }
  };

  const getDaysUntilExpiry = (expiryDate?: Date) => {
    if (!expiryDate) return null;
    const today = new Date();
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const filteredData = matrixData.filter(item => {
    if (filters.search && !item.operativeName.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.project !== 'all' && item.project !== filters.project) {
      return false;
    }
    if (filters.status !== 'all') {
      const hasStatus = Object.values(item.trainings).some(training => training.status === filters.status);
      if (!hasStatus) return false;
    }
    return true;
  });

  const getComplianceStats = () => {
    const totalItems = filteredData.length * trainingTypes.length;
    let approved = 0;
    let expired = 0;
    let dueSoon = 0;
    let pending = 0;

    filteredData.forEach(item => {
      trainingTypes.forEach(type => {
        const training = item.trainings[type.key];
        if (training) {
          switch (training.status) {
            case 'approved': approved++; break;
            case 'expired': expired++; break;
            case 'due-soon': dueSoon++; break;
            case 'pending': pending++; break;
          }
        }
      });
    });

    return { totalItems, approved, expired, dueSoon, pending };
  };

  const stats = getComplianceStats();
  const compliancePercentage = stats.totalItems > 0 ? Math.round((stats.approved / stats.totalItems) * 100) : 0;

  const handleExportCSV = () => {
    const csvHeaders = ['Name', 'Role', 'Project', ...trainingTypes.map(t => t.label)];
    const csvData = filteredData.map(item => [
      item.operativeName,
      item.role,
      item.project,
      ...trainingTypes.map(type => {
        const training = item.trainings[type.key];
        if (!training || training.status === 'not-required') return 'N/A';
        return `${getStatusText(training.status)}${training.expiryDate ? ` (${training.expiryDate.toLocaleDateString()})` : ''}`;
      })
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Training matrix has been downloaded as CSV"
    });
  };

  const handleBulkReminder = () => {
    if (selectedOperatives.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select operatives to send reminders to"
      });
      return;
    }

    toast({
      title: "Reminders Sent",
      description: `Training reminder emails sent to ${selectedOperatives.length} operative${selectedOperatives.length !== 1 ? 's' : ''}`
    });
    setSelectedOperatives([]);
  };

  const toggleOperativeSelection = (operativeId: string) => {
    setSelectedOperatives(prev =>
      prev.includes(operativeId)
        ? prev.filter(id => id !== operativeId)
        : [...prev, operativeId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedOperatives(prev =>
      prev.length === filteredData.length ? [] : filteredData.map(item => item.operativeId)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Training Matrix</h1>
          <p className="text-muted-foreground">Complete training compliance overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkReminder} disabled={selectedOperatives.length === 0}>
            Send Reminders ({selectedOperatives.length})
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-foreground">{compliancePercentage}%</div>
            <div className="text-sm text-muted-foreground">Overall Compliance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.dueSoon}</div>
            <div className="text-sm text-muted-foreground">Due Soon</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-sm text-muted-foreground">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            <Select value={filters.project} onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}>
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
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="due-soon">Due Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.trainingType} onValueChange={(value) => setFilters(prev => ({ ...prev, trainingType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Training Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Training Types</SelectItem>
                {trainingTypes.map(type => (
                  <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle>Training Compliance Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOperatives.length === filteredData.length && filteredData.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Project</TableHead>
                  {trainingTypes.map(type => (
                    <TableHead key={type.key} className="text-center min-w-24">
                      {type.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map(item => (
                  <TableRow key={item.operativeId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOperatives.includes(item.operativeId)}
                        onCheckedChange={() => toggleOperativeSelection(item.operativeId)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.operativeName}</TableCell>
                    <TableCell>{item.role}</TableCell>
                    <TableCell>{item.project}</TableCell>
                    {trainingTypes.map(type => {
                      const training = item.trainings[type.key];
                      const daysUntilExpiry = getDaysUntilExpiry(training?.expiryDate);
                      
                      return (
                        <TableCell key={type.key} className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {getStatusIcon(training?.status || 'not-required')}
                            {training?.expiryDate && training.status !== 'not-required' && (
                              <span className={`text-xs ${
                                daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0
                                  ? 'text-amber-600'
                                  : daysUntilExpiry !== null && daysUntilExpiry <= 0
                                  ? 'text-red-600'
                                  : 'text-muted-foreground'
                              }`}>
                                {daysUntilExpiry !== null && (
                                  daysUntilExpiry > 0 
                                    ? `${daysUntilExpiry}d`
                                    : 'Expired'
                                )}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
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

export default TrainingMatrix;