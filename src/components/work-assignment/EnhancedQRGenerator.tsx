import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Printer } from 'lucide-react';

interface QRGeneratorProps {
  plotId: string;
  plotCode: string;
  plotName: string;
  projectId: string;
}

export const EnhancedQRGenerator: React.FC<QRGeneratorProps> = ({
  plotId,
  plotCode,
  plotName,
  projectId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQR();
  }, [plotId, plotCode, plotName, projectId]);

  const generateQR = async () => {
    if (!canvasRef.current) return;

    try {
      // Create QR data with plot information
      const qrData = JSON.stringify({
        plotId,
        plotCode,
        plotName,
        projectId,
        type: 'work_assignment',
        timestamp: new Date().toISOString()
      });

      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `QR_${plotCode}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const printQR = () => {
    if (!canvasRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${plotCode}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              text-align: center; 
              font-family: Arial, sans-serif; 
            }
            .qr-container { 
              border: 2px solid #000; 
              padding: 20px; 
              display: inline-block; 
              margin: 20px;
            }
            .plot-info { 
              margin: 10px 0; 
              font-size: 14px; 
            }
            .plot-code { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="plot-code">${plotCode}</div>
            <div class="plot-info">${plotName}</div>
            <img src="${canvasRef.current.toDataURL()}" alt="QR Code" />
            <div class="plot-info">Scan to log work</div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card className="w-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <QrCode className="h-4 w-4" />
          QR Code - {plotCode}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-center">
          <canvas 
            ref={canvasRef}
            className="border rounded"
          />
        </div>
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">{plotName}</p>
          <div className="flex gap-2 justify-center">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={downloadQR}
              className="gap-1"
            >
              <Download className="h-3 w-3" />
              Download
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={printQR}
              className="gap-1"
            >
              <Printer className="h-3 w-3" />
              Print
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedQRGenerator;