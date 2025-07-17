import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Phone, AlertCircle, Loader2 } from 'lucide-react';
import { OnboardingData } from '@/pages/OnboardingFlow';

interface EmergencyContactProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const relationships = [
  'Partner', 'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'
];

const EmergencyContact = ({ data, updateData }: EmergencyContactProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  console.log('[EmergencyContact] Component loaded, user:', user?.id);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Emergency contact validation
    if (!data.emergencyContact.name.trim()) newErrors.emergencyName = 'Emergency contact name is required';
    if (!data.emergencyContact.relationship) newErrors.emergencyRelationship = 'Relationship is required';
    if (!data.emergencyContact.phone.trim()) newErrors.emergencyPhone = 'Phone number is required';
    else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(data.emergencyContact.phone)) {
      newErrors.emergencyPhone = 'Invalid phone number format';
    }
    if (!data.emergencyContact.email.trim()) newErrors.emergencyEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.emergencyContact.email)) {
      newErrors.emergencyEmail = 'Invalid email format';
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
      console.log('[EmergencyContact] Saving emergency contact to database...');
      
      // Get user ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .maybeSingle();

      if (userError || !userData) {
        console.error('[EmergencyContact] User not found:', userError);
        toast({
          title: "Error",
          description: "User not found. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Save emergency contact data
      const { error } = await supabase
        .from('emergency_contacts')
        .upsert({
          user_id: userData.id,
          name: data.emergencyContact.name.trim(),
          relationship: data.emergencyContact.relationship,
          phone: data.emergencyContact.phone.trim(),
          email: data.emergencyContact.email.trim()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[EmergencyContact] Database save error:', error);
        toast({
          title: "Save Failed",
          description: "Could not save emergency contact. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('[EmergencyContact] Emergency contact saved successfully');
      
      toast({
        title: "Emergency Contact Saved",
        description: "Now let's select your work types.",
      });
      
      navigate('/onboarding/work-types');
    } catch (error) {
      console.error('[EmergencyContact] Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save emergency contact. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Phone className="w-5 h-5" />
            Emergency Contact
          </CardTitle>
          <CardDescription>
            Who should we call in case of emergency?
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-field space-y-2">
              <Label htmlFor="emergencyName">Contact Name *</Label>
              <Input
                id="emergencyName"
                value={data.emergencyContact.name}
                onChange={(e) => updateData({ 
                  emergencyContact: { ...data.emergencyContact, name: e.target.value } 
                })}
                placeholder="Full name"
                className={errors.emergencyName ? 'border-destructive' : ''}
              />
              {errors.emergencyName && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.emergencyName}
                </p>
              )}
            </div>

            <div className="form-field space-y-2">
              <Label htmlFor="relationship">Relationship *</Label>
              <Select 
                value={data.emergencyContact.relationship} 
                onValueChange={(value) => updateData({ 
                  emergencyContact: { ...data.emergencyContact, relationship: value } 
                })}
              >
                <SelectTrigger className={errors.emergencyRelationship ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map(rel => (
                    <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.emergencyRelationship && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.emergencyRelationship}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-field space-y-2">
                <Label htmlFor="emergencyPhone">Phone Number *</Label>
                <Input
                  id="emergencyPhone"
                  value={data.emergencyContact.phone}
                  onChange={(e) => updateData({ 
                    emergencyContact: { ...data.emergencyContact, phone: e.target.value } 
                  })}
                  placeholder="+44 7123 456789"
                  className={errors.emergencyPhone ? 'border-destructive' : ''}
                />
                {errors.emergencyPhone && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.emergencyPhone}
                  </p>
                )}
              </div>

              <div className="form-field space-y-2">
                <Label htmlFor="emergencyEmail">Email Address *</Label>
                <Input
                  id="emergencyEmail"
                  type="email"
                  value={data.emergencyContact.email}
                  onChange={(e) => updateData({ 
                    emergencyContact: { ...data.emergencyContact, email: e.target.value } 
                  })}
                  placeholder="contact@email.com"
                  className={errors.emergencyEmail ? 'border-destructive' : ''}
                />
                {errors.emergencyEmail && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.emergencyEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/onboarding/cscs-card')}
                className="w-full"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={isLoading || !validateForm()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue to Work Types'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyContact;