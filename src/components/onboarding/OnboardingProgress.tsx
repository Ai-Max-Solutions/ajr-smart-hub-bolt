import { useMemo } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

const ONBOARDING_STEPS = [
  { key: 'personal', label: 'Personal Details', path: 'personal-details' },
  { key: 'cscs', label: 'CSCS Card', path: 'cscs-card' },
  { key: 'emergency', label: 'Emergency Contact', path: 'emergency-contact' },
  { key: 'rams', label: 'Work Types', path: 'work-types' }
];

export const OnboardingProgress = () => {
  const { flags, isLoading, firstIncompleteStep } = useOnboarding();

  const progress = useMemo(() => {
    const completedSteps = Object.values(flags).filter(Boolean).length - 1; // Exclude allComplete
    const totalSteps = ONBOARDING_STEPS.length;
    return Math.round((completedSteps / totalSteps) * 100);
  }, [flags]);

  const getStepStatus = (stepKey: string) => {
    const flagKey = `${stepKey}Complete` as keyof typeof flags;
    return flags[flagKey];
  };

  const isCurrentStep = (stepPath: string) => {
    return firstIncompleteStep === stepPath;
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Checking progress...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Onboarding Progress</h3>
        <span className="text-sm text-muted-foreground">{progress}% complete</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {ONBOARDING_STEPS.map((step) => {
          const isComplete = getStepStatus(step.key);
          const isCurrent = isCurrentStep(step.path);
          
          return (
            <div
              key={step.key}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                isCurrent 
                  ? 'bg-primary/10 border border-primary/20' 
                  : isComplete 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-muted/50'
              }`}
            >
              {isComplete ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              <span className={`text-xs font-medium ${
                isCurrent ? 'text-primary' : isComplete ? 'text-green-500' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};