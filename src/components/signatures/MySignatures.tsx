import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, Filter, CheckCircle, XCircle } from 'lucide-react';

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

const MySignatures = () => {
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
      status: 'Valid'
    },
    {
      id: '2',
      operativeName: 'John Smith',
      operativeId: 'OP001',
      signatureType: 'Induction',
      documentTitle: 'Kidbrooke Village Block C Site Induction',
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
      operativeName: 'John Smith',
      operativeId: 'OP001',
      signatureType: 'RAMS',
      documentTitle: 'Electrical Installation RAMS',
      documentVersion: 'v1.0',
      projectId: 'PROJ002',
      projectName: 'Woodberry Down Phase 2',
      signedAt: new Date('2025-01-10T09:15:00'),
      signatureMethod: 'Digital Pad',
      signatureData: 'data:image/png;base64,signature_data_here',
      status: 'Superseded'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSignatures = signatures.filter(signature => {
    const matchesSearch = signature.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signature.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || signature.signatureType === typeFilter;
    const matchesStatus = statusFilter === 'all' || signature.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Valid') {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
    }
    return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Superseded</Badge>;
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

  const handleDownloadSignature = (signature: SignatureRecord) => {
    // Mock download functionality
    console.log('Downloading signature:', signature.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Signatures</h1>
          <p className="text-muted-foreground">View your signature history and compliance records</p>
        </div>
        <Badge variant="outline" className="w-fit">
          {filteredSignatures.length} signature{filteredSignatures.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2" />
            Filter Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by document or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
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
              <SelectTrigger className="w-full md:w-48">
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

      {/* Signatures List */}
      <div className="space-y-4">
        {filteredSignatures.map((signature) => (
          <Card key={signature.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getTypeColor(signature.signatureType)}>
                      {signature.signatureType}
                    </Badge>
                    {getStatusBadge(signature.status)}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-foreground">{signature.documentTitle}</h3>
                    <p className="text-sm text-muted-foreground">Version {signature.documentVersion}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Project:</span> {signature.projectName}
                    </p>
                    {signature.plotName && (
                      <p className="text-sm">
                        <span className="font-medium">Plot:</span> {signature.plotName}
                      </p>
                    )}
                    <p className="text-sm flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Signed on {signature.signedAt.toLocaleDateString()} at {signature.signedAt.toLocaleTimeString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Method:</span> {signature.signatureMethod}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 md:w-48">
                  <Button
                    onClick={() => handleDownloadSignature(signature)}
                    className="w-full"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    View Signed PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSignatures.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No signatures found</h3>
            <p className="text-muted-foreground">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'You haven\'t signed any documents yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MySignatures;