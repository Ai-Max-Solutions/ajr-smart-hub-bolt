import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Clock, FileText, Shield, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import EnhancedRAMSViewer from './EnhancedRAMSViewer';

interface TaskPlanEntry {
  id: string;
  project_name: string;
  work_activity: string;
  rams_name: string;
  version: string;
  date_issued: string;
  status: string;
  signed_by?: string;
  date_signed?: string;
  rams_document_id: string;
  rams_document?: any;
}

interface ComplianceStatus {
  is_compliant: boolean;
  required_count: number;
  signed_count: number;
  outstanding_count: number;
  compliance_percentage: number;
  blocking_activities: string[];
}

export const EnhancedRAMSCompliance: React.FC = () => {
  const [entries, setEntries] = useState<TaskPlanEntry[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [contractorProfile, setContractorProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadContractorRAMS();
  }, []);

  const loadContractorRAMS = async () => {
    try {
      setLoading(true);

      // Get current contractor profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setContractorProfile(profile);

      // Load Task Plan / RAMS register entries for this contractor
      const { data: registerData, error: registerError } = await supabase
        .from('task_plan_rams_register')
        .select(`
          *,
          rams_document:rams_documents(
            id,
            title,
            content,
            risk_level,
            minimum_read_time,
            requires_fresh_signature
          )
        `)
        .eq('contractor_id', profile.id)
        .order('date_issued', { ascending: false });

      if (registerError) throw registerError;

      setEntries(registerData || []);
      calculateComplianceStatus(registerData || []);

    } catch (error) {
      console.error('Error loading contractor RAMS:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Task Plan / RAMS compliance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateComplianceStatus = (data: TaskPlanEntry[]) => {
    const required = data.length;
    const signed = data.filter(entry => entry.status === 'Signed').length;
    const outstanding = data.filter(entry => entry.status === 'Outstanding').length;
    const percentage = required > 0 ? Math.round((signed / required) * 100) : 100;
    
    const blockingActivities = data
      .filter(entry => entry.status === 'Outstanding')
      .map(entry => entry.work_activity);

    setComplianceStatus({
      is_compliant: outstanding === 0,
      required_count: required,
      signed_count: signed,
      outstanding_count: outstanding,
      compliance_percentage: percentage,
      blocking_activities: [...new Set(blockingActivities)]
    });
  };

  const handleDocumentSigned = async (signature: string, readingTime: number) => {
    try {
      // Update the register entry status for the currently selected document
      const entry = entries.find(e => e.rams_document_id === selectedDocument?.id);
      if (!entry) throw new Error('Entry not found');

      const { error: updateError } = await supabase
        .from('task_plan_rams_register')
        .update({
          status: 'Signed',
          signed_by: `${contractorProfile.first_name} ${contractorProfile.last_name}`,
          date_signed: new Date().toISOString(),
          signature_data: signature
        })
        .eq('id', entry.id);

      if (updateError) throw updateError;

      // Create signature record
      const { error: signatureError } = await supabase
        .from('rams_signatures')
        .insert({
          register_entry_id: entry.id,
          contractor_id: contractorProfile.id,
          rams_document_id: selectedDocument.id,
          document_version: entry.version,
          signature_data: signature,
          reading_time_seconds: readingTime,
          is_valid: true
        });

      if (signatureError) throw signatureError;

      toast({
        title: 'Success',
        description: 'Task Plan / RAMS signed successfully',
      });

      setShowViewer(false);
      loadContractorRAMS();

    } catch (error) {
      console.error('Error signing document:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign Task Plan / RAMS document',
        variant: 'destructive',
      });
    }
  };

  const viewDocument = (entry: TaskPlanEntry) => {
    if (entry.rams_document) {
      setSelectedDocument({
        ...entry.rams_document,
        version: entry.version,
        date_issued: entry.date_issued,
        work_activity: entry.work_activity,
        project_name: entry.project_name
      });
      setShowViewer(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any, icon: any, color: string }> = {
      Outstanding: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-500' },
      Signed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-500' },
      Expired: { variant: 'secondary' as const, icon: Clock, color: 'text-gray-500' },
      Superseded: { variant: 'outline' as const, icon: Clock, color: 'text-yellow-500' }
    };

    const statusConfig = config[status] || config.Outstanding;
    const { variant, icon: Icon, color } = statusConfig;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const config: Record<string, { variant: any, color: string }> = {
      Low: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      Medium: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      High: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };

    const riskConfig = config[riskLevel] || config.Medium;
    return (
      <Badge variant={riskConfig.variant} className={riskConfig.color}>
        {riskLevel} Risk
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Status Header */}
      <Card className={`border-l-4 ${complianceStatus?.is_compliant ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {complianceStatus?.is_compliant ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Unlock className="h-5 w-5" />
                  <span className="font-semibold">Compliant</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <Lock className="h-5 w-5" />
                  <span className="font-semibold">Compliance Required</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {complianceStatus?.compliance_percentage}%
              </div>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={complianceStatus?.compliance_percentage || 0} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {complianceStatus?.signed_count} of {complianceStatus?.required_count} Task Plan / RAMS documents signed
            </p>
          </div>
        </CardHeader>
        {!complianceStatus?.is_compliant && (
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Action Required:</strong> You must sign all outstanding Task Plan / RAMS documents before you can submit timesheets, request deliveries, or perform work activities.
                {complianceStatus?.blocking_activities && complianceStatus.blocking_activities.length > 0 && (
                  <div className="mt-2">
                    <strong>Blocked activities:</strong> {complianceStatus.blocking_activities.join(', ')}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Task Plan / RAMS Documents */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Required Task Plan / RAMS Documents</h2>
        
        {entries.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Task Plan / RAMS Required</h3>
                <p className="text-muted-foreground">
                  No Task Plan / RAMS documents are currently assigned to your work activities.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{entry.rams_name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 text-sm">
                          <span>{entry.project_name}</span>
                          <span>•</span>
                          <span>{entry.work_activity}</span>
                          <span>•</span>
                          <Badge variant="outline">v{entry.version}</Badge>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.rams_document && getRiskBadge(entry.rams_document.risk_level)}
                      {getStatusBadge(entry.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Issued: {format(new Date(entry.date_issued), 'dd/MM/yyyy')}</span>
                      {entry.date_signed && (
                        <span>Signed: {format(new Date(entry.date_signed), 'dd/MM/yyyy HH:mm')}</span>
                      )}
                    </div>
                    
                    {entry.status === 'Outstanding' && (
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => viewDocument(entry)}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Review & Sign Task Plan / RAMS
                        </Button>
                        {entry.rams_document?.minimum_read_time && (
                          <span className="text-sm text-muted-foreground">
                            Minimum reading time: {Math.ceil(entry.rams_document.minimum_read_time / 60)} minutes
                          </span>
                        )}
                      </div>
                    )}
                    
                    {entry.status === 'Signed' && entry.signed_by && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Signed by {entry.signed_by}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewDocument(entry)}
                          className="ml-auto"
                        >
                          View Document
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced RAMS Viewer Dialog */}
      <Dialog open={showViewer} onOpenChange={setShowViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Plan / RAMS Document</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <EnhancedRAMSViewer
              document={selectedDocument}
              onBack={() => setShowViewer(false)}
              onSigned={handleDocumentSigned}
              isAlreadySigned={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};