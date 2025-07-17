import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { OnboardingData } from '@/pages/OnboardingFlow';
import { CSCSCardUploader } from '@/components/ui/cscs-card-uploader';
import { useOnboarding } from '@/context/OnboardingContext';

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

  console.log('[CSCSCard] Component loaded, user:', user?.id);

  // Memoized validation to prevent render loops
  const validationResult = useMemo(() => {
    const newErrors: Record<string, string> = {};

    // CSCS Card validation - ALL FIELDS MANDATORY
    if (!data.cscsCard.number.trim()) newErrors.cscsNumber = 'CSCS card number is required';
    else {
      const cleanedNumber = data.cscsCard.number.replace(/[^A-Za-z0-9]/g, '');
      if (cleanedNumber.length < 8) {
        newErrors.cscsNumber = 'Card number must be at least 8 characters.';
      } else if (cleanedNumber.length > 16) {
        newErrors.cscsNumber = 'Card number must be no more than 16 characters.';
      }
    }
    
    if (!data.cscsCard.expiryDate) newErrors.cscsExpiry = 'Expiry date is required';
    else {
      const expiryDate = new Date(data.cscsCard.expiryDate);
      const today = new Date();
      if (expiryDate <= today) newErrors.cscsExpiry = 'Card must not be expired';
    }
    
    if (!data.cscsCard.cardType) newErrors.cscsType = 'Card type is required';

    return {
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0
    };
  }, [data.cscsCard.number, data.cscsCard.expiryDate, data.cscsCard.cardType]);

  // Update errors when validation changes
  useMemo(() => {
    setErrors(validationResult.errors);
  }, [validationResult.errors]);

  const validateForm = useCallback(() => {
    return validationResult.isValid;
  }, [validationResult.isValid]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
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

      // Save CSCS card data
      const { error } = await supabase
        .from('cscs_cards')
        .upsert({
          user_id: userData.id,
          card_number: data.cscsCard.number.trim(),
          card_type: data.cscsCard.cardType,
          expiry_date: data.cscsCard.expiryDate,
          front_image_url: data.cscsCard.frontImage ? 'uploaded' : null,
          back_image_url: data.cscsCard.backImage ? 'uploaded' : null,
          status: 'pending'
        }, {
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

      console.log('[CSCSCard] CSCS card saved successfully');
      
      // Mark step as complete in context
      markStepComplete('cscs');
      
      toast({
        title: "CSCS Card Saved",
        description: "Now let's add your emergency contact.",
      });
      
      navigate('/onboarding/emergency-contact');
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
  }, [validateForm, user, data.cscsCard, markStepComplete, navigate, toast]);

  const handleAnalysisComplete = useCallback((analysis: any) => {
    toast({
      title: "CSCS Card Analyzed",
      description: `Successfully detected ${analysis.card_color} ${analysis.card_type} card`,
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
            Upload your CSCS card and enter the details. All fields are required.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <CSCSCardUploader
              data={data.cscsCard}
              updateData={(cscsData) => updateData({ cscsCard: { ...data.cscsCard, ...cscsData } })}
              onAnalysisComplete={handleAnalysisComplete}
              required={true}
            />
            
            {Object.entries(validationResult.errors).map(([key, error]) => (
              <p key={key} className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            ))}

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