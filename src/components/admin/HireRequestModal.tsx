import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Truck, Clock, MapPin, Wrench, Sparkles, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface HireRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HireRequestModal = ({ isOpen, onClose }: HireRequestModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    hireDate: '',
    hireTime: '',
    equipmentType: '',
    notes: ''
  });

  const equipmentTypes = [
    'Excavator',
    'Dumper Truck',
    'Crane',
    'Concrete Mixer',
    'Scaffolding',
    'Generator',
    'Compressor',
    'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit hire requests.",
        variant: "destructive"
      });
      return;
    }

    // Validation
    if (!formData.pickupAddress || !formData.deliveryAddress || !formData.hireDate || !formData.equipmentType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields - no leaky pipes here!",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user ID from profiles
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Call our edge function to handle the hire request
      const { data, error } = await supabase.functions.invoke('hire-request-webhook', {
        body: {
          user_id: profile.id,
          pickup_address: formData.pickupAddress,
          delivery_address: formData.deliveryAddress,
          hire_date: formData.hireDate,
          hire_time: formData.hireTime || null,
          equipment_type: formData.equipmentType,
          notes: formData.notes || null
        }
      });

      if (error) throw error;

      // TODO: Trigger n8n workflow for AI voice call
      // This is now handled by the edge function automatically

      toast({
        title: "Hire Request Submitted! 🚛",
        description: data?.message || "AI is calling the hire company now - that's watertight planning!",
      });

      // Reset form and close
      setFormData({
        pickupAddress: '',
        deliveryAddress: '',
        hireDate: '',
        hireTime: '',
        equipmentType: '',
        notes: ''
      });
      onClose();

    } catch (error) {
      console.error('Error submitting hire request:', error);
      toast({
        title: "Submission Failed",
        description: "Looks like we've got a leak in the system - try again!",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-ai rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            AI-Powered Hire Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Info Card */}
          <Card className="bg-gradient-subtle border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-aj-yellow rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-aj-navy-deep" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">Smart Automation</h4>
                  <p className="text-xs text-muted-foreground">
                    Our AI will generate a personalized script and call the hire company automatically. 
                    You'll get real-time updates!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickup" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Pickup Address *
              </Label>
              <Input
                id="pickup"
                placeholder="Site address for pickup"
                value={formData.pickupAddress}
                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Delivery Address *
              </Label>
              <Input
                id="delivery"
                placeholder="Where to deliver"
                value={formData.deliveryAddress}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Hire Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.hireDate}
                onChange={(e) => handleInputChange('hireDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Preferred Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.hireTime}
                onChange={(e) => handleInputChange('hireTime', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              Equipment Type *
            </Label>
            <Select value={formData.equipmentType} onValueChange={(value) => handleInputChange('equipmentType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment type" />
              </SelectTrigger>
              <SelectContent>
                {equipmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requirements</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or notes..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-ai text-white"
            >
              {isSubmitting ? (
                <>
                  <Phone className="w-4 h-4 mr-2 animate-pulse" />
                  AI Calling...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit & Call
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};