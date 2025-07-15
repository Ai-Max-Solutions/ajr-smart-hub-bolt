import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  X, 
  Plus, 
  Minus, 
  Truck, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Clock,
  Package
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  projectname: string;
  siteaddress: string;
}

interface DeliveryItem {
  description: string;
  quantity: number;
}

interface ContractorDeliveryFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ContractorDeliveryForm = ({ onClose, onSuccess }: ContractorDeliveryFormProps) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [minDeliveryDate, setMinDeliveryDate] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    projectId: '',
    deliveryDate: '',
    timeSlot: 'AM',
    items: [{ description: '', quantity: 1 }] as DeliveryItem[],
    deliveryMethod: {
      pallets: false,
      bagsOrBoxes: false,
      bundles: false,
      lengths: false,
      quantity: ''
    },
    unloadMethod: 'forklift',
    vehicleDetails: {
      supplier: '',
      vehicleType: '',
      edgeProtection: 'barriers',
      isOver35T: false,
      weight: '',
      forsNumber: '',
      forsColour: 'silver'
    },
    specialInstructions: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
    calculateMinDeliveryDate();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('Projects')
        .select('whalesync_postgres_id, projectname, siteaddress')
        .eq('status', 'Active')
        .order('projectname');

      if (error) throw error;
      setProjects(data?.map(p => ({
        id: p.whalesync_postgres_id,
        projectname: p.projectname,
        siteaddress: p.siteaddress
      })) || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const calculateMinDeliveryDate = async () => {
    try {
      // Default 24 hour notice period
      let hoursNotice = 24;
      
      // Try to get project-specific settings if project is selected
      if (formData.projectId) {
        const { data } = await supabase
          .from('project_delivery_settings')
          .select('min_notice_hours')
          .eq('project_id', formData.projectId)
          .single();
        
        if (data) {
          hoursNotice = data.min_notice_hours;
        }
      }
      
      const minDate = new Date();
      minDate.setHours(minDate.getHours() + hoursNotice);
      setMinDeliveryDate(minDate.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error calculating min delivery date:', error);
      // Fallback to 24 hours
      const minDate = new Date();
      minDate.setHours(minDate.getHours() + 24);
      setMinDeliveryDate(minDate.toISOString().split('T')[0]);
    }
  };

  // Recalculate when project changes
  useEffect(() => {
    if (formData.projectId) {
      calculateMinDeliveryDate();
    }
  }, [formData.projectId]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index: number, field: keyof DeliveryItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const validateForm = () => {
    if (!formData.projectId) {
      toast({
        title: "Project required",
        description: "Please select a project for delivery.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.deliveryDate) {
      toast({
        title: "Delivery date required",
        description: "Please select a delivery date.",
        variant: "destructive"
      });
      return false;
    }

    if (new Date(formData.deliveryDate) < new Date(minDeliveryDate)) {
      toast({
        title: "Invalid delivery date",
        description: "Delivery date must meet minimum notice requirements.",
        variant: "destructive"
      });
      return false;
    }

    const hasValidItems = formData.items.every(item => 
      item.description.trim() && item.quantity > 0
    );
    
    if (!hasValidItems) {
      toast({
        title: "Items required",
        description: "Please provide valid descriptions and quantities for all items.",
        variant: "destructive"
      });
      return false;
    }

    const hasDeliveryMethod = Object.values(formData.deliveryMethod).some(value => 
      typeof value === 'boolean' ? value : false
    );
    
    if (!hasDeliveryMethod) {
      toast({
        title: "Delivery method required",
        description: "Please select how items will be delivered.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.vehicleDetails.supplier.trim() || !formData.vehicleDetails.vehicleType.trim()) {
      toast({
        title: "Vehicle details required",
        description: "Please provide supplier and vehicle type information.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.vehicleDetails.isOver35T) {
      if (!formData.vehicleDetails.weight || !formData.vehicleDetails.forsNumber) {
        toast({
          title: "FORS details required",
          description: "Vehicles over 3.5T require weight and FORS certificate details.",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // Check delivery slot availability
      const { data: existingRequests } = await supabase
        .from('delivery_requests')
        .select('id')
        .eq('project_id', formData.projectId)
        .eq('delivery_date', formData.deliveryDate)
        .eq('time_slot', formData.timeSlot)
        .eq('status', 'approved');

      // For now, allow multiple bookings but this could be enhanced with capacity limits
      const { error } = await supabase
        .from('delivery_requests')
        .insert({
          contractor_id: user?.id,
          project_id: formData.projectId,
          delivery_date: formData.deliveryDate,
          time_slot: formData.timeSlot,
          items: formData.items,
          total_items: formData.items.reduce((sum, item) => sum + item.quantity, 0),
          delivery_method: formData.deliveryMethod,
          unload_method: formData.unloadMethod,
          vehicle_details: formData.vehicleDetails,
          special_instructions: formData.specialInstructions || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Delivery request submitted",
        description: "Your delivery request has been submitted for approval. You will receive confirmation once reviewed.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error submitting delivery request:', error);
      toast({
        title: "Error submitting request",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === formData.projectId);

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Truck className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Request Delivery</CardTitle>
                  <CardDescription>Submit a new delivery booking to an AJ Ryan site</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project and Date Selection */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select 
                    value={formData.projectId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div>
                            <div className="font-medium">{project.projectname}</div>
                            <div className="text-xs text-muted-foreground">{project.siteaddress}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Date of Delivery *</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    min={minDeliveryDate}
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 24 hours notice required
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Time Slot *</Label>
                <RadioGroup 
                  value={formData.timeSlot} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AM" id="am" />
                    <Label htmlFor="am">AM (Morning)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PM" id="pm" />
                    <Label htmlFor="pm">PM (Afternoon)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Items on Delivery */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Items on Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button type="button" variant="outline" onClick={addItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Item
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Method */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Delivery Method</CardTitle>
              <CardDescription>How will the above be delivered?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'pallets', label: 'Pallets' },
                  { key: 'bagsOrBoxes', label: 'Bags or Boxes' },
                  { key: 'bundles', label: 'Bundles' },
                  { key: 'lengths', label: 'Lengths' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={formData.deliveryMethod[key as keyof typeof formData.deliveryMethod] as boolean}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          deliveryMethod: { ...prev.deliveryMethod, [key]: checked }
                        }))
                      }
                    />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity of Above</Label>
                <Input
                  id="quantity"
                  placeholder="e.g., 5 pallets, 20 boxes"
                  value={formData.deliveryMethod.quantity}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    deliveryMethod: { ...prev.deliveryMethod, quantity: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Unload Method *</Label>
                <RadioGroup 
                  value={formData.unloadMethod} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unloadMethod: value }))}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="forklift" id="forklift" />
                    <Label htmlFor="forklift">Forklift</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="byHand" id="byHand" />
                    <Label htmlFor="byHand">By Hand</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="palletTruck" id="palletTruck" />
                    <Label htmlFor="palletTruck">Pallet Truck</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Input
                    id="supplier"
                    placeholder="Company/supplier name"
                    value={formData.vehicleDetails.supplier}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vehicleDetails: { ...prev.vehicleDetails, supplier: e.target.value }
                    }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Type of Vehicle *</Label>
                  <Input
                    id="vehicleType"
                    placeholder="e.g., Transit Van, 7.5T Lorry"
                    value={formData.vehicleDetails.vehicleType}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vehicleDetails: { ...prev.vehicleDetails, vehicleType: e.target.value }
                    }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Edge Protection Type *</Label>
                  <RadioGroup 
                    value={formData.vehicleDetails.edgeProtection} 
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      vehicleDetails: { ...prev.vehicleDetails, edgeProtection: value }
                    }))}
                    className="flex flex-wrap gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="barriers" id="barriers" />
                      <Label htmlFor="barriers">Barriers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fencing" id="fencing" />
                      <Label htmlFor="fencing">Fencing</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="handrails" id="handrails" />
                      <Label htmlFor="handrails">Handrails</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isOver35T"
                    checked={formData.vehicleDetails.isOver35T}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      vehicleDetails: { ...prev.vehicleDetails, isOver35T: checked as boolean }
                    }))}
                  />
                  <Label htmlFor="isOver35T">Vehicle Over 3.5T?</Label>
                </div>

                {formData.vehicleDetails.isOver35T && (
                  <div className="p-4 border border-warning bg-warning/10 rounded-lg space-y-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                      <div className="space-y-2">
                        <p className="font-medium text-warning">Heavy Vehicle Requirements</p>
                        <p className="text-sm text-muted-foreground">
                          Vehicles over 3.5 tonnes require FORS Silver certification minimum.
                          <br />
                          <strong>Note:</strong> Articulated lorries are not permitted on site.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Vehicle Weight (tonnes) *</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          placeholder="e.g., 7.5"
                          value={formData.vehicleDetails.weight}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            vehicleDetails: { ...prev.vehicleDetails, weight: e.target.value }
                          }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="forsNumber">FORS Number *</Label>
                        <Input
                          id="forsNumber"
                          placeholder="e.g., 007864"
                          value={formData.vehicleDetails.forsNumber}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            vehicleDetails: { ...prev.vehicleDetails, forsNumber: e.target.value }
                          }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="forsColour">FORS Level *</Label>
                        <Select
                          value={formData.vehicleDetails.forsColour}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            vehicleDetails: { ...prev.vehicleDetails, forsColour: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="silver">Silver (Minimum Required)</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
              <CardDescription>Any additional information for the delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Additional delivery instructions, access requirements, etc."
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Important Notices */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This form must be submitted 24 hours prior to required delivery date. 
              No articulated lorries are permitted on site. All deliveries are subject to approval.
            </AlertDescription>
          </Alert>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Submitting...' : 'Submit Delivery Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractorDeliveryForm;