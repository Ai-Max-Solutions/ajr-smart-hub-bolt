
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { OnboardingData } from '@/pages/OnboardingFlow';
import { CSCSCardUploader } from '@/components/ui/cscs-card-uploader';
import { useOnboarding } from '@/context/OnboardingContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSCSCardProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const CSCSCard = ({ data, updateData }: CSCSCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { markStepComplete } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  console.log('[CSCSCard] Component loaded, user:', user?.id);

  // Enhanced validation with AI confidence consideration
  const validationResult = useMemo(() => {
    const newErrors: Record<string, string> = {};

    // CSCS Card validation - ALL FIELDS MANDATORY
    if (!data.cscsCard.number.trim()) {
      newErrors.cscsNumber = 'CSCS card number is required';
    } else {
      const cleanedNumber = data.cscsCard.number.replace(/[^A-Za-z0-9]/g, '');
      if (cleanedNumber.length < 8) {
        newErrors.cscsNumber = 'Card number must be at least 8 characters.';
      } else if (cleanedNumber.length > 16) {
        newErrors.cscsNumber = 'Card number must be no more than 16 characters.';
      }
    }
    
    if (!data.cscsCard.expiryDate) {
      newErrors.cscsExpiry = 'Expiry date is required';
    } else {
      const expiryDate = new Date(data.cscsCard.expiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        newErrors.cscsExpiry = 'Card must not be expired';
      }
    }
    
    if (!data.cscsCard.cardType) {
      newErrors.cscsType = 'Card type is required';
    }

    // Check if we have uploaded a card image or completed analysis
    if (!data.cscsCard.frontImage && !data.cscsCard.uploadComplete) {
      newErrors.cscsUpload = 'Please upload your CSCS card';
    }

    return {
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0
    };
  }, [data.cscsCard.number, data.cscsCard.expiryDate, data.cscsCard.cardType, data.cscsCard.frontImage, data.cscsCard.uploadComplete]);

  // Update errors when validation changes
  useMemo(() => {
    setErrors(validationResult.errors);
  }, [validationResult.errors]);

  const validateForm = useCallback(() => {
    return validationResult.isValid;
  }, [validationResult.isValid]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before continuing",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to continue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('[CSCSCard] Saving CSCS card to database...');
      
      // Get user ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .maybeSingle();

      if (userError || !userData) {
        console.error('[CSCSCard] User not found:', userError);
        toast({
          title: "Error",
          description: "User not found. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Enhanced save with AI analysis data
      const saveData = {
        user_id: userData.id,
        card_number: data.cscsCard.number.trim(),
        card_type: data.cscsCard.cardType,
        expiry_date: data.cscsCard.expiryDate,
        front_image_url: data.cscsCard.frontImage ? 'uploaded' : null,
        back_image_url: data.cscsCard.backImage ? 'uploaded' : null,
        status: 'pending',
        // Include AI analysis results if available
        ...(aiAnalysisResult && {
          card_color: aiAnalysisResult.cardType,
          confidence_score: aiAnalysisResult.confidence,
          raw_ai_response: aiAnalysisResult,
          qualifications: aiAnalysisResult.cardSubtype ? {
            primary_qualification: aiAnalysisResult.cardSubtype,
            detected_text: aiAnalysisResult.detectedText
          } : null
        })
      };

      // Save CSCS card data with enhanced information
      const { error } = await supabase
        .from('cscs_cards')
        .upsert(saveData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[CSCSCard] Database save error:', error);
        toast({
          title: "Save Failed",
          description: "Could not save your CSCS card. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('[CSCSCard] CSCS card saved successfully with AI data');
      
      // Mark step as complete in context
      markStepComplete('cscs');
      
      const confidenceText = aiAnalysisResult?.confidence >= 0.8 ? ' with high confidence' : 
                           aiAnalysisResult?.confidence >= 0.5 ? ' with medium confidence' : '';
      
      toast({
        title: "CSCS Card Saved",
        description: `Your card has been analyzed and saved${confidenceText}. Now let's add your emergency contact.`,
      });
      
      // Add navigation delay for better UX
      setTimeout(() => {
        navigate('/onboarding/emergency-contact');
      }, 500);
      
    } catch (error) {
      console.error('[CSCSCard] Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save CSCS card. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, user, data.cscsCard, aiAnalysisResult, markStepComplete, navigate, toast]);

  const handleAnalysisComplete = useCallback((analysis: any) => {
    setAiAnalysisResult(analysis);
    
    const confidenceText = analysis.confidence >= 0.8 ? 'high' : 
                         analysis.confidence >= 0.5 ? 'medium' : 'low';
    
    toast({
      title: "CSCS Card Analyzed",
      description: `Successfully analyzed your card with ${confidenceText} confidence (${Math.round(analysis.confidence * 100)}%)`,
    });
  }, [toast]);

  return (
    <div className="space-y-6">
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CreditCard className="w-5 h-5" />
            CSCS Card Details
          </CardTitle>
          <CardDescription>
            Upload your CSCS card for automatic analysis and verification. All fields are required.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <CSCSCardUploader
              data={data.cscsCard}
              updateData={(cscsData) => updateData({ cscsCard: { ...data.cscsCard, ...cscsData } })}
              onAnalysisComplete={handleAnalysisComplete}
              required={true}
            />
            
            {/* Enhanced validation errors display */}
            {Object.entries(validationResult.errors).length > 0 && (
              <Alert className="border-destructive">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium text-destructive">Please fix the following issues:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(validationResult.errors).map(([key, error]) => (
                        <li key={key} className="text-sm text-destructive">{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* AI Analysis success indicator */}
            {aiAnalysisResult && aiAnalysisResult.confidence > 0.5 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>AI Verification Complete!</strong> Your CSCS card has been successfully analyzed and verified.
                  {aiAnalysisResult.confidence >= 0.8 && (
                    <span className="block text-sm mt-1">High confidence detection - all details automatically filled.</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/onboarding/personal-details')}
                className="w-full"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={isLoading || !validationResult.isValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue to Emergency Contact'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSCSCard;
