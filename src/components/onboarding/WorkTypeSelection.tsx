import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Wrench, 
  Thermometer, 
  Fan, 
  Settings, 
  Zap, 
  Droplets, 
  ShieldCheck, 
  Factory, 
  Cog, 
  ClipboardList, 
  HardHat, 
  FileText,
  PenTool
} from 'lucide-react';
import { OnboardingData } from '@/pages/OnboardingFlow';
import RAMSViewer from './RAMSViewer';

interface WorkTypeSelectionProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const workTypes = [
  { id: 'electrical-installation', name: 'Electrical Installation', icon: Zap },
  { id: 'electrical-maintenance', name: 'Electrical Maintenance', icon: Settings },
  { id: 'testing-commissioning', name: 'Testing & Commissioning', icon: ClipboardList },
  { id: 'sprinkler-fire', name: 'Sprinkler / Fire Suppression', icon: Droplets },
  { id: 'general-labour', name: 'General Labour', icon: HardHat },
  { id: 'plumbing', name: 'Plumbing', icon: Wrench },
  { id: 'heating-cooling', name: 'Heating & Cooling', icon: Thermometer },
  { id: 'ventilation-ac', name: 'Ventilation & Air Conditioning', icon: Fan },
  { id: 'pipe-fitting', name: 'Pipe Fitting', icon: Wrench },
  { id: 'insulation', name: 'Insulation', icon: ShieldCheck },
  { id: 'tank-plant-room', name: 'Tank / Plant Room Work', icon: Factory },
  { id: 'mechanical-engineering', name: 'Mechanical Engineering', icon: Cog },
];

interface RAMSDocument {
  id: string;
  title: string;
  version: string;
  work_types: string[];
  risk_level: string;
  minimum_read_time: number;
}

const WorkTypeSelection = ({ data, updateData }: WorkTypeSelectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showRAMS, setShowRAMS] = useState(false);
  const [currentRAMS, setCurrentRAMS] = useState<RAMSDocument | null>(null);
  const [ramsDocuments, setRamsDocuments] = useState<Record<string, RAMSDocument[]>>({});
  const [loadingRAMS, setLoadingRAMS] = useState(false);

  // Fetch RAMS documents and existing signatures from database
  useEffect(() => {
    const fetchRAMSDocumentsAndSignatures = async () => {
      setLoadingRAMS(true);
      try {
        console.log('[WorkTypeSelection] Fetching RAMS documents and signatures...');
        
        // Fetch RAMS documents
        const { data: documents, error: documentsError } = await supabase
          .from('rams_documents')
          .select('id, title, version, work_types, risk_level, minimum_read_time')
          .eq('is_active', true);

        if (documentsError) {
          console.error('Error fetching RAMS documents:', documentsError);
          toast({
            title: "Error loading safety documents",
            description: "Unable to load required safety documents. Please refresh the page.",
            variant: "destructive",
          });
          return;
        }

        console.log('[WorkTypeSelection] Fetched RAMS documents:', documents?.length || 0);

        // Group documents by work type
        const groupedDocuments: Record<string, RAMSDocument[]> = {};
        
        documents?.forEach(doc => {
          doc.work_types.forEach(workType => {
            if (!groupedDocuments[workType]) {
              groupedDocuments[workType] = [];
            }
            groupedDocuments[workType].push(doc);
          });
        });

        setRamsDocuments(groupedDocuments);
        console.log('[WorkTypeSelection] Grouped RAMS documents:', Object.keys(groupedDocuments));

        // Fetch existing signatures for this user if authenticated
        if (user) {
          console.log('[WorkTypeSelection] Fetching user data and existing signatures...');
          
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('supabase_auth_id', user.id)
            .maybeSingle();

          if (userData) {
            console.log('[WorkTypeSelection] Found user ID:', userData.id);
            
            const { data: signatures, error: signaturesError } = await supabase
              .from('contractor_rams_signatures')
              .select('rams_document_id, signed_at')
              .eq('contractor_id', userData.id)
              .eq('is_current', true);

            if (!signaturesError && signatures) {
              console.log('[WorkTypeSelection] Found existing signatures:', signatures.length);
              
              // Create signature objects that match our data structure
              const existingSignatures = signatures.map(sig => ({
                workType: '', // Will be determined from the document
                documentId: sig.rams_document_id,
                signedAt: new Date(sig.signed_at),
                signature: 'existing_signature' // Placeholder for existing signature
              }));

              // Only add signatures that aren't already in the data
              const currentSignatureIds = new Set(data.signedRAMS.map(s => s.documentId));
              const newSignatures = existingSignatures.filter(
                existing => !currentSignatureIds.has(existing.documentId)
              );

              if (newSignatures.length > 0) {
                console.log('[WorkTypeSelection] Adding', newSignatures.length, 'existing signatures to data');
                const allSignatures = [...data.signedRAMS, ...newSignatures];
                updateData({ signedRAMS: allSignatures });
              }
            } else if (signaturesError) {
              console.error('[WorkTypeSelection] Error fetching signatures:', signaturesError);
            } else {
              console.log('[WorkTypeSelection] No existing signatures found');
            }
          } else {
            console.log('[WorkTypeSelection] User not found in database yet');
          }
        }
      } catch (error) {
        console.error('Error fetching RAMS documents and signatures:', error);
        toast({
          title: "Error loading safety documents",
          description: "Unable to load required safety documents. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoadingRAMS(false);
      }
    };

    fetchRAMSDocumentsAndSignatures();
  }, [toast, user]); // Removed data dependency to avoid infinite loops

  const handleWorkTypeChange = (workTypeId: string, checked: boolean) => {
    const updatedWorkTypes = checked 
      ? [...data.selectedWorkTypes, workTypeId]
      : data.selectedWorkTypes.filter(id => id !== workTypeId);
    
    updateData({ selectedWorkTypes: updatedWorkTypes });
  };

  const getRequiredRAMS = () => {
    console.log("Selected work types:", data.selectedWorkTypes);
    console.log("Available RAMS documents by work type:", ramsDocuments);
    
    const requiredRAMS = data.selectedWorkTypes.flatMap(workType => {
      const docs = ramsDocuments[workType] || [];
      console.log(`RAMS for work type "${workType}":`, docs);
      return docs;
    });
      
    console.log("Final required RAMS:", requiredRAMS);
    return requiredRAMS;
  };

  const getSignedRAMSCount = () => {
    const requiredRAMS = getRequiredRAMS();
    return data.signedRAMS.filter(signed => 
      requiredRAMS.some(rams => rams.id === signed.documentId)
    ).length;
  };

  const viewRAMS = (rams: any) => {
    setCurrentRAMS(rams);
    setShowRAMS(true);
  };

  const handleRAMSSigned = (signature: string) => {
    if (currentRAMS) {
      const newSignedRAMS = {
        workType: data.selectedWorkTypes.find(wt => 
          ramsDocuments[wt as keyof typeof ramsDocuments]?.some(r => r.id === currentRAMS.id)
        ) || '',
        documentId: currentRAMS.id,
        signedAt: new Date(),
        signature,
      };

      updateData({
        signedRAMS: [...data.signedRAMS, newSignedRAMS]
      });

      setShowRAMS(false);
      setCurrentRAMS(null);

      toast({
        title: "Document Signed",
        description: `${currentRAMS.title} has been signed successfully.`,
      });
    }
  };

  const canProceed = () => {
    if (data.selectedWorkTypes.length === 0) {
      console.log('[WorkTypeSelection] Cannot proceed: No work types selected');
      return false;
    }
    
    const requiredRAMS = getRequiredRAMS();
    const signedCount = getSignedRAMSCount();
    const canContinue = signedCount === requiredRAMS.length;
    
    console.log('[WorkTypeSelection] Can proceed check:', {
      selectedWorkTypes: data.selectedWorkTypes.length,
      requiredRAMS: requiredRAMS.length,
      signedCount,
      canContinue
    });
    
    return canContinue;
  };

  const handleContinue = async () => {
    if (!canProceed()) {
      toast({
        title: "Please complete all requirements",
        description: "Select work types and sign all required RAMS documents.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mark onboarding as completed in the database
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ 
            role: data.selectedWorkTypes.includes('supervisor') ? 'Supervisor' : 'Operative'
          })
          .eq('supabase_auth_id', user.id);

        if (error) {
          console.error('Error updating onboarding status:', error);
          toast({
            title: "Error",
            description: "Failed to complete onboarding. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Work Types & RAMS Complete",
        description: "All safety documents have been signed. Finalizing onboarding...",
      });
      navigate('/onboarding/complete');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (showRAMS && currentRAMS) {
    return (
      <RAMSViewer
        document={currentRAMS}
        onBack={() => setShowRAMS(false)}
        onSigned={handleRAMSSigned}
        isAlreadySigned={data.signedRAMS.some(s => s.documentId === currentRAMS.id)}
      />
    );
  }

  const requiredRAMS = getRequiredRAMS();
  const signedCount = getSignedRAMSCount();

  return (
    <div className="space-y-6">
      {/* Work Type Selection */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary mb-2">
            Choose the type of work you do — so we can get it right every time!
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            <div className="space-y-3">
              <p>
                At A&J Ryan, we cover a range of specialist trades and roles.
                Select the main work type that best describes what you do day-to-day.
                This helps us match you with the right tasks, rates, and compliance checks.
              </p>
              
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-sm font-medium text-success-foreground">
                  ✅ Our streamlined work types
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground italic">
                <strong>Tip:</strong> Pick the one that fits most of your work — you'll still be able to log different tasks under your projects.
              </p>
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workTypes.map((workType) => {
              const Icon = workType.icon;
              const isSelected = data.selectedWorkTypes.includes(workType.id);
              
              return (
                <div 
                  key={workType.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  onClick={() => handleWorkTypeChange(workType.id, !isSelected)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => {}} // Controlled by parent div click
                    />
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {workType.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {data.selectedWorkTypes.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-foreground mb-3">Selected Work Types:</h3>
              <div className="flex flex-wrap gap-2">
                {data.selectedWorkTypes.map(workTypeId => {
                  const workType = workTypes.find(wt => wt.id === workTypeId);
                  return workType ? (
                    <Badge key={workTypeId} variant="secondary" className="bg-primary/10 text-primary">
                      {workType.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RAMS Documents */}
      {data.selectedWorkTypes.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              Required Safety Documents (RAMS)
            </CardTitle>
            <CardDescription>
              {requiredRAMS.length > 0 
                ? "You must read and sign each document before proceeding."
                : "No RAMS documents required for your selected work types."
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {requiredRAMS.length > 0 ? (
              <>
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Progress: {signedCount} of {requiredRAMS.length} documents signed
                  </p>
                  <div className="w-full bg-border rounded-full h-2 mt-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(signedCount / requiredRAMS.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {requiredRAMS.map((rams) => {
                    const isSigned = data.signedRAMS.some(s => s.documentId === rams.id);
                    
                    return (
                      <div 
                        key={rams.id}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${
                          isSigned 
                            ? 'border-success bg-success/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-2 h-2 rounded-full ${
                              isSigned ? 'bg-success' : 'bg-warning'
                            }`} />
                            <h4 className="font-medium">{rams.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Version {rams.version}</span>
                            <span>•</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                rams.risk_level === 'high' ? 'border-red-200 text-red-700 bg-red-50' :
                                rams.risk_level === 'medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                                rams.risk_level === 'low' ? 'border-green-200 text-green-700 bg-green-50' :
                                'border-gray-200 text-gray-700 bg-gray-50'
                              }`}
                            >
                              {rams.risk_level?.toUpperCase()} RISK
                            </Badge>
                            {rams.minimum_read_time && (
                              <>
                                <span>•</span>
                                <span>{rams.minimum_read_time} min read</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isSigned && (
                            <Badge variant="secondary" className="bg-success/10 text-success">
                              ✓ Signed
                            </Badge>
                          )}
                          <Button
                            variant={isSigned ? "outline" : "default"}
                            size="sm"
                            onClick={() => viewRAMS(rams)}
                            className={!isSigned ? "btn-primary" : ""}
                          >
                            <PenTool className="w-4 h-4 mr-2" />
                            {isSigned ? 'View' : 'Sign Document'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-success" />
                </div>
                <h3 className="font-medium text-foreground mb-2">No RAMS Required</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  The work types you've selected don't currently require any additional safety documentation. 
                  You can proceed to the next step.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/onboarding/personal-details')}
          className="w-full"
        >
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!canProceed() || loadingRAMS}
          className={`w-full ${canProceed() ? 'btn-primary' : ''}`}
        >
          {!canProceed() 
            ? `Sign ${requiredRAMS.length - signedCount} more documents`
            : 'Continue to Complete'
          }
        </Button>
      </div>
      
      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-muted rounded-lg text-xs space-y-2">
          <p><strong>Debug Info:</strong></p>
          <p>Selected work types: {data.selectedWorkTypes.join(', ')}</p>
          <p>Required RAMS: {requiredRAMS.length}</p>
          <p>Signed RAMS: {signedCount}</p>
          <p>Can proceed: {canProceed() ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default WorkTypeSelection;