import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Eye, MoreHorizontal, Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  description: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  version_number: string;
  status: string;
  uploaded_by: string;
  created_at: string;
  download_count: number;
  uploader_name: string;
}

interface DocumentBrowserProps {
  projectId: string;
  folderId: string | null;
}

const STATUS_COLORS = {
  draft: 'secondary',
  under_review: 'outline',
  approved: 'default',
  superseded: 'secondary',
  archived: 'destructive'
} as const;

export function DocumentBrowser({ projectId, folderId }: DocumentBrowserProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, [projectId, folderId]);

  const fetchDocuments = async () => {
    try {
      let query = supabase
        .from('document_registry' as any)
        .select(`
          id,
          title,
          description,
          document_type,
          file_name,
          file_path,
          file_size,
          version_number,
          status,
          uploaded_by,
          created_at,
          download_count,
          uploader:users!uploaded_by(name)
        `)
        .eq('project_id', projectId)
        .eq('is_current_version', true)
        .order('created_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const documentsWithNames = (data as any[])?.map((doc: any) => ({
        ...doc,
        uploader_name: doc.uploader?.name || 'Unknown'
      })) || [];

      setDocuments(documentsWithNames);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Track download
      await supabase.rpc('track_document_access' as any, { doc_id: document.id });
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const previewDocument = (document: Document) => {
    // For now, just open in new tab
    const { data } = supabase.storage
      .from('project-documents')
      .getPublicUrl(document.file_path);
    
    window.open(data.publicUrl, '_blank');
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Document Browser
          <Badge variant="outline">
            {filteredDocuments.length} documents
          </Badge>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="superseded">Superseded</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="RAMS">RAMS</SelectItem>
              <SelectItem value="Drawing">Drawing</SelectItem>
              <SelectItem value="Technical_Manual">Technical</SelectItem>
              <SelectItem value="RFI">RFI</SelectItem>
              <SelectItem value="Correspondence">Correspondence</SelectItem>
              <SelectItem value="Health_Safety">Health & Safety</SelectItem>
              <SelectItem value="O_M_Manual">O&M Manual</SelectItem>
              <SelectItem value="Inspection_Checklist">Checklist</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {documents.length === 0 ? 'No documents found in this folder.' : 'No documents match your search criteria.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{document.title}</p>
                      <p className="text-sm text-muted-foreground">{document.file_name}</p>
                      {document.description && (
                        <p className="text-xs text-muted-foreground mt-1">{document.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{document.document_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[document.status as keyof typeof STATUS_COLORS] || 'secondary'}>
                      {document.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{document.version_number}</TableCell>
                  <TableCell>{document.uploader_name}</TableCell>
                  <TableCell>{formatFileSize(document.file_size)}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => previewDocument(document)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadDocument(document)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}