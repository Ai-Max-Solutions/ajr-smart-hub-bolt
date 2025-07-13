import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AsiteApiService, AsiteDocument } from '@/lib/asite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Download, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentStatusInfo {
  documentNumber: string;
  revision: string;
  status: 'Current' | 'Superseded' | 'Not Found';
  title?: string;
  projectName?: string;
  dateIssued?: string;
  supersededBy?: string;
  currentVersion?: AsiteDocument;
}

export default function DocumentStatusChecker() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatusInfo | null>(null);

  useEffect(() => {
    if (docId) {
      checkDocumentStatus(docId);
    }
  }, [docId]);

  const checkDocumentStatus = async (documentId: string) => {
    try {
      setLoading(true);
      
      // Parse document ID (format: A1-101-RevC)
      const parts = documentId.split('-');
      if (parts.length < 3) {
        throw new Error('Invalid document ID format');
      }

      const documentNumber = parts.slice(0, -1).join('-');
      const revision = parts[parts.length - 1];

      // Check document status in Asite
      // For now, we'll simulate the check - in real implementation this would query Asite
      const documents = await AsiteApiService.getDocuments('project-1', {
        currentOnly: false
      });

      const matchingDoc = documents.find(doc => 
        doc.drawingNumber === documentNumber && doc.version === revision
      );

      const currentDoc = documents
        .filter(doc => doc.drawingNumber === documentNumber)
        .sort((a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime())[0];

      let status: 'Current' | 'Superseded' | 'Not Found';
      if (!matchingDoc) {
        status = 'Not Found';
      } else if (currentDoc && currentDoc.asiteDocId === matchingDoc.asiteDocId) {
        status = 'Current';
      } else {
        status = 'Superseded';
      }

      setDocumentStatus({
        documentNumber,
        revision,
        status,
        title: matchingDoc?.title || 'Unknown Document',
        projectName: 'SmartWork Hub Project', // Use generic project name
        dateIssued: matchingDoc ? new Date(matchingDoc.uploadedDate).toLocaleDateString() : undefined,
        supersededBy: status === 'Superseded' ? currentDoc?.version : undefined,
        currentVersion: status === 'Superseded' ? currentDoc : undefined,
      });

      // Log the QR scan for audit
      console.log('QR Code scanned:', {
        documentId,
        timestamp: new Date().toISOString(),
        status,
        userAgent: navigator.userAgent
      });

    } catch (error) {
      console.error('Error checking document status:', error);
      toast.error('Failed to check document status');
      setDocumentStatus({
        documentNumber: 'Unknown',
        revision: 'Unknown',
        status: 'Not Found'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCurrent = async () => {
    if (!documentStatus?.currentVersion) return;

    try {
      const signedUrl = await AsiteApiService.getSignedUrl(
        documentStatus.currentVersion.asiteDocId,
        'user-123' // Would come from auth context
      );
      window.open(signedUrl, '_blank');
      toast.success('Opening latest version');
    } catch (error) {
      toast.error('Failed to download latest version');
    }
  };

  const handleViewInApp = () => {
    if (documentStatus?.currentVersion) {
      navigate(`/projects/project-1/documents?doc=${documentStatus.currentVersion.asiteDocId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Checking document status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!documentStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
            <p className="text-muted-foreground">The requested document could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (documentStatus.status) {
      case 'Current':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'Superseded':
        return <AlertTriangle className="h-8 w-8 text-orange-500" />;
      case 'Not Found':
        return <XCircle className="h-8 w-8 text-destructive" />;
    }
  };

  const getStatusBadge = () => {
    switch (documentStatus.status) {
      case 'Current':
        return <Badge className="bg-green-100 text-green-800">✅ Current</Badge>;
      case 'Superseded':
        return <Badge variant="destructive">❌ Superseded</Badge>;
      case 'Not Found':
        return <Badge variant="outline">❓ Not Found</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            AJ Ryan SmartWork Hub
          </h1>
          <p className="text-muted-foreground">Document Status Verification</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-xl">
              {documentStatus.documentNumber} {documentStatus.revision}
            </CardTitle>
            <div className="flex justify-center">
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentStatus.title && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Title</h3>
                <p>{documentStatus.title}</p>
              </div>
            )}

            {documentStatus.projectName && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Project</h3>
                <p>{documentStatus.projectName}</p>
              </div>
            )}

            {documentStatus.dateIssued && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Date Issued</h3>
                <p>{new Date(documentStatus.dateIssued).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status-specific content */}
        {documentStatus.status === 'Current' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This document is current and approved for use.
            </AlertDescription>
          </Alert>
        )}

        {documentStatus.status === 'Superseded' && (
          <>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This document has been superseded and should not be used for construction.
                {documentStatus.supersededBy && (
                  <span className="block mt-2">
                    Latest version: {documentStatus.supersededBy}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {documentStatus.currentVersion && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Latest Version Available</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{documentStatus.currentVersion.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {documentStatus.currentVersion.version} - {new Date(documentStatus.currentVersion.uploadedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Current</Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleDownloadCurrent} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Latest
                    </Button>
                    <Button variant="outline" onClick={handleViewInApp} className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View in App
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {documentStatus.status === 'Not Found' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              This document was not found in the system. Please verify the QR code or contact your supervisor.
            </AlertDescription>
          </Alert>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8">
          <p>Scanned on {new Date().toLocaleString()}</p>
          <p className="mt-2">
            Questions? Contact your site supervisor or visit the SmartWork Hub.
          </p>
        </div>
      </div>
    </div>
  );
}