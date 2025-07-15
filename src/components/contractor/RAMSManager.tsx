import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  PenTool,
  Shield,
  Building2,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EnhancedRAMSViewer from './EnhancedRAMSViewer';

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

interface RAMSSignature {
  id: string;
  rams_document_id: string;
  signed_at: string;
  reading_time_seconds: number;
  valid_until?: string;
  is_current: boolean;
}

interface ComplianceStatus {
  required_documents: number;
  signed_documents: number;
  expired_signatures: number;
  compliance_percentage: number;
  is_compliant: boolean;
}

const RAMSManager = () => {
  const [documents, setDocuments] = useState<RAMSDocument[]>([]);
  const [signatures, setSignatures] = useState<RAMSSignature[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<RAMSDocument | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [contractorProfile, setContractorProfile] = useState<any>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadRAMSData();
  }, []);

  const loadRAMSData = async () => {
    try {
      setLoading(true);
      
      // Get contractor profile
      const { data: profile } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      setContractorProfile(profile);

      // For now, use mock data as we don't have the new tables yet
      // In Phase 3 implementation, this would load from the actual database
      setDocuments([
        {
          id: 'rams-hv-001',
          title: 'High Voltage Maintenance Safety Plan',
          version: '2.1',
          work_types: ['testing', 'maintenance', 'fault-finding'],
          risk_level: 'very_high',
          content: `HIGH VOLTAGE MAINTENANCE PLAN

RISK ASSESSMENT AND METHOD STATEMENT

Reference: RAMS-HV-001
Version: 2.1
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

By signing this document, you confirm that you have read, understood, and will comply with all safety procedures outlined above.`,
          minimum_read_time: 60,
          requires_fresh_signature: true,
          project_name: 'Windsor Heights Development'
        },
        {
          id: 'rams-ei-001',
          title: 'Electrical Installation Safety Guidelines',
          version: '3.0',
          work_types: ['installations', 'first-fix', 'second-fix'],
          risk_level: 'high',
          content: `ELECTRICAL INSTALLATION SAFETY GUIDELINES

RISK ASSESSMENT AND METHOD STATEMENT

Reference: RAMS-EI-001
Version: 3.0

SCOPE OF WORK
Safety procedures for electrical installation work including first and second fix activities.

HAZARDS IDENTIFIED
• Electric shock
• Manual handling
• Working at height
• Tool-related injuries

CONTROL MEASURES
1. Always isolate circuits before work
2. Use appropriate PPE
3. Follow safe working practices
4. Regular tool inspection

By signing this document, you confirm understanding of all safety requirements.`,
          minimum_read_time: 45,
          requires_fresh_signature: false
        }
      ]);

      setSignatures([]);
      
      setCompliance({
        required_documents: 2,
        signed_documents: 0,
        expired_signatures: 0,
        compliance_percentage: 0,
        is_compliant: false
      });

    } catch (error: any) {
      console.error('Error loading RAMS data:', error);
      toast({
        title: "Error loading RAMS documents",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSigned = (documentId: string, signature: string, readingTime: number) => {
    const newSignature: RAMSSignature = {
      id: `sig-${Date.now()}`,
      rams_document_id: documentId,
      signed_at: new Date().toISOString(),
      reading_time_seconds: readingTime,
      is_current: true
    };

    setSignatures(prev => [...prev, newSignature]);
    
    // Update compliance
    const newSignedCount = signatures.length + 1;
    setCompliance(prev => prev ? {
      ...prev,
      signed_documents: newSignedCount,
      compliance_percentage: Math.round((newSignedCount / prev.required_documents) * 100),
      is_compliant: newSignedCount >= prev.required_documents
    } : null);

    setShowViewer(false);
    setSelectedDocument(null);

    toast({
      title: "Document Signed Successfully",
      description: `${selectedDocument?.title} has been signed and recorded.`,
    });
  };

  const viewDocument = (document: RAMSDocument) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const getRiskBadge = (riskLevel: string) => {
    const variants = {
      low: { variant: 'secondary' as const, color: 'text-blue-600', bg: 'bg-blue-50' },
      medium: { variant: 'secondary' as const, color: 'text-yellow-600', bg: 'bg-yellow-50' },
      high: { variant: 'destructive' as const, color: 'text-orange-600', bg: 'bg-orange-50' },
      very_high: { variant: 'destructive' as const, color: 'text-red-600', bg: 'bg-red-50' }
    };

    const config = variants[riskLevel as keyof typeof variants] || variants.medium;

    return (
      <Badge variant={config.variant} className={`${config.bg} ${config.color}`}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        {riskLevel.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const isDocumentSigned = (documentId: string) => {
    return signatures.some(sig => sig.rams_document_id === documentId && sig.is_current);
  };

  const getSignatureInfo = (documentId: string) => {
    return signatures.find(sig => sig.rams_document_id === documentId && sig.is_current);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showViewer && selectedDocument) {
    return (
      <EnhancedRAMSViewer
        document={selectedDocument}
        onBack={() => {
          setShowViewer(false);
          setSelectedDocument(null);
        }}
        onSigned={(signature, readingTime) => handleDocumentSigned(selectedDocument.id, signature, readingTime)}
        isAlreadySigned={isDocumentSigned(selectedDocument.id)}
        signatureInfo={getSignatureInfo(selectedDocument.id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <Card className="contractor-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 contractor-accent-text">
                <Shield className="w-5 h-5" />
                RAMS Compliance Status
              </CardTitle>
              <CardDescription>
                Risk Assessment and Method Statement documents required for your work
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold contractor-accent-text">
                {compliance?.compliance_percentage || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress 
              value={compliance?.compliance_percentage || 0} 
              className="w-full"
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-contractor-accent">
                  {compliance?.required_documents || 0}
                </div>
                <div className="text-sm text-muted-foreground">Required</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-success">
                  {compliance?.signed_documents || 0}
                </div>
                <div className="text-sm text-muted-foreground">Signed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-warning">
                  {(compliance?.required_documents || 0) - (compliance?.signed_documents || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-destructive">
                  {compliance?.expired_signatures || 0}
                </div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </div>
            </div>

            {compliance?.is_compliant ? (
              <div className="flex items-center justify-center gap-2 p-3 bg-success/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="font-medium text-success">All required documents signed</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 p-3 bg-warning/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span className="font-medium text-warning">
                  {(compliance?.required_documents || 0) - (compliance?.signed_documents || 0)} document(s) require signing
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Tabs defaultValue="required" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="required">Required Documents</TabsTrigger>
          <TabsTrigger value="signed">Signed Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="required" className="space-y-4">
          {documents.filter(doc => !isDocumentSigned(doc.id)).map((document) => (
            <Card key={document.id} className="contractor-card hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-contractor-accent" />
                      <div>
                        <h3 className="font-semibold text-foreground">{document.title}</h3>
                        <p className="text-sm text-muted-foreground">Version {document.version}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {getRiskBadge(document.risk_level)}
                      
                      {document.project_name && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          {document.project_name}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {Math.ceil(document.minimum_read_time / 60)} min read
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {document.work_types.map(workType => (
                        <Badge key={workType} variant="outline" className="text-xs">
                          {workType.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>

                    {document.requires_fresh_signature && (
                      <div className="flex items-center gap-2 text-sm text-warning">
                        <AlertTriangle className="w-4 h-4" />
                        Requires fresh signature for each project
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => viewDocument(document)}
                      className="contractor-button"
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      Review & Sign
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {documents.filter(doc => !isDocumentSigned(doc.id)).length === 0 && (
            <Card className="contractor-card">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold text-success mb-2">All Documents Signed</h3>
                <p className="text-muted-foreground">
                  You have signed all required RAMS documents. You're ready to start work!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="signed" className="space-y-4">
          {documents.filter(doc => isDocumentSigned(doc.id)).map((document) => {
            const signatureInfo = getSignatureInfo(document.id);
            return (
              <Card key={document.id} className="contractor-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <div>
                          <h3 className="font-semibold text-foreground">{document.title}</h3>
                          <p className="text-sm text-muted-foreground">Version {document.version}</p>
                        </div>
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          Signed
                        </Badge>
                      </div>

                      {signatureInfo && (
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Signed: {new Date(signatureInfo.signed_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Read time: {Math.ceil(signatureInfo.reading_time_seconds / 60)} minutes
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {document.work_types.map(workType => (
                          <Badge key={workType} variant="outline" className="text-xs">
                            {workType.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => viewDocument(document)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {documents.filter(doc => isDocumentSigned(doc.id)).length === 0 && (
            <Card className="contractor-card">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-muted-foreground mb-2">No Signed Documents</h3>
                <p className="text-muted-foreground">
                  Documents you sign will appear here for your records.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RAMSManager;