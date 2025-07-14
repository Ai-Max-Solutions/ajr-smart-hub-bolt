import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CameraIcon, FileImage, Trash2, Share, Download } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { toast } from 'sonner';
import { AJIcon } from '@/components/ui/aj-icon';

interface ScannedDocument {
  id: string;
  image: string;
  timestamp: Date;
  name: string;
  type: 'rams' | 'drawing' | 'certificate' | 'other';
}

interface DocumentScannerProps {
  onDocumentScanned?: (document: ScannedDocument) => void;
}

export function DocumentScanner({ onDocumentScanned }: DocumentScannerProps) {
  const [scannedDocs, setScannedDocs] = useState<ScannedDocument[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ScannedDocument | null>(null);
  const { canUseCamera, isNative, triggerHaptics } = useMobile();

  const scanDocument = async () => {
    if (!canUseCamera) {
      toast.error('Camera not available on this device');
      return;
    }

    setIsScanning(true);
    await triggerHaptics();

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        const newDoc: ScannedDocument = {
          id: Date.now().toString(),
          image: image.dataUrl,
          timestamp: new Date(),
          name: `Document ${scannedDocs.length + 1}`,
          type: 'other'
        };

        setScannedDocs(prev => [newDoc, ...prev]);
        onDocumentScanned?.(newDoc);
        toast.success('Document scanned successfully!');
        await triggerHaptics();
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to capture document');
    } finally {
      setIsScanning(false);
    }
  };

  const selectFromGallery = async () => {
    if (!canUseCamera) {
      toast.error('Gallery not available on this device');
      return;
    }

    await triggerHaptics();

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        const newDoc: ScannedDocument = {
          id: Date.now().toString(),
          image: image.dataUrl,
          timestamp: new Date(),
          name: `Document ${scannedDocs.length + 1}`,
          type: 'other'
        };

        setScannedDocs(prev => [newDoc, ...prev]);
        onDocumentScanned?.(newDoc);
        toast.success('Document added from gallery!');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      toast.error('Failed to select from gallery');
    }
  };

  const deleteDocument = async (id: string) => {
    setScannedDocs(prev => prev.filter(doc => doc.id !== id));
    setSelectedDoc(null);
    await triggerHaptics();
    toast.success('Document deleted');
  };

  const shareDocument = async (doc: ScannedDocument) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc.name,
          text: `Scanned document: ${doc.name}`,
          url: doc.image
        });
        await triggerHaptics();
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      toast.info('Sharing not supported on this device');
    }
  };

  const downloadDocument = (doc: ScannedDocument) => {
    const link = document.createElement('a');
    link.download = `${doc.name}.jpg`;
    link.href = doc.image;
    link.click();
    triggerHaptics();
    toast.success('Document downloaded');
  };

  if (!isNative && !canUseCamera) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="text-center py-8">
          <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Not Available</h3>
          <p className="text-muted-foreground">
            Document scanning requires a mobile device with camera access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-poppins">
            <AJIcon icon={CameraIcon} variant="navy" size="sm" hover={false} />
            Document Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={scanDocument}
              disabled={isScanning}
              size="lg"
              className="h-16 font-poppins"
            >
              <AJIcon icon={CameraIcon} variant="white" size="lg" hover={false} />
              <div className="ml-3 text-left">
                <div className="font-semibold">Scan Document</div>
                <div className="text-sm opacity-90">Take new photo</div>
              </div>
            </Button>
            
            <Button
              onClick={selectFromGallery}
              disabled={isScanning}
              variant="outline"
              size="lg"
              className="h-16 font-poppins"
            >
              <AJIcon icon={FileImage} variant="yellow" size="lg" hover={false} />
              <div className="ml-3 text-left">
                <div className="font-semibold">From Gallery</div>
                <div className="text-sm opacity-70">Select existing photo</div>
              </div>
            </Button>
          </div>

          {isScanning && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Opening camera...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scanned Documents */}
      {scannedDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-poppins">
              <span>Scanned Documents</span>
              <Badge variant="secondary">{scannedDocs.length} documents</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {scannedDocs.map((doc) => (
                <Dialog key={doc.id}>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer group">
                      <div className="relative overflow-hidden rounded-lg border bg-muted hover:bg-muted/80 transition-colors">
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="font-medium truncate">{doc.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {doc.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle className="font-poppins">{doc.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <img
                        src={doc.image}
                        alt={doc.name}
                        className="w-full max-h-[60vh] object-contain rounded-lg border"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareDocument(doc)}
                          className="font-poppins"
                        >
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocument(doc)}
                          className="font-poppins"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteDocument(doc.id)}
                          className="font-poppins"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}