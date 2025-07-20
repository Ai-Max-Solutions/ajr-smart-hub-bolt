import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Camera } from 'lucide-react';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (plotId: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  open,
  onOpenChange,
  onScanSuccess
}) => {
  const handleMockScan = () => {
    // Mock QR scan for demo
    const mockPlotId = 'mock-plot-id';
    onScanSuccess(mockPlotId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Camera view would appear here
              </p>
            </div>
          </div>

          <Button onClick={handleMockScan} className="w-full">
            Simulate QR Scan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};