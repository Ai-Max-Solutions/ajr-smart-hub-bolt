import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Filter, Calendar, FileSpreadsheet, Archive, Shield } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface SignatureRecord {
  id: string;
  operativeName: string;
  operativeId: string;
  signatureType: 'RAMS' | 'Induction' | 'Site Notice' | 'Toolbox Talk' | 'Onboarding';
  documentTitle: string;
  documentVersion: string;
  projectId: string;
  projectName: string;
  plotId?: string;
  plotName?: string;
  signedAt: Date;
  signatureMethod: 'Digital Pad' | 'Checkbox Confirm';
  signatureData: string;
  verifiedBy?: string;
  status: 'Valid' | 'Superseded';
}

const SignatureVaultExport = () => {
  const [signatures] = useState<SignatureRecord[]>([
    // Sample data from multiple projects
    {
      id: '1',
      operativeName: 'John Smith',
      operativeId: 'OP001',
      signatureType: 'RAMS',
      documentTitle: 'MVHR Installation RAMS',
      documentVersion: 'v2.1',
      projectId: 'PROJ001',
      projectName: 'Kidbrooke Village Block C',
      plotId: 'PLOT001',
      plotName: 'Level 2 - Plot 2.05',
      signedAt: new Date('2025-01-13T08:30:00'),
      signatureMethod: 'Digital Pad',
      signatureData: 'data:image/png;base64,signature_data_here',
      verifiedBy: 'Mike Johnson',
      status: 'Valid'
    },
    {
      id: '2',
      operativeName: 'Sarah Wilson',
      operativeId: 'OP002',
      signatureType: 'Induction',
      documentTitle: 'Site Safety Induction',
      documentVersion: 'v1.3',
      projectId: 'PROJ002',
      projectName: 'Woodberry Down Phase 2',
      signedAt: new Date('2025-01-12T07:45:00'),
      signatureMethod: 'Digital Pad',
      signatureData: 'data:image/png;base64,signature_data_here',
      status: 'Valid'
    }
  ]);

  const [projectFilter, setProjectFilter] = useState('all');
  const [operativeFilter, setOperativeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [includeSignatureImages, setIncludeSignatureImages] = useState(true);
  const [includeSuperseded, setIncludeSuperseded] = useState(false);

  const projects = Array.from(new Set(signatures.map(s => ({ id: s.projectId, name: s.projectName }))))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const operatives = Array.from(new Set(signatures.map(s => ({ id: s.operativeId, name: s.operativeName }))))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredSignatures = signatures.filter(signature => {
    const matchesProject = projectFilter === 'all' || signature.projectId === projectFilter;
    const matchesOperative = operativeFilter === 'all' || signature.operativeId === operativeFilter;
    const matchesType = typeFilter === 'all' || signature.signatureType === typeFilter;
    const matchesStatus = statusFilter === 'all' || signature.status === statusFilter;
    const matchesSuperseded = includeSuperseded || signature.status === 'Valid';
    
    let matchesDate = true;
    if (dateRange?.from && dateRange?.to) {
      const signatureDate = signature.signedAt;
      matchesDate = signatureDate >= dateRange.from && signatureDate <= dateRange.to;
    }
    
    return matchesProject && matchesOperative && matchesType && matchesStatus && matchesSuperseded && matchesDate;
  });

  const handleExportCSV = () => {
    console.log('Exporting CSV with', filteredSignatures.length, 'signatures');
    // Mock CSV export
  };

  const handleExportPDFBundle = () => {
    console.log('Exporting PDF bundle with signature images:', includeSignatureImages);
    // Mock PDF export
  };

  const handleAuditExport = () => {
    console.log('Generating audit-ready export package');
    // Mock audit export
  };

  const getComplianceStats = () => {
    const total = filteredSignatures.length;
    const valid = filteredSignatures.filter(s => s.status === 'Valid').length;
    const superseded = filteredSignatures.filter(s => s.status === 'Superseded').length;
    
    return { total, valid, superseded };
  };

  const stats = getComplianceStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Signature Vault Export</h1>
          <p className="text-muted-foreground">Export signature records for audit, compliance, and client handovers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAuditExport}>
            <Shield className="w-4 h-4 mr-2" />
            Audit Package
          </Button>
        </div>
      </div>

      <Tabs defaultValue="filters" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="filters">Filters & Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview Results</TabsTrigger>
          <TabsTrigger value="export">Export Options</TabsTrigger>
        </TabsList>

        <TabsContent value="filters" className="space-y-6">
          {/* Advanced Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Filter className="w-5 h-5 mr-2" />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={operativeFilter} onValueChange={setOperativeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Operatives" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Operatives</SelectItem>
                    {operatives.map((operative) => (
                      <SelectItem key={operative.id} value={operative.id}>
                        {operative.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="RAMS">RAMS</SelectItem>
                    <SelectItem value="Induction">Induction</SelectItem>
                    <SelectItem value="Site Notice">Site Notice</SelectItem>
                    <SelectItem value="Toolbox Talk">Toolbox Talk</SelectItem>
                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Valid">Valid Only</SelectItem>
                    <SelectItem value="Superseded">Superseded Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange}
                    placeholder="Select date range..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-superseded"
                      checked={includeSuperseded}
                      onCheckedChange={(checked) => setIncludeSuperseded(checked === true)}
                    />
                    <label htmlFor="include-superseded" className="text-sm">
                      Include superseded signatures
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-signature-images"
                      checked={includeSignatureImages}
                      onCheckedChange={(checked) => setIncludeSignatureImages(checked === true)}
                    />
                    <label htmlFor="include-signature-images" className="text-sm">
                      Include signature images in PDF export
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.valid}</p>
                    <p className="text-sm text-muted-foreground">Valid Signatures</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Archive className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.superseded}</p>
                    <p className="text-sm text-muted-foreground">Superseded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Preview ({filteredSignatures.length} records)</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSignatures.length > 0 ? (
                <div className="space-y-4">
                  {filteredSignatures.slice(0, 10).map((signature) => (
                    <div key={signature.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{signature.signatureType}</Badge>
                          <Badge className={signature.status === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {signature.status}
                          </Badge>
                        </div>
                        <p className="font-medium">{signature.operativeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {signature.documentTitle} v{signature.documentVersion} • {signature.projectName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {signature.signedAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {filteredSignatures.length > 10 && (
                    <p className="text-center text-muted-foreground text-sm">
                      ... and {filteredSignatures.length - 10} more records
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No records match your filters</h3>
                  <p className="text-muted-foreground">Try adjusting your filters to see results.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSV Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  CSV Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Export signature records as a CSV file for spreadsheet analysis or external systems.
                </p>
                <div className="space-y-2">
                  <p className="text-sm">• All signature metadata</p>
                  <p className="text-sm">• Operative details</p>
                  <p className="text-sm">• Project and plot information</p>
                  <p className="text-sm">• Timestamps and versions</p>
                </div>
                <Button onClick={handleExportCSV} className="w-full" disabled={filteredSignatures.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV ({filteredSignatures.length} records)
                </Button>
              </CardContent>
            </Card>

            {/* PDF Bundle Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  PDF Bundle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Export a comprehensive PDF bundle with signature images and document snapshots.
                </p>
                <div className="space-y-2">
                  <p className="text-sm">• Individual signature PDFs</p>
                  <p className="text-sm">• Document version snapshots</p>
                  <p className="text-sm">• Compliance summary report</p>
                  <p className="text-sm">• Audit-ready formatting</p>
                </div>
                <Button onClick={handleExportPDFBundle} className="w-full" disabled={filteredSignatures.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF Bundle
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Audit Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Audit Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Generate a complete audit package including all signature records, compliance reports, 
                  and supporting documentation for legal, insurance, or regulatory requirements.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Includes:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Complete signature log (CSV)</li>
                      <li>• Individual signature PDFs</li>
                      <li>• Compliance summary report</li>
                      <li>• Version history tracking</li>
                      <li>• Legal declaration documents</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Suitable for:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• HSE inspections</li>
                      <li>• Insurance claims</li>
                      <li>• Client handovers</li>
                      <li>• Legal proceedings</li>
                      <li>• Regulatory compliance</li>
                    </ul>
                  </div>
                </div>
                
                <Button onClick={handleAuditExport} size="lg" className="w-full" disabled={filteredSignatures.length === 0}>
                  <Shield className="w-4 h-4 mr-2" />
                  Generate Audit Package ({filteredSignatures.length} records)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SignatureVaultExport;