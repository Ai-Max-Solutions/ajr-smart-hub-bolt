import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus, 
  Eye, 
  Link, 
  Upload,
  CheckCircle2,
  Users
} from 'lucide-react';

interface RAMSDocument {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'archived';
  signedCount: number;
  pendingCount: number;
  uploadDate: string;
  linkedPlots: string[];
}

interface RAMSTableProps {
  projectId: string;
}

const mockRAMSDocuments: RAMSDocument[] = [
  {
    id: '1',
    name: 'Electrical Safety RAMS',
    version: 'v2.1',
    status: 'active',
    signedCount: 8,
    pendingCount: 2,
    uploadDate: '2024-01-15',
    linkedPlots: ['All Electrical Work']
  },
  {
    id: '2',
    name: 'Working at Height',
    version: 'v1.3',
    status: 'active',
    signedCount: 10,
    pendingCount: 0,
    uploadDate: '2024-01-18',
    linkedPlots: ['F01', 'F02', 'S01', 'S02']
  },
  {
    id: '3',
    name: 'Manual Handling',
    version: 'v1.0',
    status: 'active',
    signedCount: 7,
    pendingCount: 3,
    uploadDate: '2024-01-20',
    linkedPlots: ['All levels']
  },
  {
    id: '4',
    name: 'Confined Spaces (Old)',
    version: 'v1.0',
    status: 'archived',
    signedCount: 5,
    pendingCount: 0,
    uploadDate: '2024-01-10',
    linkedPlots: []
  }
];

const RAMSTable = ({ projectId }: RAMSTableProps) => {
  const [isUploadingRAMS, setIsUploadingRAMS] = useState(false);
  const [newRAMSName, setNewRAMSName] = useState('');

  const handleUploadRAMS = () => {
    if (!newRAMSName.trim()) return;
    
    toast({
      title: "RAMS Document Uploaded",
      description: `${newRAMSName} has been uploaded successfully.`,
    });
    
    setNewRAMSName('');
    setIsUploadingRAMS(false);
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-success text-success-foreground">Active</Badge>
      : <Badge variant="secondary">Archived</Badge>;
  };

  const activeDocuments = mockRAMSDocuments.filter(doc => doc.status === 'active');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            RAMS & Task Plans
          </CardTitle>
          
          <Dialog open={isUploadingRAMS} onOpenChange={setIsUploadingRAMS}>
            <DialogTrigger asChild>
              <Button className="btn-accent">
                <Plus className="w-4 h-4 mr-2" />
                Upload New RAMS
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload RAMS Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Document Name</label>
                  <Input
                    placeholder="e.g. Hot Work RAMS, Asbestos Safety"
                    value={newRAMSName}
                    onChange={(e) => setNewRAMSName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Upload File</label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsUploadingRAMS(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUploadRAMS} className="btn-primary">
                    Upload RAMS
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Signatures</TableHead>
              <TableHead>Linked To</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeDocuments.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div className="font-medium">{document.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{document.version}</Badge>
                </TableCell>
                <TableCell>
                  {getStatusBadge(document.status)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success mr-1" />
                      {document.signedCount} Signed
                    </div>
                    {document.pendingCount > 0 && (
                      <div className="flex items-center text-sm text-warning">
                        <Users className="w-4 h-4 mr-1" />
                        {document.pendingCount} Pending
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {document.linkedPlots.slice(0, 2).map((plot) => (
                      <Badge key={plot} variant="outline" className="text-xs mr-1">
                        {plot}
                      </Badge>
                    ))}
                    {document.linkedPlots.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{document.linkedPlots.length - 2} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {activeDocuments.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No RAMS documents</h3>
            <p className="text-muted-foreground mb-4">Upload your first RAMS document to get started</p>
            <Button onClick={() => setIsUploadingRAMS(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Upload First RAMS
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RAMSTable;