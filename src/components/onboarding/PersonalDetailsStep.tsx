import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  ArrowRight, 
  CheckCircle 
} from 'lucide-react';

interface PersonalDetailsStepProps {
  onComplete?: () => void;
}

const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Update user profile with personal details
      const { error } = await supabase
        .from('Users')
        .update({
          firstname: formData.firstName,
          lastname: formData.lastName,
          fullname: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone || null,
          emergencycontact: formData.emergencyContact || null,
          emergencyphone: formData.emergencyPhone || null
        })
        .eq('whalesync_postgres_id', user?.user_id);

      if (error) throw error;

      // Get CSCS card data from the onboarding flow if it exists (stored in localStorage)
      const onboardingData = localStorage.getItem('onboardingData');
      if (onboardingData) {
        const data = JSON.parse(onboardingData);
        if (data.cscsCard && data.cscsCard.number && data.cscsCard.expiryDate) {
          // Parse the expiry date from DD/MM/YYYY format
          const [day, month, year] = data.cscsCard.expiryDate.split('/');
          const expiryDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          
          // Save CSCS card to qualifications table
          const { error: cscsError } = await supabase.rpc('save_cscs_card_from_onboarding', {
            p_user_id: user?.user_id,
            p_card_number: data.cscsCard.number.replace(/\s/g, ''),
            p_expiry_date: expiryDate,
            p_card_type: data.cscsCard.cardType || 'Not specified'
          });

          if (cscsError) {
            console.error('Error saving CSCS card:', cscsError);
            // Don't fail the whole process for CSCS card save error
          }
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your personal details have been saved successfully.",
      });

      // Navigate to main dashboard
      navigate('/');
      
      if (onComplete) {
        onComplete();
      }
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-accent" />
            </div>
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>
              Let's get your personal details set up
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={errors.firstName ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={errors.lastName ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  disabled={isSubmitting}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Emergency Contact (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    This information helps us contact someone in case of an emergency
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Enter emergency contact name"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="Enter emergency contact phone"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PersonalDetailsStep;