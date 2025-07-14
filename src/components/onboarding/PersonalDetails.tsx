import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, AlertCircle, CreditCard, Phone } from 'lucide-react';
import { OnboardingData } from '@/pages/OnboardingFlow';

interface PersonalDetailsProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const PersonalDetails = ({ data, updateData }: PersonalDetailsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cardTypes = [
    'Green - Labourer',
    'Blue - Skilled Worker',
    'Yellow - Supervisor',
    'White - Trainee',
    'Black - Manager',
    'Gold - Academically Qualified'
  ];

  const relationships = [
    'Partner', 'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // CSCS Card validation - ALL FIELDS MANDATORY
    if (!data.cscsCard.number.trim()) newErrors.cscsNumber = 'CSCS card number is required';
    else if (!/^\d{16}$/.test(data.cscsCard.number.replace(/\s/g, ''))) {
      newErrors.cscsNumber = 'CSCS card number must be 16 digits';
    }
    
    if (!data.cscsCard.expiryDate) newErrors.cscsExpiry = 'Expiry date is required';
    else {
      const [day, month, year] = data.cscsCard.expiryDate.split('/');
      const expiryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date();
      if (expiryDate <= today) newErrors.cscsExpiry = 'Card must not be expired';
    }
    
    if (!data.cscsCard.cardType) newErrors.cscsType = 'Card type is required';

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

  const handleFileUpload = (type: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateData({
        cscsCard: {
          ...data.cscsCard,
          [`${type}Image`]: file
        }
      });
      toast({
        title: `CSCS Card ${type} uploaded`,
        description: "Image uploaded successfully",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* CSCS Card Section */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CreditCard className="w-5 h-5" />
            CSCS Card Details
          </CardTitle>
          <CardDescription>
            Required for UK construction sites
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="form-field space-y-2">
            <Label htmlFor="cardType">Card Type *</Label>
            <Select 
              value={data.cscsCard.cardType} 
              onValueChange={(value) => updateData({ 
                cscsCard: { ...data.cscsCard, cardType: value } 
              })}
            >
              <SelectTrigger className={errors.cscsType ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select your card type" />
              </SelectTrigger>
              <SelectContent>
                {cardTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cscsType && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.cscsType}
              </p>
            )}
          </div>

          <div className="form-field space-y-2">
            <Label htmlFor="cardNumber">CSCS Card Number *</Label>
            <Input
              id="cardNumber"
              value={data.cscsCard.number}
              onChange={(e) => {
                const formatted = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                if (formatted.replace(/\s/g, '').length <= 16) {
                  updateData({ 
                    cscsCard: { ...data.cscsCard, number: formatted } 
                  });
                }
              }}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className={errors.cscsNumber ? 'border-destructive' : ''}
            />
            {errors.cscsNumber && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.cscsNumber}
              </p>
            )}
          </div>

          <div className="form-field space-y-2">
            <Label htmlFor="expiryDate">Card Expiry Date *</Label>
            <Input
              id="expiryDate"
              value={data.cscsCard.expiryDate}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) value = value.substring(0,2) + '/' + value.substring(2);
                if (value.length >= 5) value = value.substring(0,5) + '/' + value.substring(5,9);
                updateData({ 
                  cscsCard: { ...data.cscsCard, expiryDate: value } 
                });
              }}
              placeholder="DD/MM/YYYY"
              maxLength={10}
              className={errors.cscsExpiry ? 'border-destructive' : ''}
            />
            {errors.cscsExpiry && (
              <p className="text-destructive text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.cscsExpiry}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field space-y-2">
              <Label>Front of Card</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload('front')}
                  className="hidden"
                  id="front-upload"
                />
                <label htmlFor="front-upload" className="cursor-pointer">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload front image</p>
                </label>
                {data.cscsCard.frontImage && (
                  <p className="text-xs text-success mt-2">{data.cscsCard.frontImage.name}</p>
                )}
              </div>
            </div>
            
            <div className="form-field space-y-2">
              <Label>Back of Card</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload('back')}
                  className="hidden"
                  id="back-upload"
                />
                <label htmlFor="back-upload" className="cursor-pointer">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload back image</p>
                </label>
                {data.cscsCard.backImage && (
                  <p className="text-xs text-success mt-2">{data.cscsCard.backImage.name}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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