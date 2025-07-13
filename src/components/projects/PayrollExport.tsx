import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, Calendar, Users, Building2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for payroll export
interface PayrollRecord {
  id: string;
  operativeName: string;
  userId: string;
  weekEnding: string;
  project: string;
  plotsWorked: string[];
  daysWorked: number;
  partialHours: number;
  pieceworkUnits: number;
  dayRate: number;
  hourlyRate: number;
  pieceworkRate: number;
  subtotalDayHours: number;
  subtotalPiecework: number;
  grossTotal: number;
  approvalStatus: 'approved' | 'pending' | 'rejected';
  approvedBy: string;
  approvalDate: string;
  complianceStatus: {
    rams: boolean;
    cscs: boolean;
  };
}

interface ExportBatch {
  id: string;
  exportDate: string;
  exportedBy: string;
  recordCount: number;
  grossValue: number;
  status: 'completed' | 'processing';
}

// Mock data for demonstration
const mockPayrollRecords: PayrollRecord[] = [
  {
    id: 'PR001',
    operativeName: 'John Smith',
    userId: '1234',
    weekEnding: '2025-01-19',
    project: 'Woodberry Down Phase 2 Block D',
    plotsWorked: ['Level 1 - Plot 1.02', 'Level 1 - Plot 1.03'],
    daysWorked: 5,
    partialHours: 2.5,
    pieceworkUnits: 18,
    dayRate: 180,
    hourlyRate: 22,
    pieceworkRate: 35,
    subtotalDayHours: 955,
    subtotalPiecework: 630,
    grossTotal: 1585,
    approvalStatus: 'approved',
    approvedBy: 'Jane Doe',
    approvalDate: '2025-01-20',
    complianceStatus: { rams: true, cscs: true }
  },
  {
    id: 'PR002',
    operativeName: 'Mike Johnson',
    userId: '5678',
    weekEnding: '2025-01-19',
    project: 'Kidbrooke Village Block C',
    plotsWorked: ['Level 2 - Plot 2.05'],
    daysWorked: 4,
    partialHours: 0,
    pieceworkUnits: 12,
    dayRate: 175,
    hourlyRate: 22,
    pieceworkRate: 40,
    subtotalDayHours: 700,
    subtotalPiecework: 480,
    grossTotal: 1180,
    approvalStatus: 'approved',
    approvedBy: 'Sarah Wilson',
    approvalDate: '2025-01-20',
    complianceStatus: { rams: true, cscs: true }
  }
];

const mockExportHistory: ExportBatch[] = [
  {
    id: 'PAYEXPORT-0021',
    exportDate: '2025-01-20T14:30:00Z',
    exportedBy: 'accounts@ajryan.com',
    recordCount: 25,
    grossValue: 38750,
    status: 'completed'
  },
  {
    id: 'PAYEXPORT-0020',
    exportDate: '2025-01-13T16:45:00Z',
    exportedBy: 'accounts@ajryan.com',
    recordCount: 28,
    grossValue: 41200,
    status: 'completed'
  }
];

interface PayrollExportProps {
  projectId?: string;
}

