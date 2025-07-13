import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, FileText, PenTool, AlertTriangle } from 'lucide-react';
import { OnboardingData } from '@/pages/OnboardingFlow';
import RAMSViewer from './RAMSViewer';

interface WorkTypeSelectionProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const workTypes = [
  { id: 'testing', name: 'Testing & Commissioning', icon: Settings },
  { id: 'installations', name: 'Installations', icon: Settings },
  { id: 'first-fix', name: '1st Fix Electrical', icon: Settings },
  { id: 'second-fix', name: '2nd Fix Electrical', icon: Settings },
  { id: 'fault-finding', name: 'Fault Finding', icon: Settings },
  { id: 'maintenance', name: 'Maintenance', icon: Settings },
  { id: 'fire-alarms', name: 'Fire Alarm Systems', icon: AlertTriangle },
  { id: 'security', name: 'Security Systems', icon: Settings },
];

// Mock RAMS documents for each work type
const ramsDocuments = {
  'testing': [
    { id: 'rams-test-1', title: 'High Voltage Testing Procedures', version: '2.1' },
    { id: 'rams-test-2', title: 'Electrical Safety Testing', version: '1.5' },
  ],
  'installations': [
    { id: 'rams-inst-1', title: 'Electrical Installation Safety', version: '3.0' },
  ],
  'first-fix': [
    { id: 'rams-1fix-1', title: '1st Fix Electrical Safety Plan', version: '2.3' },
  ],
  'second-fix': [
    { id: 'rams-2fix-1', title: '2nd Fix Electrical Safety Plan', version: '2.1' },
  ],
  'fault-finding': [
    { id: 'rams-fault-1', title: 'Fault Finding Safety Procedures', version: '1.8' },
  ],
  'maintenance': [
    { id: 'rams-maint-1', title: 'Maintenance Safety Guidelines', version: '2.0' },
  ],
  'fire-alarms': [
    { id: 'rams-fire-1', title: 'Fire Alarm System Safety', version: '3.1' },
  ],
  'security': [
    { id: 'rams-sec-1', title: 'Security System Installation', version: '1.9' },
  ],
};

const WorkTypeSelection = ({ data, updateData }: WorkTypeSelectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showRAMS, setShowRAMS] = useState(false);
  const [currentRAMS, setCurrentRAMS] = useState<any>(null);

  const handleWorkTypeChange = (workTypeId: string, checked: boolean) => {
    const updatedWorkTypes = checked 
      ? [...data.selectedWorkTypes, workTypeId]
      : data.selectedWorkTypes.filter(id => id !== workTypeId);
    
    updateData({ selectedWorkTypes: updatedWorkTypes });
  };

  const getRequiredRAMS = () => {
    return data.selectedWorkTypes.flatMap(workType => 
      ramsDocuments[workType as keyof typeof ramsDocuments] || []
    );
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
    const requiredRAMS = getRequiredRAMS();
    const signedCount = getSignedRAMSCount();
    return data.selectedWorkTypes.length > 0 && signedCount === requiredRAMS.length;
  };

  const handleContinue = () => {
    if (!canProceed()) {
      toast({
        title: "Please complete all requirements",
        description: "Select work types and sign all required RAMS documents.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Work Types & RAMS Complete",
      description: "All safety documents have been signed. Finalizing onboarding...",
    });
    navigate('/onboarding/complete');
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
          <CardTitle className="flex items-center gap-2 text-primary">
            <Settings className="w-5 h-5" />
            Select Your Work Types
          </CardTitle>
          <CardDescription>
            Choose the types of work you'll be performing. This determines which safety documents you need to review.
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
      {requiredRAMS.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              Required Safety Documents (RAMS)
            </CardTitle>
            <CardDescription>
              You must read and sign each document before proceeding.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
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
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        isSigned ? 'bg-success' : 'bg-warning'
                      }`} />
                      <div>
                        <h4 className="font-medium">{rams.title}</h4>
                        <p className="text-sm text-muted-foreground">Version {rams.version}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isSigned && (
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          Signed
                        </Badge>
                      )}
                      <Button
                        variant={isSigned ? "outline" : "default"}
                        size="sm"
                        onClick={() => viewRAMS(rams)}
                        className={!isSigned ? "btn-primary" : ""}
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        {isSigned ? 'View' : 'Review & Sign'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
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
          disabled={!canProceed()}
          className="w-full btn-primary"
        >
          Complete Onboarding
        </Button>
      </div>
    </div>
  );
};

export default WorkTypeSelection;