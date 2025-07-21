import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Search, 
  Upload,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DocumentUpload } from './DocumentUpload';

interface DocumentInfo {
  id: string;
  title: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  uploader_name?: string;
  tags: string[];
  ai_summary?: string;
  download_count: number;
}

interface DocumentListProps {
  projectId: string;
  folderId?: string | null;
  onDocumentSelect?: (documentId: string) => void;
}

export function DocumentList({ projectId, folderId, onDocumentSelect }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [projectId, folderId]);

  const fetchDocuments = async () => {
    try {
      // Using raw query since types aren't generated yet
      let query = supabase
        .from('document_registry' as any)
        .select(`
          *,
          uploader:uploaded_by(name)
        `)
        .eq('project_id', projectId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const documentsWithUploader = (data || []).map((doc: any) => ({
        ...doc,
        uploader_name: doc.uploader?.name || 'Unknown User'
      }));

      setDocuments(documentsWithUploader);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (document: DocumentInfo) => {
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
      a.click();
      URL.revokeObjectURL(url);

      // Update download count
      await supabase
        .from('document_registry' as any)
        .update({ 
          download_count: document.download_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', document.id);

      toast.success('Document downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'PDF': 'bg-red-100 text-red-800',
      'Document': 'bg-blue-100 text-blue-800',
      'Image': 'bg-green-100 text-green-800',
      'Spreadsheet': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.Other;
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (showUpload) {
    return (
        <DocumentUpload
          projectId={projectId}
          folderId={folderId}
          onUploadComplete={() => {
            setShowUpload(false);
            fetchDocuments();
          }}
          onClose={() => setShowUpload(false)}
        />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? `No documents match "${searchTerm}"`
                : folderId 
                  ? 'This folder is empty'
                  : 'No documents uploaded yet'
              }
            </p>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-medium truncate">{document.title}</h3>
                      <Badge className={getTypeColor(document.document_type)}>
                        {document.document_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{document.uploader_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(document.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      <span>{formatFileSize(document.file_size)}</span>
                      <span>{document.download_count} downloads</span>
                    </div>

                    {document.ai_summary && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {document.ai_summary}
                      </p>
                    )}

                    {document.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {document.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDocumentSelect?.(document.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}