import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, FileText, Upload, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RAMSDocumentsCRUDProps {
  searchQuery: string;
  isOffline: boolean;
}

interface RAMSDocument {
  id: string;
  document_id: string;
  title: string;
  version_number: string;
  file_url: string;
  file_size: number;
  document_type: string;
  project_id: string;
  level_id: string;
  plot_id: string;
  read_required: boolean;
  tags: string[];
  mime_type: string;
  uploaded_by: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const RAMSDocumentsCRUD = ({ searchQuery, isOffline }: RAMSDocumentsCRUDProps) => {
  const [documents, setDocuments] = useState<RAMSDocument[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDocument, setEditingDocument] = useState<RAMSDocument | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    document_type: "RAMS",
    project_id: "",
    level_id: "",
    plot_id: "",
    read_required: false,
    tags: [] as string[],
    file: null as File | null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Mock RAMS documents data since table doesn't exist
      const mockRAMSDocuments: RAMSDocument[] = [
        {
          id: '1',
          document_id: 'RAMS-001',
          title: 'High Voltage Safety Procedures',
          version_number: '2.1',
          file_url: '/mock/rams-hv-001.pdf',
          document_type: 'RAMS',
          project_id: '',
          level_id: '',
          plot_id: '',
          read_required: true,
          tags: ['high-voltage', 'safety', 'electrical'],
          file_size: 2048000,
          mime_type: 'application/pdf',
          uploaded_by: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          document_id: 'RAMS-002',
          title: 'Working at Height Guidelines',
          version_number: '1.3',
          file_url: '/mock/rams-height-002.pdf',
          document_type: 'RAMS',
          project_id: '',
          level_id: '',
          plot_id: '',
          read_required: true,
          tags: ['height', 'safety', 'construction'],
          file_size: 1536000,
          mime_type: 'application/pdf',
          uploaded_by: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const [projectsRes, usersRes] = await Promise.all([
        supabase.from('projects').select('id, name'),
        supabase.from('users').select('id, name')
      ]);

      // Transform projects data
      const transformedProjects = (projectsRes.data || []).map(project => ({
        id: project.id,
        projectname: project.name
      }));

      // Transform users data
      const transformedUsers = (usersRes.data || []).map(user => ({
        id: user.id,
        fullname: user.name,
        role: 'Admin'
      }));

      setDocuments(mockRAMSDocuments);
      setProjects(transformedProjects);
      setUsers(transformedUsers);
    } catch (error) {
      if (!isOffline) {
        toast.error("Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let fileUrl = editingDocument?.file_url || "/mock/uploaded-file.pdf";
      let fileSize = editingDocument?.file_size || 0;

      if (formData.file) {
        // Mock file upload
        fileUrl = `/mock/${formData.file.name}`;
        fileSize = formData.file.size;
      }

      if (editingDocument) {
        // Mock update
        const updatedDocument: RAMSDocument = {
          ...editingDocument,
          title: formData.title,
          document_type: formData.document_type,
          project_id: formData.project_id || '',
          level_id: formData.level_id || '',
          plot_id: formData.plot_id || '',
          read_required: formData.read_required,
          tags: formData.tags,
          file_url: fileUrl,
          file_size: fileSize,
          mime_type: formData.file?.type || 'application/pdf',
          updated_at: new Date().toISOString()
        };
        
        setDocuments(documents.map(doc => 
          doc.id === editingDocument.id ? updatedDocument : doc
        ));
        toast.success("Document updated successfully (mock data)");
      } else {
        // Mock create
        const newDocument: RAMSDocument = {
          id: Date.now().toString(),
          document_id: `DOC-${Date.now()}`,
          title: formData.title,
          version_number: '1.0',
          document_type: formData.document_type,
          project_id: formData.project_id || '',
          level_id: formData.level_id || '',
          plot_id: formData.plot_id || '',
          read_required: formData.read_required,
          tags: formData.tags,
          file_url: fileUrl,
          file_size: fileSize,
          mime_type: formData.file?.type || 'application/pdf',
          uploaded_by: 'current_user',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setDocuments([newDocument, ...documents]);
        toast.success("Document uploaded successfully (mock data)");
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save document");
    } finally {
      setIsUploading(false);
    }
  };

  const getCurrentUserId = async () => {
    // Mock function for getting current user ID
    return 'current_user_id';
  };

  const handleSupersede = async (documentId: string) => {
    if (!confirm("This will mark the document as superseded. Continue?")) return;

    try {
      // Mock supersede operation
      setDocuments(documents.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'superseded', updated_at: new Date().toISOString() }
          : doc
      ));
      toast.success("Document superseded successfully (mock data)");
    } catch (error: any) {
      toast.error(error.message || "Failed to supersede document");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      document_type: "RAMS",
      project_id: "",
      level_id: "",
      plot_id: "",
      read_required: false,
      tags: [],
      file: null
    });
    setEditingDocument(null);
  };

  const openEditDialog = (document: RAMSDocument) => {
    setEditingDocument(document);
    setFormData({
      title: document.title || "",
      document_type: document.document_type || "RAMS",
      project_id: "",
      level_id: "",
      plot_id: "",
      read_required: document.read_required || false,
      tags: document.tags || [],
      file: null
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'active': 'default',
      'superseded': 'secondary',
      'archived': 'destructive'
    };
    return <Badge variant={(statusColors[status as keyof typeof statusColors] || 'secondary') as "default" | "secondary" | "destructive" | "outline"}>{status}</Badge>;
  };

  const getDocumentTypeBadge = (type: string) => {
    const typeColors = {
      'RAMS': 'default',
      'Task Plan': 'secondary',
      'Drawing': 'default',
      'Certificate': 'secondary'
    };
    return <Badge variant={(typeColors[type as keyof typeof typeColors] || 'secondary') as "default" | "secondary" | "destructive" | "outline"}>{type}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.document_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <div className="flex justify-center py-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{documents.filter(d => d.status === 'active').length}</div>
            <div className="text-sm text-muted-foreground">Active Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{documents.filter(d => d.document_type === 'RAMS').length}</div>
            <div className="text-sm text-muted-foreground">RAMS</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{documents.filter(d => d.read_required).length}</div>
            <div className="text-sm text-muted-foreground">Read Required</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-muted-foreground">
              {formatFileSize(documents.reduce((sum, d) => sum + (d.file_size || 0), 0))}
            </div>
            <div className="text-sm text-muted-foreground">Total Size</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>RAMS & Documents ({filteredDocuments.length})</span>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} size="lg" className="h-12">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingDocument ? "Edit Document" : "Upload New Document"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Electrical RAMS - Ground Floor"
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document_type">Document Type</Label>
                      <Select value={formData.document_type} onValueChange={(value) => setFormData({ ...formData, document_type: value })}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RAMS">RAMS</SelectItem>
                          <SelectItem value="Task Plan">Task Plan</SelectItem>
                          <SelectItem value="Drawing">Drawing</SelectItem>
                          <SelectItem value="Certificate">Certificate</SelectItem>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project_id">Project</Label>
                      <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.projectname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {!editingDocument && (
                    <div className="space-y-2">
                      <Label htmlFor="file">File Upload *</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                        required
                        className="h-12"
                      />
                      <p className="text-xs text-muted-foreground">
                        Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      })}
                      placeholder="electrical, first-fix, level-1"
                      className="h-12"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="read_required"
                      checked={formData.read_required}
                      onChange={(e) => setFormData({ ...formData, read_required: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="read_required" className="text-sm">
                      Reading required - notify operatives when uploaded
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 h-12" disabled={isUploading}>
                      {isUploading ? "Uploading..." : editingDocument ? "Update Document" : "Upload Document"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">{doc.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {doc.document_id} • {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getDocumentTypeBadge(doc.document_type)}</TableCell>
                    <TableCell>v{doc.version_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.status)}
                        {doc.read_required && (
                          <Badge variant="outline" className="text-xs">
                            📖 Read Req.
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.file_size || 0)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {doc.tags?.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{doc.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.file_url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(doc)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSupersede(doc.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredDocuments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No documents match your search" : "No documents found"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
