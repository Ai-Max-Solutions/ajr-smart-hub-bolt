import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  QrCode,
  Download,
  Eye,
  Plus,
  ArrowRight,
  Hash
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEvidenceChain } from '@/hooks/useEvidenceChain';

interface DocumentVersion {
  id: string;
  document_id: string;
  document_type: string;
  title: string;
  version_number: number;
  revision_code?: string;
  status: 'draft' | 'approved' | 'superseded' | 'archived';
  file_url?: string;
  qr_code_url?: string;
  watermark_applied: boolean;
  read_required: boolean;
  tags: string[];
  ai_suggested_tags: string[];
  scope_plots: string[];
  scope_levels: string[];
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
  approved_by?: string;
}

interface SmartRevisionAlert {
  id: string;
  document_version_id: string;
  alert_type: 'superseded' | 'expiring' | 'unsigned' | 'missing';
  target_users: string[];
  alert_message: string;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  notification_sent: boolean;
  ai_generated: boolean;
  created_at: string;
}

interface SmartRevisionManagerProps {
  projectId: string;
}

const SmartRevisionManager: React.FC<SmartRevisionManagerProps> = ({ projectId }) => {
  const [documents, setDocuments] = useState<DocumentVersion[]>([]);
  const [alerts, setAlerts] = useState<SmartRevisionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<string>('RAMS');
  const [uploadVersion, setUploadVersion] = useState('1.0');
  const [uploadRevision, setUploadRevision] = useState('A');
  const [uploadReadRequired, setUploadReadRequired] = useState(true);
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const { logEvidenceEvent, getDeviceInfo } = useEvidenceChain();

  useEffect(() => {
    fetchDocuments();
    fetchAlerts();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data as DocumentVersion[] || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load document versions",
        variant: "destructive",
      });
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_revision_alerts')
        .select('*')
        .eq('resolved_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data as SmartRevisionAlert[] || []);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide a file and title",
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(true);
    try {
      // Upload file to storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}_${uploadTitle.replace(/\s+/g, '_')}.${fileExt}`;
      const filePath = `documents/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document version record
      const documentId = crypto.randomUUID();
      const { data: newDocument, error: docError } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          project_id: projectId,
          document_type: uploadType,
          title: uploadTitle,
          version_number: parseFloat(uploadVersion),
          revision_code: uploadRevision,
          file_url: publicUrl,
          file_size: uploadFile.size,
          mime_type: uploadFile.type,
          status: 'approved', // Auto-approve for PM uploads
          approval_date: new Date().toISOString(),
          read_required: uploadReadRequired,
          tags: uploadTags.split(',').map(tag => tag.trim()).filter(Boolean),
          watermark_applied: false
        })
        .select()
        .single();

      if (docError) throw docError;

      // Log evidence chain event
      await logEvidenceEvent({
        projectId,
        operativeId: 'current-user', // Would get from auth context
        documentId,
        documentType: uploadType as any,
        documentVersion: uploadVersion,
        documentRevision: uploadRevision,
        actionType: 'upload',
        deviceInfo: getDeviceInfo(),
        metadata: {
          title: uploadTitle,
          fileSize: uploadFile.size,
          mimeType: uploadFile.type
        }
      });

      // Check for and supersede older versions
      await checkAndSupersedeOlderVersions(documentId, newDocument);

      toast({
        title: "Document Uploaded",
        description: `${uploadTitle} v${uploadVersion} has been uploaded successfully`,
      });

      // Reset form and refresh data
      setShowUploadDialog(false);
      resetUploadForm();
      fetchDocuments();
      fetchAlerts();

    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const checkAndSupersedeOlderVersions = async (documentId: string, newDocument: any) => {
    try {
      // Find older versions of the same document type with same title
      const { data: olderVersions, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('title', newDocument.title)
        .eq('document_type', newDocument.document_type)
        .eq('project_id', projectId)
        .eq('status', 'approved')
        .neq('id', newDocument.id);

      if (error) throw error;

      // Supersede older versions
      for (const oldVersion of olderVersions || []) {
        await supabase.rpc('supersede_document_version', {
          p_old_version_id: oldVersion.id,
          p_new_version_id: newDocument.id,
          p_superseded_by: 'current-user' // Would get from auth context
        });
      }

    } catch (error) {
      console.error('Error superseding older versions:', error);
    }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadType('RAMS');
    setUploadVersion('1.0');
    setUploadRevision('A');
    setUploadReadRequired(true);
    setUploadTags('');
    setUploadFile(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Current</Badge>;
      case 'superseded':
        return <Badge variant="destructive">Superseded</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAlertBadge = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const stats = {
    totalDocuments: documents.length,
    currentDocuments: documents.filter(d => d.status === 'approved').length,
    supersededDocuments: documents.filter(d => d.status === 'superseded').length,
    pendingAlerts: alerts.filter(a => !a.notification_sent).length,
    criticalAlerts: alerts.filter(a => a.urgency_level === 'critical').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Smart Revision Manager</h2>
          <p className="text-muted-foreground">AI-powered document version control and compliance tracking</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#1d1e3d] hover:bg-[#2a2b4a]">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Document Version</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Document Title</Label>
                  <Input
                    id="title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Enter document title"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Document Type</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RAMS">RAMS</SelectItem>
                      <SelectItem value="Task_Plan">Task Plan</SelectItem>
                      <SelectItem value="Drawing">Drawing</SelectItem>
                      <SelectItem value="Site_Notice">Site Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <Label htmlFor="revision">Revision</Label>
                  <Input
                    id="revision"
                    value={uploadRevision}
                    onChange={(e) => setUploadRevision(e.target.value)}
                    placeholder="A"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="safety, electrical, plumbing"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="read-required"
                  checked={uploadReadRequired}
                  onCheckedChange={setUploadReadRequired}
                />
                <Label htmlFor="read-required">Read Required (generates notifications)</Label>
              </div>

              <div>
                <Label htmlFor="file">Document File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx"
                />
              </div>

              <Button 
                onClick={handleFileUpload} 
                disabled={uploadingFile}
                className="w-full"
              >
                {uploadingFile ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.totalDocuments}</div>
            <div className="text-sm text-muted-foreground">Total Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.currentDocuments}</div>
            <div className="text-sm text-muted-foreground">Current Versions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.supersededDocuments}</div>
            <div className="text-sm text-muted-foreground">Superseded</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.pendingAlerts}</div>
            <div className="text-sm text-muted-foreground">Pending Alerts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</div>
            <div className="text-sm text-muted-foreground">Critical Issues</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Document Versions</TabsTrigger>
          <TabsTrigger value="alerts">Smart Alerts</TabsTrigger>
          <TabsTrigger value="qr-posters">QR Posters</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Versions ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No documents uploaded yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Upload your first RAMS or Task Plan to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">{doc.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {doc.document_type} • Version {doc.version_number}
                              {doc.revision_code && ` Rev ${doc.revision_code}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.status)}
                          {doc.read_required && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Read Required
                            </Badge>
                          )}
                          {doc.watermark_applied && (
                            <Badge variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              Watermarked
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {doc.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Smart Revision Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No active alerts - all documents are compliant!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <div>
                            <div className="font-medium">{alert.alert_message}</div>
                            <div className="text-sm text-muted-foreground">
                              {alert.alert_type.toUpperCase()} • {alert.target_users.length} user(s) affected
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getAlertBadge(alert.urgency_level)}
                          {alert.ai_generated && (
                            <Badge variant="outline" className="text-xs">AI Generated</Badge>
                          )}
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr-posters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Poster Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">QR poster generation and management coming soon...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate QR codes for site posters that validate document versions in real-time.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartRevisionManager;