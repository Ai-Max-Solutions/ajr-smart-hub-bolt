import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Search,
  Calendar,
  User,
  Filter,
  Plus,
  File,
  Image,
  Archive
} from 'lucide-react';

interface ProjectDocument {
  id: string;
  name: string;
  type: 'rams' | 'drawing' | 'specification' | 'certificate' | 'report' | 'other';
  version: string;
  uploadedBy: string;
  uploadedDate: string;
  fileSize: string;
  status: 'active' | 'archived' | 'pending';
  workTypes?: string[];
}

interface ProjectDocumentsProps {
  projectId: string;
}

// Mock documents data
const mockDocuments: ProjectDocument[] = [
  {
    id: '1',
    name: 'Electrical Installation RAMS',
    type: 'rams',
    version: 'v2.1',
    uploadedBy: 'Sarah Johnson',
    uploadedDate: '2024-01-20',
    fileSize: '2.4 MB',
    status: 'active',
    workTypes: ['Electrical Installation', 'First Fix']
  },
  {
    id: '2',
    name: 'Site Layout Drawing',
    type: 'drawing',
    version: 'v1.3',
    uploadedBy: 'Mike Wilson',
    uploadedDate: '2024-01-18',
    fileSize: '5.2 MB',
    status: 'active'
  },
  {
    id: '3',
    name: 'Testing & Inspection RAMS',
    type: 'rams',
    version: 'v1.0',
    uploadedBy: 'Emma Davis',
    uploadedDate: '2024-01-15',
    fileSize: '1.8 MB',
    status: 'active',
    workTypes: ['Testing & Inspection']
  },
  {
    id: '4',
    name: 'Technical Specification',
    type: 'specification',
    version: 'v2.0',
    uploadedBy: 'Tom Brown',
    uploadedDate: '2024-01-10',
    fileSize: '3.1 MB',
    status: 'active'
  },
  {
    id: '5',
    name: 'Safety Certificate',
    type: 'certificate',
    version: 'v1.0',
    uploadedBy: 'Lisa Clark',
    uploadedDate: '2024-01-08',
    fileSize: '892 KB',
    status: 'active'
  },
  {
    id: '6',
    name: 'Weekly Progress Report',
    type: 'report',
    version: 'v1.2',
    uploadedBy: 'Sarah Johnson',
    uploadedDate: '2024-01-05',
    fileSize: '1.5 MB',
    status: 'archived'
  }
];

const ProjectDocuments = ({ projectId }: ProjectDocumentsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUploading, setIsUploading] = useState(false);

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'rams':
        return <Badge className="bg-destructive text-destructive-foreground">RAMS</Badge>;
      case 'drawing':
        return <Badge className="bg-primary text-primary-foreground">Drawing</Badge>;
      case 'specification':
        return <Badge className="bg-accent text-accent-foreground">Spec</Badge>;
      case 'certificate':
        return <Badge className="bg-success text-success-foreground">Cert</Badge>;
      case 'report':
        return <Badge variant="secondary">Report</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'drawing':
        return <Image className="w-5 h-5 text-primary" />;
      case 'report':
        return <Archive className="w-5 h-5 text-muted-foreground" />;
      default:
        return <FileText className="w-5 h-5 text-accent" />;
    }
  };

  const handleUpload = () => {
    setIsUploading(true);
    
    // Simulate upload
    setTimeout(() => {
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });
      setIsUploading(false);
    }, 2000);
  };

  const documentStats = {
    total: mockDocuments.length,
    active: mockDocuments.filter(d => d.status === 'active').length,
    rams: mockDocuments.filter(d => d.type === 'rams').length,
    drawings: mockDocuments.filter(d => d.type === 'drawing').length
  };

  return (
    <div className="space-y-6">
      {/* Document Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">{documentStats.total}</p>
            <p className="text-xs text-muted-foreground">Total Documents</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <File className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-success">{documentStats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <Archive className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold text-destructive">{documentStats.rams}</p>
            <p className="text-xs text-muted-foreground">RAMS</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <Image className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-accent">{documentStats.drawings}</p>
            <p className="text-xs text-muted-foreground">Drawings</p>
          </CardContent>
        </Card>
      </div>

      {/* Document Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              Project Documents
            </CardTitle>
            
            <Dialog open={isUploading} onOpenChange={setIsUploading}>
              <DialogTrigger asChild>
                <Button className="btn-accent">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Document Type</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rams">RAMS Document</SelectItem>
                        <SelectItem value="drawing">Technical Drawing</SelectItem>
                        <SelectItem value="specification">Specification</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Document Name</label>
                    <Input placeholder="Enter document name" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Version</label>
                    <Input placeholder="e.g. v1.0" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">File Upload</label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop your file here, or click to browse
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsUploading(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} className="btn-primary">
                      Upload Document
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rams">RAMS</SelectItem>
                <SelectItem value="drawing">Drawings</SelectItem>
                <SelectItem value="specification">Specifications</SelectItem>
                <SelectItem value="certificate">Certificates</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Document Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start space-x-3">
                        {getFileIcon(document.type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{document.name}</h3>
                            {getTypeBadge(document.type)}
                            {getStatusBadge(document.status)}
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              Uploaded by {document.uploadedBy}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(document.uploadedDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs">
                              Version {document.version} • {document.fileSize}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Work Types (if applicable) */}
                    <div>
                      {document.workTypes && (
                        <div>
                          <p className="text-sm font-medium mb-2">Applicable Work Types</p>
                          <div className="flex flex-wrap gap-1">
                            {document.workTypes.map((workType) => (
                              <Badge key={workType} variant="outline" className="text-xs">
                                {workType}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredDocuments.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No documents found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDocuments;