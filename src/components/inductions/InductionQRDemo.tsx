import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  QrCode, 
  CheckCircle2, 
  PlayCircle,
  ArrowRight,
  Trophy,
  Clock,
  Users,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface InductionQRDemoProps {
  onComplete?: () => void;
}

type DemoStep = 'welcome' | 'qr_scan' | 'safety_demo' | 'quiz' | 'complete';

export const InductionQRDemo: React.FC<InductionQRDemoProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<DemoStep>('welcome');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const steps: Record<DemoStep, { title: string; description: string; progressValue: number }> = {
    welcome: {
      title: 'Welcome to QR Safety Induction',
      description: 'Learn how to use QR codes for safety compliance',
      progressValue: 0
    },
    qr_scan: {
      title: 'QR Code Scanning Demo',
      description: 'Learn how to scan QR codes on safety equipment',
      progressValue: 25
    },
    safety_demo: {
      title: 'Safety Information',
      description: 'Review critical safety information',
      progressValue: 50
    },
    quiz: {
      title: 'Knowledge Check',
      description: 'Complete a short quiz',
      progressValue: 75
    },
    complete: {
      title: 'Induction Complete',
      description: 'Congratulations! You have completed the induction',
      progressValue: 100
    }
  };

  const nextStep = () => {
    const stepOrder: DemoStep[] = ['welcome', 'qr_scan', 'safety_demo', 'quiz', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      const next = stepOrder[currentIndex + 1];
      setCurrentStep(next);
      setProgress(steps[next].progressValue);
      
      if (next === 'complete') {
        onComplete?.();
        toast({
          title: "Induction Complete!",
          description: "You have successfully completed the QR safety induction demo.",
        });
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">QR Safety Induction Beta</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Learn how to use QR codes for safety compliance on construction sites.
              </p>
            </div>
            <Button onClick={nextStep} size="lg" className="px-8">
              Start Beta
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'qr_scan':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <QrCode className="h-12 w-12 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">QR Code Scanning</h2>
              <p className="text-muted-foreground">
                Learn how to properly scan QR codes on safety equipment.
              </p>
            </div>
            <div className="bg-card border rounded-lg p-6 max-w-md mx-auto">
              <div className="w-32 h-32 mx-auto bg-white border-2 border-dashed border-primary rounded-lg flex items-center justify-center mb-4">
                <QrCode className="h-16 w-16 text-primary" />
              </div>
              <Badge variant="outline" className="mb-4">Safety Equipment ID: SE-001</Badge>
              <div className="text-sm space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Equipment status verified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Compliance: Valid</span>
                </div>
              </div>
            </div>
            <Button onClick={nextStep} size="lg">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'safety_demo':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <PlayCircle className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Safety Information</h2>
              <p className="text-muted-foreground">
                Review key safety protocols for QR code usage.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                { num: 1, title: 'Always Scan Before Use', desc: 'Scan QR codes on all equipment before operation.' },
                { num: 2, title: 'Check Compliance', desc: 'Ensure equipment shows valid inspection status.' },
                { num: 3, title: 'Report Issues', desc: 'Report any equipment showing expired status.' },
                { num: 4, title: 'Keep Records', desc: 'Scans are automatically logged for compliance.' }
              ].map((item) => (
                <Card key={item.num}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{item.num}</span>
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button onClick={nextStep} size="lg">
              Take Quiz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'quiz':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Knowledge Check</h2>
              <p className="text-muted-foreground">
                Answer this question to verify your understanding.
              </p>
            </div>
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-lg">Question 1 of 1</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-left">When should you scan a QR code on safety equipment?</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full text-left justify-start"
                    onClick={nextStep}
                  >
                    A) Before using the equipment ✓
                  </Button>
                  <Button variant="outline" className="w-full text-left justify-start">
                    B) After using the equipment
                  </Button>
                  <Button variant="outline" className="w-full text-left justify-start">
                    C) Only if it looks damaged
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <Trophy className="h-12 w-12 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2 text-green-600">Induction Complete!</h2>
              <p className="text-muted-foreground">
                You have successfully completed the QR Safety Induction beta.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Steps Completed:</span>
                  <Badge variant="secondary">4/4</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Quiz Score:</span>
                  <Badge variant="secondary">100%</Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You are now certified to use QR codes for safety compliance.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">QR Safety Induction</h1>
          <p className="text-muted-foreground mb-4">Interactive Training Beta</p>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Current Step Info */}
          <div className="mt-4">
            <h3 className="font-semibold">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>This is a beta version of the QR Safety Induction system.</p>
        </div>
      </div>
    </div>
  );
};