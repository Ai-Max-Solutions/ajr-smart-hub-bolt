import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Eye, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  QrCode
} from 'lucide-react';
import { AsiteDocument, AsiteApiService, DocumentViewerService } from '@/lib/asite';

interface AsiteDocumentViewerProps {
  document: AsiteDocument;
  userId: string;
  userName: string;
  onReadConfirmed?: (documentId: string) => void;
}

const AsiteDocumentViewer = ({ document, userId, userName, onReadConfirmed }: AsiteDocumentViewerProps) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const [hasRead, setHasRead] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    checkReadStatus();
  }, [document.asiteDocId, userId]);

  const checkReadStatus = async () => {
    try {
      const readReceipts = await AsiteApiService.getReadStatus(document.asiteDocId);
      const userReceipt = readReceipts.find(r => r.userId === userId && r.version === document.version);
      setHasRead(!!userReceipt);
    } catch (error) {
      console.error('Error checking read status:', error);
    }
  };

  const handleView = async () => {
    setIsLoading(true);
    try {
      const signedUrl = await AsiteApiService.getSignedUrl(document.asiteDocId, userId);
      const viewerUrl = DocumentViewerService.getViewerUrl(signedUrl, document.title);
      setViewerUrl(viewerUrl);
      setIsViewerOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load document",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const signedUrl = await AsiteApiService.getSignedUrl(document.asiteDocId, userId);
      
      // Fetch the original PDF
      const response = await fetch(signedUrl);
      const pdfBytes = await response.arrayBuffer();
      
      // Prepare document info for watermarking
      const docInfo = {
        projectName: 'SmartWork Hub Project',
        documentNumber: document.drawingNumber,
        title: document.title,
        revision: document.version,
        status: document.approvalStatus === 'approved_for_construction' ? 'Current' as const : 'Superseded' as const,
        dateIssued: new Date(document.uploadedDate).toLocaleDateString(),
        asiteDocId: document.asiteDocId
      };
      
      // Add watermark and QR code
      const { PDFWatermarkService } = await import('@/lib/pdfWatermark');
      const watermarkedPdf = await PDFWatermarkService.addWatermarkToPDF(pdfBytes, docInfo);
      
      // Download watermarked PDF
      const filename = `${document.drawingNumber}-${document.version}.pdf`;
      PDFWatermarkService.downloadWatermarkedPDF(watermarkedPdf, filename);
      
      toast({
        title: "Download Started",
        description: `Watermarked ${document.drawingNumber} is downloading...`
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download document",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await AsiteApiService.markAsRead(document.asiteDocId, userId, userName);
      setHasRead(true);
      onReadConfirmed?.(document.asiteDocId);
      
      toast({
        title: "Confirmed",
        description: `You have confirmed reading ${document.drawingNumber}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm read status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = () => {
    switch (document.approvalStatus) {
      case 'approved_for_construction':
        return <Badge className="bg-success text-success-foreground">✅ Current</Badge>;
      case 'superseded':
        return <Badge variant="destructive">❌ Superseded</Badge>;
      case 'draft':
        return <Badge variant="secondary">📝 Draft</Badge>;
      default:
        return <Badge className="bg-warning text-warning-foreground">🕒 Pending</Badge>;
    }
  };

  const getReadStatusBadge = () => {
    if (!document.readRequired) return null;
    
    return hasRead ? (
      <Badge className="bg-success text-success-foreground">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Read ✓
      </Badge>
    ) : (
      <Badge className="bg-warning text-warning-foreground">
        <Clock className="w-3 h-3 mr-1" />
        Read Required
      </Badge>
    );
  };

  const isViewableInline = DocumentViewerService.isViewableInline(document.title);

  return (
    <>
      <Card className="card-hover">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Document Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold">{document.drawingNumber}</h3>
                    {getStatusBadge()}
                    {getReadStatusBadge()}
                  </div>
                  
                  <p className="text-sm font-medium mb-1">{document.title}</p>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Version:</span> {document.version} 
                      <span className="mx-2">•</span> 
                      <span className="font-medium">Size:</span> {document.fileSize}
                    </div>
                    <div>
                      <span className="font-medium">Source:</span> Asite 
                      <span className="mx-2">•</span>
                      <span className="font-medium">Last Synced:</span> {document.lastSyncedAt.toLocaleDateString()}
                    </div>
                    {document.changeLog && (
                      <div className="text-xs bg-muted p-2 rounded">
                        <span className="font-medium">Changes:</span> {document.changeLog}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Plot/Level Links */}
            <div>
              <div className="space-y-2">
                {document.levelsLinked.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Levels</p>
                    <div className="flex flex-wrap gap-1">
                      {document.levelsLinked.map(level => (
                        <Badge key={level} variant="outline" className="text-xs">
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {document.plotsLinked.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Plots</p>
                    <div className="flex flex-wrap gap-1">
                      {document.plotsLinked.map(plot => (
                        <Badge key={plot} variant="outline" className="text-xs">
                          {plot}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleView}
                disabled={isLoading || document.approvalStatus !== 'approved_for_construction'}
              >
                <Eye className="w-4 h-4 mr-1" />
                {isLoading ? 'Loading...' : 'View'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                disabled={isLoading || document.approvalStatus !== 'approved_for_construction'}
              >
                <Download className="w-4 h-4 mr-1" />
                {isLoading ? 'Processing...' : 'Download'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const qrUrl = `${window.location.origin}/check/${document.drawingNumber}-${document.version}`;
                  navigator.clipboard.writeText(qrUrl);
                  toast({
                    title: "QR Check URL Copied",
                    description: "Share this URL to verify document status"
                  });
                }}
              >
                <QrCode className="w-4 h-4 mr-1" />
                QR Check
              </Button>
              
              {document.readRequired && !hasRead && (
                <Button 
                  className="btn-primary" 
                  size="sm" 
                  onClick={handleMarkAsRead}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Confirm Read
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-7xl h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>{document.drawingNumber} - {document.version}</span>
                {getStatusBadge()}
              </DialogTitle>
              
              <div className="flex items-center space-x-2">
                {isViewableInline && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">{zoom}%</span>
                    <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                
                {document.readRequired && !hasRead && (
                  <Button className="btn-primary" size="sm" onClick={handleMarkAsRead}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Confirm Read
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden rounded-lg border">
            {isViewableInline ? (
              <iframe
                src={viewerUrl}
                className="w-full h-full"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                title={`${document.drawingNumber} - ${document.title}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <div className="text-center space-y-4">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Preview not available</p>
                    <p className="text-muted-foreground">Click download to view this document</p>
                  </div>
                  <Button onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Document
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AsiteDocumentViewer;