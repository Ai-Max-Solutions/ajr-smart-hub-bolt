import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowLeft, PenTool, Clock, CheckCircle } from 'lucide-react';
import SignaturePad from 'react-signature-canvas';

interface RAMSViewerProps {
  document: {
    id: string;
    title: string;
    version: string;
  };
  onBack: () => void;
  onSigned: (signature: string) => void;
  isAlreadySigned: boolean;
}

const RAMSViewer = ({ document, onBack, onSigned, isAlreadySigned }: RAMSViewerProps) => {
  const [hasRead, setHasRead] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const signaturePadRef = useRef<SignaturePad>(null);

  const startReading = () => {
    setIsReading(true);
    const timer = setInterval(() => {
      setReadingTime(prev => prev + 1);
    }, 1000);

    // Auto-enable signing after 30 seconds (minimum read time)
    setTimeout(() => {
      clearInterval(timer);
      setIsReading(false);
    }, 30000);

    return () => clearInterval(timer);
  };

  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSign = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signature = signaturePadRef.current.toDataURL();
      onSigned(signature);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock document content
  const documentContent = `
    HIGH VOLTAGE MAINTENANCE PLAN
    
    RISK ASSESSMENT AND METHOD STATEMENT
    
    Reference: ${document.id}
    Version: ${document.version}
    Effective Date: Jan 15, 2024
    
    VERY HIGH RISK ACTIVITY
    This document requires careful review
    
    SCOPE OF WORK
    This document covers the safety procedures for high voltage electrical maintenance work including:
    - Isolation procedures
    - Testing protocols
    - Personal protective equipment requirements
    - Emergency procedures
    
    HAZARDS IDENTIFIED
    • Electric shock/electrocution
    • Arc flash/blast
    • Burns from hot surfaces
    • Falls from height
    • Manual handling injuries
    
    CONTROL MEASURES
    1. All work must be carried out by competent persons
    2. Proper isolation and lock-out procedures must be followed
    3. Appropriate PPE must be worn at all times
    4. Work area must be secured and signed
    5. Emergency procedures must be understood by all personnel
    
    PERSONAL PROTECTIVE EQUIPMENT
    • Safety helmet with chin strap
    • Arc flash rated clothing
    • Insulated gloves (tested)
    • Safety boots
    • Eye protection
    
    EMERGENCY PROCEDURES
    In the event of an emergency:
    1. Isolate power if safe to do so
    2. Call emergency services (999)
    3. Administer first aid if trained
    4. Report incident immediately
    
    TRAINING REQUIREMENTS
    All personnel must be:
    • Qualified electricians
    • Trained in high voltage procedures
    • Current first aid certificate
    • Emergency rescue trained
    
    REVIEW
    This document is reviewed annually and updated as required.
    
    By signing this document, you confirm that you have read, understood, and will comply with all safety procedures outlined above.
  `;

  return (
    <Card className="card-hover">
      <CardHeader className="border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <CardTitle className="text-primary">{document.title}</CardTitle>
            <CardDescription>Version {document.version} • Required for site access</CardDescription>
          </div>
          {isAlreadySigned && (
            <div className="ml-auto">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Signed</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Safety Warning */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Very High Risk Activity</h3>
              <p className="text-sm text-destructive/80 mt-1">
                This document requires careful review. Minimum review time: 5 minutes
              </p>
            </div>
          </div>
        </div>

        {/* Reading Timer */}
        {(isReading || readingTime > 0) && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">
                Reading time: {formatTime(readingTime)}
                {readingTime < 30 && " (minimum 30 seconds required)"}
              </span>
            </div>
          </div>
        )}

        {/* Document Content */}
        <div className="prose prose-sm max-w-none mb-6">
          <div 
            className="bg-muted/30 rounded-lg p-4 border font-mono text-sm whitespace-pre-line cursor-pointer"
            onClick={!isReading ? startReading : undefined}
          >
            {!isReading && readingTime === 0 ? (
              <div className="text-center py-8">
                <PenTool className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Click here to start reading the document</p>
              </div>
            ) : (
              documentContent
            )}
          </div>
        </div>

        {!isAlreadySigned && (
          <>
            {/* Confirmation Checkbox */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="hasRead"
                  checked={hasRead}
                  onCheckedChange={(checked) => setHasRead(!!checked)}
                  disabled={readingTime < 30}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="hasRead"
                    className="text-sm font-medium leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have read and understood this safety document
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Minimum review time: 30 seconds • Current time: {formatTime(readingTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            {hasRead && readingTime >= 30 && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-medium mb-3">Digital Signature Required</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please sign below to confirm you understand and will follow these safety procedures:
                </p>
                
                <div className="border border-border rounded-lg bg-background">
                  <SignaturePad
                    ref={signaturePadRef}
                    canvasProps={{
                      className: 'w-full h-32 rounded-lg',
                      style: { touchAction: 'none' }
                    }}
                  />
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={clearSignature}>
                    Clear
                  </Button>
                  <Button 
                    onClick={handleSign}
                    className="btn-primary"
                    disabled={!signaturePadRef.current || signaturePadRef.current.isEmpty()}
                  >
                    Sign Document
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {isAlreadySigned && (
          <div className="text-center py-6 bg-success/5 rounded-lg border border-success/20">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
            <h3 className="font-semibold text-success mb-2">Document Signed</h3>
            <p className="text-sm text-muted-foreground">
              This document has been successfully signed and is stored securely.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RAMSViewer;