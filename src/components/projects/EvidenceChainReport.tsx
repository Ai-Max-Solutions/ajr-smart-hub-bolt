import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Search, Filter, Eye, FileText, QrCode } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEvidenceChain } from '@/hooks/useEvidenceChain';

interface EvidenceRecord {
  record_id: string;
  project_name: string;
  operative_name: string;
  plot_number: string;
  document_type: string;
  document_version: string;
  action_type: string;
  created_at: string;
  evidence_hash: string;
  device_info: any;
}

interface EvidenceChainReportProps {
  projectId?: string;
  operativeId?: string;
  plotId?: string;
}

const EvidenceChainReport: React.FC<EvidenceChainReportProps> = ({
  projectId,
  operativeId,
  plotId
}) => {
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  const { toast } = useToast();
  const { exportEvidenceChain } = useEvidenceChain();

  useEffect(() => {
    fetchEvidenceRecords();
  }, [projectId, operativeId, plotId]);

  useEffect(() => {
    applyFilters();
  }, [evidenceRecords, searchTerm, selectedDocumentType, selectedActionType, dateFrom, dateTo]);

  const fetchEvidenceRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_evidence_chain_report', {
        p_project_id: projectId || null,
        p_operative_id: operativeId || null,
        p_plot_id: plotId || null,
        p_date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null,
        p_date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : null
      });

      if (error) throw error;
      setEvidenceRecords(data || []);
    } catch (error: any) {
      console.error('Error fetching evidence records:', error);
      toast({
        title: "Error",
        description: "Failed to load evidence chain records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = evidenceRecords;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.operative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.plot_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.document_version?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Document type filter
    if (selectedDocumentType !== 'all') {
      filtered = filtered.filter(record => record.document_type === selectedDocumentType);
    }

    // Action type filter
    if (selectedActionType !== 'all') {
      filtered = filtered.filter(record => record.action_type === selectedActionType);
    }

    // Date filters
    if (dateFrom) {
      filtered = filtered.filter(record => new Date(record.created_at) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(record => new Date(record.created_at) <= dateTo);
    }

    setFilteredRecords(filtered);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'sign':
        return <FileText className="h-4 w-4" />;
      case 'qr_scan':
        return <QrCode className="h-4 w-4" />;
      case 'download':
        return <Download className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'sign':
        return 'default';
      case 'view':
        return 'secondary';
      case 'qr_scan':
        return 'outline';
      case 'upload':
        return 'default';
      case 'supersede':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleExport = async (exportFormat: 'pdf' | 'csv' | 'zip' | 'json') => {
    try {
      const scopeData: any = {};
      
      if (projectId) scopeData.projectIds = [projectId];
      if (operativeId) scopeData.operativeIds = [operativeId];
      if (plotId) scopeData.plotIds = [plotId];
      if (dateFrom) scopeData.dateFrom = format(dateFrom, 'yyyy-MM-dd');
      if (dateTo) scopeData.dateTo = format(dateTo, 'yyyy-MM-dd');

      await exportEvidenceChain({
        exportType: projectId ? 'project' : operativeId ? 'operative' : plotId ? 'plot' : 'custom',
        scopeData,
        exportFormat: exportFormat,
        filters: {
          documentType: selectedDocumentType,
          actionType: selectedActionType,
          searchTerm
        }
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const stats = {
    totalRecords: filteredRecords.length,
    signatureEvents: filteredRecords.filter(r => r.action_type === 'sign').length,
    qrScans: filteredRecords.filter(r => r.action_type === 'qr_scan').length,
    uploads: filteredRecords.filter(r => r.action_type === 'upload').length,
    uniqueOperatives: new Set(filteredRecords.map(r => r.operative_name)).size,
    uniqueDocuments: new Set(filteredRecords.map(r => `${r.document_type}-${r.document_version}`)).size
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Evidence Chain Report</h2>
          <p className="text-muted-foreground">Immutable audit trail of all document interactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('pdf')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => handleExport('csv')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => handleExport('zip')} variant="default">
            <Download className="h-4 w-4 mr-2" />
            Full Archive
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.totalRecords}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.signatureEvents}</div>
            <div className="text-sm text-muted-foreground">Signatures</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.qrScans}</div>
            <div className="text-sm text-muted-foreground">QR Scans</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.uploads}</div>
            <div className="text-sm text-muted-foreground">Uploads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.uniqueOperatives}</div>
            <div className="text-sm text-muted-foreground">Operatives</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.uniqueDocuments}</div>
            <div className="text-sm text-muted-foreground">Documents</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="analysis">Compliance Analysis</TabsTrigger>
          <TabsTrigger value="filters">Advanced Filters</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {/* Search and Basic Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search operatives, projects, plots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="RAMS">RAMS</SelectItem>
                <SelectItem value="Drawing">Drawings</SelectItem>
                <SelectItem value="Task_Plan">Task Plans</SelectItem>
                <SelectItem value="Site_Notice">Site Notices</SelectItem>
                <SelectItem value="POD">PODs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedActionType} onValueChange={setSelectedActionType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="sign">Signatures</SelectItem>
                <SelectItem value="view">Views</SelectItem>
                <SelectItem value="qr_scan">QR Scans</SelectItem>
                <SelectItem value="download">Downloads</SelectItem>
                <SelectItem value="upload">Uploads</SelectItem>
                <SelectItem value="supersede">Superseded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Evidence Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Evidence Chain Records ({filteredRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading evidence records...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No evidence records found for the selected criteria.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecords.map((record) => (
                    <div key={record.record_id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getActionIcon(record.action_type)}
                          <div>
                            <div className="font-medium">{record.operative_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.project_name} • Plot {record.plot_number}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionBadgeVariant(record.action_type)}>
                            {record.action_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {record.document_type} v{record.document_version}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(record.created_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground font-mono">
                        Hash: {record.evidence_hash.substring(0, 16)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Compliance analysis dashboard coming soon...</p>
                <p className="text-sm text-muted-foreground mt-2">Will include trends, patterns, and risk analysis.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium">Date To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button onClick={fetchEvidenceRecords} className="w-full">
                Apply Filters
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EvidenceChainReport;