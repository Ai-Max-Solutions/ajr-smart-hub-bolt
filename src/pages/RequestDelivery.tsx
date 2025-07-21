import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Truck, Plus, Trash2, Package, Calendar, Clock, Building2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface DeliveryItem {
  item: string;
  quantity: number;
  description?: string;
}

const RequestDelivery = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  
  // Form state
  const [supplier, setSupplier] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [items, setItems] = useState<DeliveryItem[]>([{ item: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');
  
  // Delivery method state
  const [pallets, setPallets] = useState('');
  const [unloadMethod, setUnloadMethod] = useState('');
  
  // Vehicle details state
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleSupplier, setVehicleSupplier] = useState('');
  const [over35T, setOver35T] = useState(false);
  const [weight, setWeight] = useState('');
  const [forsNumber, setForsNumber] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  // Fetch current project info
  useEffect(() => {
    const fetchCurrentProject = async () => {
      if (!userProfile?.currentproject) return;
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', userProfile.currentproject)
          .single();
          
        if (error) throw error;
        setCurrentProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    fetchCurrentProject();
  }, [userProfile]);

  const addItem = () => {
    setItems([...items, { item: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof DeliveryItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userProfile?.currentproject) {
      toast({
        title: 'Error',
        description: 'No current project assigned. Please contact your supervisor.',
        variant: 'destructive',
      });
      return;
    }

    // Validation
    if (!supplier || !deliveryDate || !deliveryTime) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (items.some(item => !item.item || item.quantity < 1)) {
      toast({
        title: 'Invalid Items',
        description: 'Please ensure all items have names and quantities',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const requestId = `REQ-${Date.now()}`;
      
      const deliveryMethod = {
        pallets: parseInt(pallets) || 0,
        unloadMethod: unloadMethod || 'Manual'
      };
      
      const vehicleDetails = {
        type: vehicleType,
        supplier: vehicleSupplier,
        over35T,
        weight,
        forsNumber,
        color: vehicleColor
      };

      const { error } = await supabase
        .from('delivery_bookings')
        .insert({
          project_id: userProfile.currentproject,
          request_id: requestId,
          submitted_by: user.id,
          supplier,
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
          items_json: items as any,
          delivery_method: deliveryMethod as any,
          vehicle_details: vehicleDetails as any,
          notes,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Request Submitted Successfully!',
        description: `Delivery request ${requestId} has been submitted for approval`,
      });

      // Reset form
      setSupplier('');
      setDeliveryDate('');
      setDeliveryTime('');
      setItems([{ item: '', quantity: 1 }]);
      setNotes('');
      setPallets('');
      setUnloadMethod('');
      setVehicleType('');
      setVehicleSupplier('');
      setOver35T(false);
      setWeight('');
      setForsNumber('');
      setVehicleColor('');

    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit delivery request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile?.currentproject) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <Package className="h-4 w-4" />
            <AlertDescription>
              No project assigned. Please contact your supervisor to assign you to a project.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Request Delivery</h1>
            <p className="text-muted-foreground">
              Submit a new delivery request for project materials
            </p>
            {currentProject && (
              <div className="flex items-center gap-2 mt-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {currentProject.name} ({currentProject.code})
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Input
                    id="supplier"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g., AJ Ryan Suppliers Ltd"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Delivery Date *</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Preferred Delivery Time *</Label>
                <Select value={deliveryTime} onValueChange={setDeliveryTime} required>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select delivery time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">08:00 AM</SelectItem>
                    <SelectItem value="09:00">09:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="13:00">01:00 PM</SelectItem>
                    <SelectItem value="14:00">02:00 PM</SelectItem>
                    <SelectItem value="15:00">03:00 PM</SelectItem>
                    <SelectItem value="16:00">04:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items to Deliver</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Item Name</Label>
                    <Input
                      value={item.item}
                      onChange={(e) => updateItem(index, 'item', e.target.value)}
                      placeholder="e.g., DE6-ES"
                      required
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="mb-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Method */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pallets">Number of Pallets</Label>
                  <Input
                    id="pallets"
                    type="number"
                    min="0"
                    value={pallets}
                    onChange={(e) => setPallets(e.target.value)}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unloadMethod">Unload Method</Label>
                  <Select value={unloadMethod} onValueChange={setUnloadMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unload method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Forklift">Forklift</SelectItem>
                      <SelectItem value="Crane">Crane</SelectItem>
                      <SelectItem value="Pump">Pump</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7.5 ton rigid">7.5 ton rigid</SelectItem>
                      <SelectItem value="18 ton rigid">18 ton rigid</SelectItem>
                      <SelectItem value="26 ton rigid">26 ton rigid</SelectItem>
                      <SelectItem value="Articulated lorry">Articulated lorry</SelectItem>
                      <SelectItem value="Transit van">Transit van</SelectItem>
                      <SelectItem value="Luton van">Luton van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicleSupplier">Transport Supplier</Label>
                  <Input
                    id="vehicleSupplier"
                    value={vehicleSupplier}
                    onChange={(e) => setVehicleSupplier(e.target.value)}
                    placeholder="e.g., Transport Co"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="over35T"
                    checked={over35T}
                    onChange={(e) => setOver35T(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="over35T">Over 3.5T</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g., 18 ton"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicleColor">Vehicle Color</Label>
                  <Input
                    id="vehicleColor"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    placeholder="e.g., Silver"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forsNumber">FORS Number (if applicable)</Label>
                <Input
                  id="forsNumber"
                  value={forsNumber}
                  onChange={(e) => setForsNumber(e.target.value)}
                  placeholder="e.g., 004886"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special delivery instructions or requirements..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>All fields marked with * are required</span>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestDelivery;