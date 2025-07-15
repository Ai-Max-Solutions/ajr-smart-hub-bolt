import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  ArrowLeft, 
  PenTool, 
  Clock, 
  CheckCircle,
  Eye,
  Shield,
  FileText,
  Calendar,
  Building2
} from 'lucide-react';
import SignaturePad from 'react-signature-canvas';

interface RAMSDocument {
  id: string;
  title: string;
  version: string;
  work_types: string[];
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
  content: string;
  minimum_read_time: number;
  requires_fresh_signature: boolean;
  project_id?: string;
  project_name?: string;
}

interface SignatureInfo {
  id: string;
  signed_at: string;
  reading_time_seconds: number;
  valid_until?: string;
}

interface EnhancedRAMSViewerProps {
  document: RAMSDocument;
  onBack: () => void;
  onSigned: (signature: string, readingTime: number) => void;
  isAlreadySigned: boolean;
  signatureInfo?: SignatureInfo;
}

const EnhancedRAMSViewer = ({ 
  document, 
  onBack, 
  onSigned, 
  isAlreadySigned,
  signatureInfo 
}: EnhancedRAMSViewerProps) => {
  const [hasRead, setHasRead] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const signaturePadRef = useRef<SignaturePad>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startReading = () => {
    if (!hasStartedReading) {
      setHasStartedReading(true);
      setIsReading(true);
      
      intervalRef.current = setInterval(() => {
        setReadingTime(prev => {
          const newTime = prev + 1;
          // Continue until minimum time is reached
          if (newTime >= document.minimum_read_time) {
            clearInterval(intervalRef.current!);
            setIsReading(false);
          }
          return newTime;
        });
      }, 1000);
    }
  };

  const stopReading = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsReading(false);
  };

  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSign = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signature = signaturePadRef.current.toDataURL();
      stopReading();
      onSigned(signature, readingTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRiskConfig = (riskLevel: string) => {
    const configs = {
      low: { 
        color: 'text-blue-600', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200',
        alert: 'Low Risk Activity'
      },
      medium: { 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-200',
        alert: 'Medium Risk Activity'
      },
      high: { 
        color: 'text-orange-600', 
        bg: 'bg-orange-50', 
        border: 'border-orange-200',
        alert: 'High Risk Activity'
      },
      very_high: { 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        border: 'border-red-200',
        alert: 'Very High Risk Activity'
      }
    };
    
    return configs[riskLevel as keyof typeof configs] || configs.medium;
  };

  const riskConfig = getRiskConfig(document.risk_level);
  const isMinimumTimeReached = readingTime >= document.minimum_read_time;
  const readingProgress = Math.min((readingTime / document.minimum_read_time) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="card-hover">
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to RAMS List
            </Button>
            <div className="flex-1">
              <CardTitle className="text-primary flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {document.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span>Version {document.version}</span>
                {document.project_name && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {document.project_name}
                    </div>
                  </>
                )}
              </CardDescription>
            </div>
            {isAlreadySigned && signatureInfo && (
              <div className="text-right">
                <div className="flex items-center gap-2 text-success mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Signed</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(signatureInfo.signed_at).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Risk Level Warning */}
          <div className={`${riskConfig.bg} border ${riskConfig.border} rounded-lg p-4 mb-6`}>
            <div className="flex items-start gap-3">
              <Shield className={`w-5 h-5 ${riskConfig.color} mt-0.5`} />
              <div>
                <h3 className={`font-semibold ${riskConfig.color}`}>{riskConfig.alert}</h3>
                <p className={`text-sm ${riskConfig.color}/80 mt-1`}>
                  This document requires careful review. Minimum review time: {Math.ceil(document.minimum_read_time / 60)} minutes
                </p>
                {document.requires_fresh_signature && (
                  <p className={`text-sm ${riskConfig.color}/80 mt-1 font-medium`}>
                    ⚠️ Requires fresh signature for each new project assignment
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Work Types */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Applies to work types:</h4>
            <div className="flex flex-wrap gap-2">
              {document.work_types.map(workType => (
                <Badge key={workType} variant="outline" className="text-xs">
                  {workType.replace('-', ' ').toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          {/* Reading Progress */}
          {(hasStartedReading || isAlreadySigned) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Reading Progress: {formatTime(readingTime)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {isMinimumTimeReached ? (
                    <span className="text-success font-medium">✓ Minimum time reached</span>
                  ) : (
                    <span>Minimum: {formatTime(document.minimum_read_time)}</span>
                  )}
                </div>
              </div>
              <Progress value={readingProgress} className="w-full" />
            </div>
          )}

          {/* Document Content */}
          <div className="mb-6">
            <div 
              className={`bg-muted/30 rounded-lg border font-mono text-sm whitespace-pre-line ${
                !hasStartedReading && !isAlreadySigned ? 'cursor-pointer hover:bg-muted/50' : ''
              }`}
              onClick={!hasStartedReading && !isAlreadySigned ? startReading : undefined}
            >
              {!hasStartedReading && !isAlreadySigned ? (
                <div className="text-center py-12 px-6">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground mb-2">Click to Start Reading</h3>
                  <p className="text-muted-foreground">
                    The reading timer will start when you click here
                  </p>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Required reading time: {Math.ceil(document.minimum_read_time / 60)} minutes
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {document.content}
                </div>
              )}
            </div>
          </div>

          {!isAlreadySigned && hasStartedReading && (
            <>
              {/* Reading Controls */}
              <div className="flex gap-4 mb-6">
                <Button
                  variant="outline"
                  onClick={isReading ? stopReading : startReading}
                  size="sm"
                >
                  {isReading ? 'Pause Reading' : 'Resume Reading'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    stopReading();
                    setReadingTime(document.minimum_read_time);
                  }}
                  size="sm"
                  disabled={isMinimumTimeReached}
                >
                  Skip to Minimum Time
                </Button>
              </div>

              {/* Confirmation Checkbox */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="hasRead"
                    checked={hasRead}
                    onCheckedChange={(checked) => setHasRead(!!checked)}
                    disabled={!isMinimumTimeReached}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="hasRead"
                      className="text-sm font-medium leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I have read and understood this safety document in full
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Minimum review time: {formatTime(document.minimum_read_time)} • 
                      Current time: {formatTime(readingTime)}
                      {!isMinimumTimeReached && ' (Continue reading to enable signing)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              {hasRead && isMinimumTimeReached && (
                <div className="border rounded-lg p-6 bg-muted/20">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <PenTool className="w-4 h-4" />
                    Digital Signature Required
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    By signing below, you confirm that you have read, understood, and will comply with all safety procedures outlined in this document.
                  </p>
                  
                  <div className="border border-border rounded-lg bg-background p-4">
                    <SignaturePad
                      ref={signaturePadRef}
                      canvasProps={{
                        className: 'w-full h-32 rounded-lg',
                        style: { touchAction: 'none' }
                      }}
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={clearSignature}>
                      Clear Signature
                    </Button>
                    <Button 
                      onClick={handleSign}
                      className="btn-primary"
                      disabled={!signaturePadRef.current || signaturePadRef.current.isEmpty()}
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      Sign Document
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {isAlreadySigned && signatureInfo && (
            <div className="text-center py-8 bg-success/5 rounded-lg border border-success/20">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
              <h3 className="font-semibold text-success mb-2">Document Successfully Signed</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Signed on {new Date(signatureInfo.signed_at).toLocaleDateString()}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" />
                  Reading time: {Math.ceil(signatureInfo.reading_time_seconds / 60)} minutes
                </div>
                {signatureInfo.valid_until && (
                  <div className="flex items-center justify-center gap-1 text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    Valid until: {new Date(signatureInfo.valid_until).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedRAMSViewer;