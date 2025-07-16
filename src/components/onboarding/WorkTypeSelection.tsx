import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
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
  Zap as Pipe, 
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
  { id: 'plumbing', name: 'Plumbing', icon: Wrench },
  { id: 'heating-cooling', name: 'Heating & Cooling', icon: Thermometer },
  { id: 'ventilation-ac', name: 'Ventilation & Air Conditioning', icon: Fan },
  { id: 'testing-commissioning', name: 'Testing & Commissioning', icon: Settings },
  { id: 'pipe-fitting', name: 'Pipe Fitting', icon: Pipe },
  { id: 'sprinkler-fire', name: 'Sprinkler / Fire Suppression', icon: Droplets },
  { id: 'insulation', name: 'Insulation', icon: ShieldCheck },
  { id: 'tank-plant-room', name: 'Tank / Plant Room Work', icon: Factory },
  { id: 'mechanical-engineering', name: 'Mechanical Engineering', icon: Cog },
  { id: 'project-management', name: 'Project & Site Management', icon: ClipboardList },
  { id: 'general-labour', name: 'General Labour', icon: HardHat },
  { id: 'admin-contracts', name: 'Admin / Contracts Support', icon: FileText },
];

// Mock RAMS documents for each work type
const ramsDocuments = {
  'plumbing': [
    { id: 'rams-plumb-1', title: 'Plumbing Safety Procedures', version: '2.1' },
  ],
  'heating-cooling': [
    { id: 'rams-hvac-1', title: 'HVAC System Safety Guidelines', version: '1.8' },
  ],
  'ventilation-ac': [
    { id: 'rams-vent-1', title: 'Ventilation & AC Safety Plan', version: '2.3' },
  ],
  'testing-commissioning': [
    { id: 'rams-test-1', title: 'Testing & Commissioning Safety', version: '3.0' },
  ],
  'pipe-fitting': [
    { id: 'rams-pipe-1', title: 'Pipe Fitting Safety Procedures', version: '1.9' },
  ],
  'sprinkler-fire': [
    { id: 'rams-fire-1', title: 'Fire Suppression System Safety', version: '2.2' },
  ],
  'insulation': [
    { id: 'rams-insul-1', title: 'Insulation Work Safety Plan', version: '1.7' },
  ],
  'tank-plant-room': [
    { id: 'rams-tank-1', title: 'Plant Room Safety Guidelines', version: '2.0' },
  ],
  'mechanical-engineering': [
    { id: 'rams-mech-1', title: 'Mechanical Engineering Safety', version: '2.4' },
  ],
  'project-management': [
    { id: 'rams-pm-1', title: 'Site Management Safety Plan', version: '1.6' },
  ],
  'general-labour': [
    { id: 'rams-labour-1', title: 'General Labour Safety Guidelines', version: '2.1' },
  ],
  'admin-contracts': [
    { id: 'rams-admin-1', title: 'Office & Admin Safety Procedures', version: '1.5' },
  ],
};

const WorkTypeSelection = ({ data, updateData }: WorkTypeSelectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
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
          Next: Add Your Skills
        </Button>
      </div>
    </div>
  );
};

export default WorkTypeSelection;