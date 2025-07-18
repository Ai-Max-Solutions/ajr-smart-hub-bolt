import { useOnboarding } from '@/context/OnboardingContext';
import { Progress } from '@/components/ui/progress';
import { Check } from 'lucide-react';

export const OnboardingProgressBar = () => {
  const { flags } = useOnboarding();
  
  const steps = [
    { key: 'personal', label: 'Personal Details', complete: flags.personalComplete },
    { key: 'cscs', label: 'CSCS Card', complete: flags.cscsComplete },
    { key: 'emergency', label: 'Emergency Contact', complete: flags.emergencyComplete },
    { key: 'rams', label: 'Work Types & RAMS', complete: flags.ramsComplete },
  ];
  
  const completedSteps = steps.filter(step => step.complete).length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  
  return (
    <div className="w-full bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-foreground">Onboarding Progress</h2>
            <span className="text-xs text-muted-foreground">{completedSteps} of {steps.length} complete</span>
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center text-xs">
                {step.complete ? (
                  <Check className="w-4 h-4 text-primary mr-1" />
                ) : (
                  <div className="w-4 h-4 border border-muted-foreground rounded-full mr-1" />
                )}
                <span className={step.complete ? 'text-primary' : 'text-muted-foreground'}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};