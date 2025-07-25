import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowLeft, PenTool, Clock, CheckCircle, FileText } from 'lucide-react';
import { SignatureCanvas } from '@/components/ui/signature-canvas';

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
  const [currentSignature, setCurrentSignature] = useState<string>('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  const startReading = () => {
    setIsReading(true);
    const timer = setInterval(() => {
      setReadingTime(prev => {
        const newTime = prev + 1;
        // Auto-enable signing after 15 seconds (minimum read time)
        if (newTime >= 15) {
          clearInterval(timer);
          setIsReading(false);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(progress);
    
    if (progress >= 90) {
      setHasScrolledToEnd(true);
    }
  };

  const clearSignature = () => {
    console.log('Clearing signature...');
    setCurrentSignature('');
  };

  const handleSign = () => {
    console.log('Attempting to sign...', { 
      hasSignature: !!currentSignature 
    });
    
    if (currentSignature) {
      console.log('Signature captured successfully');
      onSigned(currentSignature);
    } else {
      console.log('Cannot sign - no signature provided');
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

        {/* Reading Timer and Scroll Progress */}
        {(isReading || readingTime > 0) && (
          <div className="space-y-3 mb-4">
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">
                  Reading time: {formatTime(readingTime)}
                  {readingTime < 15 && " (minimum 15 seconds required)"}
                </span>
              </div>
            </div>
            {readingTime > 0 && (
              <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-info" />
                  <span className="text-sm font-medium">
                    Reading progress: {Math.round(scrollProgress)}%
                    {!hasScrolledToEnd && " (scroll to end required)"}
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div 
                    className="bg-info h-2 rounded-full transition-all duration-300"
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document Content */}
        <div className="prose prose-sm max-w-none mb-6">
          <div 
            className="bg-muted/30 rounded-lg p-4 border font-mono text-sm whitespace-pre-line cursor-pointer max-h-96 overflow-y-auto"
            onClick={!isReading ? startReading : undefined}
            onScroll={isReading ? handleScroll : undefined}
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
                  disabled={readingTime < 15 || !hasScrolledToEnd}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="hasRead"
                    className="text-sm font-medium leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have read and understood this safety document
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Requirements: 15 seconds reading time • Scroll to end • Current time: {formatTime(readingTime)} • Progress: {Math.round(scrollProgress)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            {hasRead && readingTime >= 15 && hasScrolledToEnd && (
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-medium mb-3">Digital Signature Required</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please sign below to confirm you understand and will follow these safety procedures:
                </p>
                
                <div className="border border-border rounded-lg bg-background">
                  <SignatureCanvas
                    onSignature={setCurrentSignature}
                    onCancel={clearSignature}
                    title="Sign to confirm you understand and will follow these safety procedures"
                    className="w-full"
                  />
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button 
                    onClick={handleSign}
                    className="btn-primary"
                    disabled={!currentSignature}
                  >
                    Complete Signing
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
