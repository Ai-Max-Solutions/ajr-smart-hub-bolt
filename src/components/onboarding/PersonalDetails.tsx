import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, AlertCircle, Loader2 } from 'lucide-react';
import { OnboardingData } from '@/pages/OnboardingFlow';

interface PersonalDetailsProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const PersonalDetails = ({ data, updateData }: PersonalDetailsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  console.log('[PersonalDetails] Component loaded, user:', user?.id);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!data.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!data.lastName?.trim()) newErrors.lastName = 'Last name is required';
    
    // Phone validation
    if (!data.phone?.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\+?\d{10,15}$/.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Phone must be 10-15 digits (e.g., +44 7123 456789)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      console.log('[PersonalDetails] Saving personal details to database...');
      
      const fullName = `${data.firstName?.trim()} ${data.lastName?.trim()}`.trim();
      
      const { error } = await supabase
        .from('users')
        .update({ 
          name: fullName,
          firstname: data.firstName?.trim(),
          lastname: data.lastName?.trim(),
          phone: data.phone?.trim()
        })
        .eq('supabase_auth_id', user.id);

      if (error) {
        console.error('[PersonalDetails] Database save error:', error);
        toast({
          title: "Save Failed",
          description: "Could not save your details. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('[PersonalDetails] Personal details saved successfully');
      setIsSaved(true);
      
      toast({
        title: "Personal Details Saved",
        description: "Now let's upload your CSCS card.",
      });
      
      navigate('/onboarding/cscs-card');
    } catch (error) {
      console.error('[PersonalDetails] Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Details Section */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <User className="w-5 h-5" />
            Personal Details
          </CardTitle>
          <CardDescription>
            Tell us about yourself so we can set up your profile.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={data.firstName || ''}
                  onChange={(e) => updateData({ firstName: e.target.value })}
                  placeholder="John"
                  className={errors.firstName ? 'border-destructive' : ''}
                />
                {errors.firstName && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="form-field space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={data.lastName || ''}
                  onChange={(e) => updateData({ lastName: e.target.value })}
                  placeholder="Smith"
                  className={errors.lastName ? 'border-destructive' : ''}
                />
                {errors.lastName && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="form-field space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={data.phone || ''}
                onChange={(e) => updateData({ phone: e.target.value })}
                placeholder="+44 7123 456789"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="w-full"
                disabled={isLoading}
              >
                Back to Login
              </Button>
              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue to CSCS Card'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalDetails;