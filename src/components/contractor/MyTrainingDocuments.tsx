import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Upload,
  Calendar,
  Award,
  RefreshCw,
  Download,
  Bell
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrainingDocument {
  id: string;
  document_type: {
    name: string;
    is_mandatory: boolean;
    description?: string;
    icon_name?: string;
  };
  document_url: string;
  file_name: string;
  expiry_date: string | null;
  issue_date: string | null;
  status: 'active' | 'expired' | 'expiring_soon';
  verified_at: string | null;
  verified_by: string | null;
}

const MyTrainingDocuments = () => {
  const [documents, setDocuments] = useState<TrainingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [compliance, setCompliance] = useState<any>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [renewalAlerts, setRenewalAlerts] = useState<TrainingDocument[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTrainingDocuments();
    }
  }, [user]);

  const loadTrainingDocuments = async () => {
    try {
      setLoading(true);

      // Mock training documents data
      const mockDocs: TrainingDocument[] = [
        {
          id: '1',
          document_url: '/mock-training-doc.pdf',
          file_name: 'Safety Training Certificate',
          document_type: {
            name: 'Safety Training',
            description: 'General site safety training',
            is_mandatory: true
          },
          issue_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          expiry_date: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active' as const,
          verified_at: null,
          verified_by: null
        }
      ];
      setDocuments(mockDocs);

      // Calculate compliance using mock data
      const totalMandatory = mockDocs.filter(doc => doc.document_type?.is_mandatory).length;
      const compliantMandatory = mockDocs.filter(doc => 
        doc.document_type?.is_mandatory && doc.status === 'active'
      ).length;
      
      const compliancePercentage = totalMandatory > 0 ? (compliantMandatory / totalMandatory) * 100 : 100;
      
      setCompliance({
        total_mandatory: totalMandatory,
        compliant: compliantMandatory,
        percentage: compliancePercentage,
        expired: mockDocs.filter(doc => doc.status === 'expired').length,
        expiring_soon: mockDocs.filter(doc => doc.status === 'expiring_soon').length
      });

      // Set renewal alerts for documents expiring in next 60 days
      const alertDocs = mockDocs.filter(doc => {
        if (!doc.expiry_date) return false;
        const daysUntilExpiry = getDaysUntilExpiry(doc.expiry_date);
        return daysUntilExpiry !== null && daysUntilExpiry <= 60 && daysUntilExpiry > 0;
      });
      setRenewalAlerts(alertDocs);

    } catch (error: any) {
      console.error('Error loading training documents:', error);
      toast({
        title: "Error loading training documents",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (document: TrainingDocument) => {
    switch (document.status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid
          </Badge>
        );
      case 'expiring_soon':
        return (
          <Badge variant="secondary" className="contractor-alert">
            <Clock className="h-3 w-3 mr-1" />
            Expiring Soon
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{document.status}</Badge>;
    }
  };

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleFileUpload = async (file: File, documentId?: string) => {
    try {
      setUploading(true);
      
      // Mock contractor profile
      const profileData = { id: '1' };

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileData.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('training-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('training-documents')
        .getPublicUrl(fileName);

      // Update or create document record
      if (documentId) {
        // Mock update for existing document
        console.log('Would update document:', documentId, 'with new file:', file.name);
      }

      toast({
        title: "Document uploaded successfully",
        description: documentId ? "Document has been updated" : "New document has been uploaded",
      });

      loadTrainingDocuments();
      setUploadDialogOpen(false);
      
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getExpiryColor = (document: TrainingDocument) => {
    const daysUntilExpiry = getDaysUntilExpiry(document.expiry_date);
    if (!daysUntilExpiry) return 'text-foreground';
    if (daysUntilExpiry <= 0) return 'text-destructive';
    if (daysUntilExpiry <= 30) return 'text-destructive';
    if (daysUntilExpiry <= 60) return 'text-warning';
    return 'text-success';
  };

  const getExpiryProgress = (document: TrainingDocument) => {
    if (!document.expiry_date || !document.issue_date) return 100;
    
    const issued = new Date(document.issue_date);
    const expires = new Date(document.expiry_date);
    const now = new Date();
    
    const totalDuration = expires.getTime() - issued.getTime();
    const remaining = expires.getTime() - now.getTime();
    
    return Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Renewal Alerts */}
      {renewalAlerts.length > 0 && (
        <Alert className="contractor-alert border-l-4 border-l-warning">
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Renewal Reminders</div>
            <div className="space-y-1">
              {renewalAlerts.map(doc => {
                const days = getDaysUntilExpiry(doc.expiry_date);
                return (
                  <div key={doc.id} className="text-sm">
                    <strong>{doc.document_type?.name}</strong> expires in {days} days
                  </div>
                );
              })}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance</p>
                <p className="text-2xl font-bold contractor-accent-text">
                  {Math.round(compliance?.percentage || 0)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-contractor-accent" />
            </div>
            <Progress 
              value={compliance?.percentage || 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-warning">
                  {compliance?.expiring_soon || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-destructive">
                  {compliance?.expired || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Documents List */}
      <Card className="contractor-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="contractor-accent-text">Training Documents</CardTitle>
              <CardDescription>
                Your uploaded certificates and training records
              </CardDescription>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="contractor-button">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Training Document</DialogTitle>
                  <DialogDescription>
                    Upload a new certificate or training document
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="document-file">Select File</Label>
                    <Input
                      id="document-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No training documents uploaded yet</p>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 contractor-button">
                    Upload Your First Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Training Document</DialogTitle>
                    <DialogDescription>
                      Upload your first certificate or training document
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="document-file-first">Select File</Label>
                      <Input
                        id="document-file-first"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        disabled={uploading}
                      />
                    </div>
                    {uploading && (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const daysUntilExpiry = getDaysUntilExpiry(doc.expiry_date);
                
                return (
                  <div key={doc.id} className="p-4 border rounded-lg space-y-3 contractor-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-contractor-accent" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{doc.document_type?.name}</h4>
                            {doc.document_type?.is_mandatory && (
                              <Badge variant="outline" className="text-xs">
                                Mandatory
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {doc.document_type?.description || 'Certificate'}
                          </p>
                          {doc.expiry_date && (
                            <div className="mt-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground">Valid until</span>
                                <span className={`text-xs font-medium ${getExpiryColor(doc)}`}>
                                  {new Date(doc.expiry_date).toLocaleDateString()}
                                </span>
                              </div>
                              <Progress value={getExpiryProgress(doc)} className="h-1" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {doc.issue_date && (
                        <div>
                          <p className="font-medium text-muted-foreground">Issue Date</p>
                          <p>{new Date(doc.issue_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {doc.expiry_date && (
                        <div>
                          <p className="font-medium text-muted-foreground">Expiry Date</p>
                          <p className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(doc.expiry_date).toLocaleDateString()}
                            {daysUntilExpiry !== null && daysUntilExpiry <= 60 && (
                              <span className={`ml-2 text-xs ${
                                daysUntilExpiry <= 30 ? 'text-destructive' : 'text-warning'
                              }`}>
                                ({daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                       <div>
                        <p className="font-medium text-muted-foreground">File</p>
                        <div className="flex items-center gap-2">
                          <p className="text-contractor-accent hover:underline cursor-pointer">
                            {doc.file_name}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(doc.document_url, '_blank')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      {doc.verified_at ? (
                        <div className="contractor-alert p-2 rounded text-xs">
                          <p>✓ Verified by AJ Ryan on {new Date(doc.verified_at).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Pending verification
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="contractor-button-outline">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Re-upload
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Re-upload {doc.document_type?.name}</DialogTitle>
                              <DialogDescription>
                                Upload a new version of this document
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor={`reupload-${doc.id}`}>Select New File</Label>
                                <Input
                                  id={`reupload-${doc.id}`}
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, doc.id);
                                  }}
                                  disabled={uploading}
                                />
                              </div>
                              {uploading && (
                                <div className="flex items-center space-x-2">
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>Uploading...</span>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyTrainingDocuments;