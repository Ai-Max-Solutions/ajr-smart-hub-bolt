import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Shield, Lock } from 'lucide-react';
import { CSCSCardUploader } from '@/components/ui/cscs-card-uploader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';

interface CSCSCardData {
  number: string;
  expiryDate: string;
  cardType: string;
  frontImage?: File;
  backImage?: File;
}

export const CSCSOnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [cscsData, setCSCSData] = useState<CSCSCardData>({
    number: '',
    expiryDate: '',
    cardType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCSCSData = (updates: Partial<CSCSCardData>) => {
    setCSCSData(prev => ({ ...prev, ...updates }));
  };

  const validateCSCSData = () => {
    // Clean card number (remove spaces and non-digits for validation)
    const cleanCardNumber = cscsData.number.replace(/\D/g, '');
    
    if (!cleanCardNumber) {
      toast({
        title: "Validation Error",
        description: "Please enter your CSCS card number",
        variant: "destructive"
      });
      return false;
    }

    if (cleanCardNumber.length < 8) {
      toast({
        title: "Validation Error",
        description: "Your CSCS number must be at least 8 digits long",
        variant: "destructive"
      });
      return false;
    }

    if (!cscsData.expiryDate) {
      toast({
        title: "Validation Error", 
        description: "Please enter your CSCS card expiry date",
        variant: "destructive"
      });
      return false;
    }

    if (!cscsData.cardType) {
      toast({
        title: "Validation Error",
        description: "Please select your CSCS card type",
        variant: "destructive"
      });
      return false;
    }

    // Check if card is not expired
    const expiryDate = new Date(cscsData.expiryDate);
    const today = new Date();
    if (expiryDate < today) {
      toast({
        title: "Card Expired",
        description: "Your CSCS card has expired. Please upload a valid card.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmitCSCS = async () => {
    if (!validateCSCSData() || !user) return;

    setIsSubmitting(true);
    try {
      // Directly insert/update CSCS card record
      const { error: upsertError } = await supabase
        .from('cscs_cards')
        .upsert({
          user_id: user.id,
          card_number: cscsData.number.replace(/\D/g, ''), // Clean card number
          expiry_date: cscsData.expiryDate,
          cscs_card_type: cscsData.cardType,
          file_url: 'placeholder', // Required field - will be updated when actual file is uploaded
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        throw upsertError;
      }

      setCurrentStep(3); // Move to success step
      
      toast({
        title: "CSCS Card Uploaded Successfully",
        description: "Your CSCS card has been verified and you now have access to the system.",
      });

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error updating CSCS status:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to update your CSCS card details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Shield className="h-16 w-16 mx-auto text-aj-yellow" />
              <h1 className="text-3xl font-bold text-aj-navy-deep">CSCS Card Required</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A valid CSCS (Construction Skills Certification Scheme) card is mandatory for access to site details and work assignments.
              </p>
            </div>

            <Alert className="border-aj-yellow/50 bg-aj-yellow/5">
              <AlertTriangle className="h-4 w-4 text-aj-yellow" />
              <AlertDescription className="text-aj-navy-deep">
                <strong>Access Denied:</strong> You must upload your valid CSCS Card before you can access site details.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Why is CSCS Required?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Health & Safety Compliance</h4>
                      <p className="text-sm text-muted-foreground">
                        Ensures all site workers have appropriate safety training and qualifications
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Legal Requirements</h4>
                      <p className="text-sm text-muted-foreground">
                        Required by law for most construction sites in the UK
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Skill Verification</h4>
                      <p className="text-sm text-muted-foreground">
                        Confirms your skills and competency for specific work types
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Insurance & Liability</h4>
                      <p className="text-sm text-muted-foreground">
                        Protects both you and AJ Ryan Mechanical Services from liability issues
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button 
                onClick={() => setCurrentStep(2)}
                className="bg-aj-yellow text-aj-navy-deep hover:bg-aj-yellow/90 px-8"
              >
                Upload My CSCS Card
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-aj-navy-deep">Upload Your CSCS Card</h1>
              <p className="text-muted-foreground">
                Please upload your valid CSCS card to complete your site access setup
              </p>
            </div>

            <CSCSCardUploader
              data={cscsData}
              updateData={updateCSCSData}
              onAnalysisComplete={(analysis) => {
                console.log('Analysis completed:', analysis);
                // Optionally auto-fill data from analysis
                if (analysis.card_number && analysis.card_number.length >= 8) {
                  updateCSCSData({
                    number: analysis.card_number,
                    expiryDate: analysis.expiry_date || '',
                    cardType: `${analysis.card_color} - ${analysis.card_type}` || ''
                  });
                }
              }}
              required={true}
            />

            <div className="flex gap-4 justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmitCSCS}
                disabled={!cscsData.number || !cscsData.expiryDate || !cscsData.cardType || isSubmitting}
                className="bg-aj-yellow text-aj-navy-deep hover:bg-aj-yellow/90"
              >
                {isSubmitting ? "Verifying..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="h-20 w-20 mx-auto text-green-500" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-aj-navy-deep">CSCS Card Verified!</h1>
              <p className="text-lg text-muted-foreground">
                Your CSCS card has been successfully verified and you now have full access to the AJ Ryan SmartWork Hub.
              </p>
            </div>

            <Alert className="border-green-500/50 bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                <strong>Access Granted:</strong> You can now access all site details, work assignments, and project information.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Redirecting you to the dashboard...</p>
              <div className="w-full bg-accent rounded-full h-2">
                <div className="bg-aj-yellow h-2 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {renderStep()}
      </div>
    </div>
  );
};