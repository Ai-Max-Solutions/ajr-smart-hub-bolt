import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeliveryItem {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface DeliveryRequestFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

export const DeliveryRequestForm: React.FC<DeliveryRequestFormProps> = ({ onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    project_name: '',
    delivery_date: '',
    time_slot: '',
    delivery_address: '',
    contact_person: '',
    contact_phone: '',
    special_instructions: '',
    urgency: 'normal'
  });
  
  const [items, setItems] = useState<DeliveryItem[]>([
    { name: '', quantity: 1, unit: 'pieces', notes: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const timeSlots = [
    '08:00-10:00',
    '10:00-12:00',
    '12:00-14:00',
    '14:00-16:00',
    '16:00-18:00'
  ];

  const units = [
    'pieces',
    'meters',
    'kg',
    'liters',
    'boxes',
    'rolls',
    'sheets',
    'lengths'
  ];

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unit: 'pieces', notes: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof DeliveryItem, value: any) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.project_name || !formData.delivery_date || !formData.time_slot) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      if (items.some(item => !item.name || item.quantity <= 0)) {
        toast({
          title: "Validation Error", 
          description: "Please complete all item details",
          variant: "destructive"
        });
        return;
      }

      // Generate request number
      const requestNumber = `DEL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const requestData = {
        ...formData,
        request_number: requestNumber,
        items: items.filter(item => item.name), // Remove empty items
        total_items: items.filter(item => item.name).length,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Submit request
      onSubmit(requestData);
      
      toast({
        title: "Request Submitted",
        description: `Delivery request ${requestNumber} has been submitted for approval`,
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit delivery request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold contractor-accent-text">New Delivery Request</h1>
          <p className="text-muted-foreground">Submit a new delivery booking request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Details */}
          <Card className="contractor-card">
            <CardHeader>
              <CardTitle className="contractor-accent-text">Delivery Details</CardTitle>
              <CardDescription>Basic information about your delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name *</Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="delivery_date"
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                      min={minDate}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_slot">Time Slot *</Label>
                  <Select 
                    value={formData.time_slot} 
                    onValueChange={(value) => setFormData({...formData, time_slot: value})}
                  >
                    <SelectTrigger>
                      <Clock className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_address">Delivery Address *</Label>
                <Textarea
                  id="delivery_address"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                  placeholder="Enter full delivery address including postcode"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select 
                  value={formData.urgency} 
                  onValueChange={(value) => setFormData({...formData, urgency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Standard delivery</SelectItem>
                    <SelectItem value="normal">Normal - Within 3-5 days</SelectItem>
                    <SelectItem value="high">High - Within 1-2 days</SelectItem>
                    <SelectItem value="urgent">Urgent - Same/next day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="contractor-card">
            <CardHeader>
              <CardTitle className="contractor-accent-text">Contact Information</CardTitle>
              <CardDescription>On-site contact details for delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  placeholder="Name of person on-site"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder="Phone number for delivery day"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_instructions">Special Instructions</Label>
                <Textarea
                  id="special_instructions"
                  value={formData.special_instructions}
                  onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                  placeholder="Access instructions, parking notes, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items to Deliver */}
        <Card className="contractor-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="contractor-accent-text">Items to Deliver</CardTitle>
                <CardDescription>List all items that need to be delivered</CardDescription>
              </div>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                  <div className="md:col-span-2">
                    <Label htmlFor={`item_name_${index}`}>Item Name *</Label>
                    <Input
                      id={`item_name_${index}`}
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`item_quantity_${index}`}>Quantity *</Label>
                    <Input
                      id={`item_quantity_${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`item_unit_${index}`}>Unit</Label>
                    <Select 
                      value={item.unit} 
                      onValueChange={(value) => updateItem(index, 'unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`item_notes_${index}`}>Notes</Label>
                    <Input
                      id={`item_notes_${index}`}
                      value={item.notes || ''}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      placeholder="Optional notes"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="contractor-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};