export const PayrollExport: React.FC<PayrollExportProps> = ({ projectId }) => {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    project: '',
    weekEnding: '',
    operative: '',
    payType: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  // Filter and search records
  const filteredRecords = useMemo(() => {
    return mockPayrollRecords.filter(record => {
      const matchesSearch = record.operativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.project.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = !filters.project || record.project.includes(filters.project);
      const matchesWeek = !filters.weekEnding || record.weekEnding === filters.weekEnding;
      const matchesOperative = !filters.operative || record.operativeName.includes(filters.operative);
      const matchesStatus = record.approvalStatus === 'approved'; // Only show approved records
      
      return matchesSearch && matchesProject && matchesWeek && matchesOperative && matchesStatus;
    });
  }, [searchTerm, filters]);

  // Calculate totals
  const totals = useMemo(() => {
    const records = selectedRecords.length > 0 
      ? filteredRecords.filter(r => selectedRecords.includes(r.id))
      : filteredRecords;
    
    return {
      recordCount: records.length,
      totalDays: records.reduce((sum, r) => sum + r.daysWorked, 0),
      totalHours: records.reduce((sum, r) => sum + r.partialHours, 0),
      totalUnits: records.reduce((sum, r) => sum + r.pieceworkUnits, 0),
      grossTotal: records.reduce((sum, r) => sum + r.grossTotal, 0)
    };
  }, [filteredRecords, selectedRecords]);

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredRecords.map(r => r.id));
    }
  };

  const handleExportCSV = () => {
    const recordsToExport = selectedRecords.length > 0 
      ? filteredRecords.filter(r => selectedRecords.includes(r.id))
      : filteredRecords;

    if (recordsToExport.length === 0) {
      toast({
        title: "No records to export",
        description: "Please select at least one record to export.",
        variant: "destructive"
      });
      return;
    }

    // Generate CSV content
    const headers = [
      'Operative Name', 'User ID', 'Project', 'Plot', 'Week Ending',
      'Days Worked', 'Partial Hours', 'Piecework Units',
      'Day Rate (£)', 'Hourly Rate (£)', 'Piecework Rate (£)',
      'Subtotal (Day/Hours)', 'Subtotal (Piecework)', 'Gross Total',
      'Supervisor Approved By', 'Approval Date', 'Export Batch ID'
    ];

    const exportBatchId = `PAYEXPORT-${String(mockExportHistory.length + 1).padStart(4, '0')}`;
    
    const csvContent = [
      headers.join(','),
      ...recordsToExport.map(record => [
        record.operativeName,
        record.userId,
        record.project,
        record.plotsWorked.join('; '),
        record.weekEnding,
        record.daysWorked,
        record.partialHours,
        record.pieceworkUnits,
        record.dayRate,
        record.hourlyRate,
        record.pieceworkRate,
        record.subtotalDayHours,
        record.subtotalPiecework,
        record.grossTotal,
        record.approvedBy,
        record.approvalDate,
        exportBatchId
      ].join(','))
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll-export-${exportBatchId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: `Successfully exported ${recordsToExport.length} records - Batch ID: ${exportBatchId}`,
    });

    // Clear selection after export
    setSelectedRecords([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll Export</h1>
          <p className="text-muted-foreground">Export approved timesheet data for payroll processing</p>
        </div>
        <Button 
          onClick={handleExportCSV}
          className="bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90 text-white"
          disabled={filteredRecords.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV ({selectedRecords.length > 0 ? selectedRecords.length : filteredRecords.length} records)
        </Button>
      </div>

      <Tabs defaultValue="records" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search operative or project..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={filters.project} onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All projects</SelectItem>
                      <SelectItem value="Woodberry Down">Woodberry Down Phase 2</SelectItem>
                      <SelectItem value="Kidbrooke Village">Kidbrooke Village</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Week Ending</label>
                  <Input
                    type="date"
                    value={filters.weekEnding}
                    onChange={(e) => setFilters(prev => ({ ...prev, weekEnding: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pay Type</label>
                  <Select value={filters.payType} onValueChange={(value) => setFilters(prev => ({ ...prev, payType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="day">Day Rate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="piecework">Piecework</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Records</p>
                    <p className="text-2xl font-bold">{totals.recordCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Total Days</p>
                    <p className="text-2xl font-bold">{totals.totalDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Total Units</p>
                    <p className="text-2xl font-bold">{totals.totalUnits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Gross Total</p>
                    <p className="text-2xl font-bold">£{totals.grossTotal.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Approved Payroll Records</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedRecords.length === filteredRecords.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Operative</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Week Ending</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Day Rate</TableHead>
                      <TableHead>Piecework</TableHead>
                      <TableHead>Gross Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approved By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={() => handleSelectRecord(record.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{record.operativeName}</TableCell>
                        <TableCell>{record.project}</TableCell>
                        <TableCell>{new Date(record.weekEnding).toLocaleDateString()}</TableCell>
                        <TableCell>{record.daysWorked}</TableCell>
                        <TableCell>{record.partialHours}h</TableCell>
                        <TableCell>{record.pieceworkUnits}</TableCell>
                        <TableCell>£{record.subtotalDayHours}</TableCell>
                        <TableCell>£{record.subtotalPiecework}</TableCell>
                        <TableCell className="font-semibold">£{record.grossTotal}</TableCell>
                        <TableCell>{getStatusBadge(record.approvalStatus)}</TableCell>
                        <TableCell>{record.approvedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Export ID</TableHead>
                      <TableHead>Export Date</TableHead>
                      <TableHead>Exported By</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Gross Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockExportHistory.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-mono">{batch.id}</TableCell>
                        <TableCell>{new Date(batch.exportDate).toLocaleString()}</TableCell>
                        <TableCell>{batch.exportedBy}</TableCell>
                        <TableCell>{batch.recordCount}</TableCell>
                        <TableCell>£{batch.grossValue.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(batch.status)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Download className="w-3 h-3 mr-1" />
                            Re-export
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};