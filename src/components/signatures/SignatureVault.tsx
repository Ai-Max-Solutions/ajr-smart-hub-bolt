import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Users, TrendingUp, Filter, Search, Calendar } from 'lucide-react';

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

const SignatureVault = () => {
  const [signatures] = useState<SignatureRecord[]>([
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
      projectId: 'PROJ001',
      projectName: 'Kidbrooke Village Block C',
      signedAt: new Date('2025-01-12T07:45:00'),
      signatureMethod: 'Digital Pad',
      signatureData: 'data:image/png;base64,signature_data_here',
      status: 'Valid'
    },
    {
      id: '3',
      operativeName: 'Tom Brown',
      operativeId: 'OP003',
      signatureType: 'Site Notice',
      documentTitle: 'Crane Operation Notice',
      documentVersion: 'v1.0',
      projectId: 'PROJ001',
      projectName: 'Kidbrooke Village Block C',
      signedAt: new Date('2025-01-11T14:20:00'),
      signatureMethod: 'Checkbox Confirm',
      signatureData: 'confirmed',
      status: 'Valid'
    },
    {
      id: '4',
      operativeName: 'John Smith',
      operativeId: 'OP001',
      signatureType: 'RAMS',
      documentTitle: 'Electrical Installation RAMS',
      documentVersion: 'v1.0',
      projectId: 'PROJ001',
      projectName: 'Kidbrooke Village Block C',
      signedAt: new Date('2025-01-10T09:15:00'),
      signatureMethod: 'Digital Pad',
      signatureData: 'data:image/png;base64,signature_data_here',
      status: 'Superseded'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [operativeFilter, setOperativeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [plotFilter, setPlotFilter] = useState('all');

  const filteredSignatures = signatures.filter(signature => {
    const matchesSearch = signature.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signature.operativeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOperative = operativeFilter === 'all' || signature.operativeId === operativeFilter;
    const matchesType = typeFilter === 'all' || signature.signatureType === typeFilter;
    const matchesStatus = statusFilter === 'all' || signature.status === statusFilter;
    const matchesPlot = plotFilter === 'all' || signature.plotId === plotFilter;
    
    return matchesSearch && matchesOperative && matchesType && matchesStatus && matchesPlot;
  });

  const validSignatures = signatures.filter(s => s.status === 'Valid');
  const completionRate = Math.round((validSignatures.length / signatures.length) * 100);

  const operatives = Array.from(new Set(signatures.map(s => ({ id: s.operativeId, name: s.operativeName }))))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const plots = Array.from(new Set(signatures.filter(s => s.plotId).map(s => ({ id: s.plotId!, name: s.plotName! }))))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleExportSignatures = () => {
    console.log('Exporting filtered signatures:', filteredSignatures);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Valid') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Valid</Badge>;
    }
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Superseded</Badge>;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RAMS': return 'bg-blue-100 text-blue-800';
      case 'Induction': return 'bg-green-100 text-green-800';
      case 'Site Notice': return 'bg-yellow-100 text-yellow-800';
      case 'Toolbox Talk': return 'bg-purple-100 text-purple-800';
      case 'Onboarding': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Signature Vault</h1>
          <p className="text-muted-foreground">Monitor team signature compliance and export audit logs</p>
        </div>
        <Button onClick={handleExportSignatures} className="w-fit">
          <Download className="w-4 h-4 mr-2" />
          Export Log
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="signatures">All Signatures</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{signatures.length}</p>
                    <p className="text-sm text-muted-foreground">Total Signatures</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{completionRate}%</p>
                    <p className="text-sm text-muted-foreground">Valid Signatures</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{operatives.length}</p>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Signatures */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Signatures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {signatures.slice(0, 5).map((signature) => (
                  <div key={signature.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getTypeColor(signature.signatureType)}>
                          {signature.signatureType}
                        </Badge>
                        {getStatusBadge(signature.status)}
                      </div>
                      <p className="font-medium">{signature.operativeName}</p>
                      <p className="text-sm text-muted-foreground">{signature.documentTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{signature.signedAt.toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">{signature.signedAt.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signatures" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Filter className="w-5 h-5 mr-2" />
                Filter Signatures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search signatures..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
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
                
                <Select value={plotFilter} onValueChange={setPlotFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Plots" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plots</SelectItem>
                    {plots.map((plot) => (
                      <SelectItem key={plot.id} value={plot.id}>
                        {plot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Valid">Valid</SelectItem>
                    <SelectItem value="Superseded">Superseded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Signatures Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Signatures ({filteredSignatures.length})</CardTitle>
                <Button variant="outline" onClick={handleExportSignatures}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Filtered
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSignatures.map((signature) => (
                  <div key={signature.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getTypeColor(signature.signatureType)}>
                            {signature.signatureType}
                          </Badge>
                          {getStatusBadge(signature.status)}
                        </div>
                        
                        <div>
                          <h4 className="font-medium">{signature.operativeName}</h4>
                          <p className="text-sm text-muted-foreground">{signature.documentTitle} v{signature.documentVersion}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {signature.plotName && (
                            <p><span className="font-medium">Plot:</span> {signature.plotName}</p>
                          )}
                          <p className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {signature.signedAt.toLocaleString()}
                          </p>
                          <p><span className="font-medium">Method:</span> {signature.signatureMethod}</p>
                          {signature.verifiedBy && (
                            <p><span className="font-medium">Verified by:</span> {signature.verifiedBy}</p>
                          )}
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredSignatures.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No signatures found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Signature Types</h4>
                    <div className="space-y-2">
                      {['RAMS', 'Induction', 'Site Notice', 'Toolbox Talk', 'Onboarding'].map(type => {
                        const count = signatures.filter(s => s.signatureType === type).length;
                        return (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-sm">{type}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Status Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Valid Signatures</span>
                        <Badge className="bg-green-100 text-green-800">
                          {signatures.filter(s => s.status === 'Valid').length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Superseded</span>
                        <Badge className="bg-red-100 text-red-800">
                          {signatures.filter(s => s.status === 'Superseded').length}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SignatureVault;