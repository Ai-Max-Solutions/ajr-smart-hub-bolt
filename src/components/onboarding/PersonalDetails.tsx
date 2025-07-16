import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Phone, AlertCircle } from 'lucide-react';
import { OnboardingData } from '@/pages/OnboardingFlow';
import { CSCSCardUploader } from '@/components/ui/cscs-card-uploader';

interface PersonalDetailsProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const PersonalDetails = ({ data, updateData }: PersonalDetailsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const relationships = [
    'Partner', 'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'
  ];

  console.info('[CSCS] Personal details page - no CSCS checking enabled.');

  const validateForm = () => {
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
    
    // CSCS front image is optional now - no checking required
    if (!data.cscsCard.frontImage) {
      newErrors.cscsFrontImage = 'Front image of CSCS card is required';
    }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      toast({
        title: "Personal Details Updated",
        description: "Now let's select your work types and review safety documents.",
      });
      navigate('/onboarding/work-types');
    }
  };

  const handleAnalysisComplete = (analysis: any) => {
    toast({
      title: "CSCS Card Analyzed",
      description: `Successfully detected ${analysis.card_color} ${analysis.card_type} card`,
    });
  };

  return (
    <div className="space-y-6">
      <CSCSCardUploader
        data={data.cscsCard}
        updateData={(cscsData) => updateData({ cscsCard: { ...data.cscsCard, ...cscsData } })}
        onAnalysisComplete={handleAnalysisComplete}
        required={false}
      />
      
      {Object.entries(errors).filter(([key]) => key.startsWith('cscs')).map(([key, error]) => (
        <p key={key} className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      ))}

      {/* Emergency Contact Section */}
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
                onClick={() => navigate('/onboarding/signup')}
                className="w-full"
              >
                Back
              </Button>
              <Button type="submit" className="w-full btn-primary">
                Continue to Work Types
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalDetails;