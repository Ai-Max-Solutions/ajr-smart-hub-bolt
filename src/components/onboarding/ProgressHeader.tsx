import { useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const steps = [
  { id: 1, title: 'Sign Up', path: '/onboarding/signup' },
  { id: 2, title: 'Personal Details', path: '/onboarding/personal-details' },
  { id: 3, title: 'CSCS Card', path: '/onboarding/cscs-card' },
  { id: 4, title: 'Emergency Contact', path: '/onboarding/emergency-contact' },
  { id: 5, title: 'Work Types', path: '/onboarding/work-types' },
  { id: 6, title: 'Complete', path: '/onboarding/complete' },
];

const ProgressHeader = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const getCurrentStep = () => {
    const step = steps.find(s => s.path === currentPath);
    return step ? step.id : 1;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="bg-primary text-primary-foreground py-6 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">AJ Ryan SmartWork Hub</h1>
          <p className="text-primary-foreground/80">Operative Onboarding</p>
        </div>
        
        <div className="flex items-center justify-center space-x-4 md:space-x-8">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-accent text-accent-foreground progress-step completed'
                        : isActive 
                        ? 'bg-accent text-accent-foreground progress-step active'
                        : 'bg-primary-foreground/20 text-primary-foreground/60 progress-step'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    isActive ? 'text-accent' : 'text-primary-foreground/80'
                  }`}>
                    {step.title}
                  </span>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`hidden md:block w-8 h-0.5 mx-4 ${
                    isCompleted ? 'bg-accent' : 'bg-primary-foreground/20'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-primary-foreground/60 text-sm">
            Step {currentStep} of {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressHeader;