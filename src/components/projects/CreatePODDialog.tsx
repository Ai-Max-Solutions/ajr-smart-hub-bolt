import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Upload, X, Package, Truck, PenTool } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SignatureCanvas } from '@/components/ui/signature-canvas';

interface CreatePODDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onPodCreated: () => void;
}

interface PODFormData {
  pod_type: string;
  pod_category: 'DELIVERY' | 'HIRE_RETURN';
  supplier_name: string;
  description: string;
  signed_by_name: string;
  damage_notes: string;
  plot_location: string;
  order_reference: string;
  hire_item_id: string;
  quantity_expected: string;
  quantity_received: string;
  condition_on_arrival: 'good' | 'damaged' | 'incomplete';
  discrepancy_value: string;
  supplier_contact: string;
  delivery_method: string;
}

const CreatePODDialog = ({ open, onOpenChange, projectId, onPodCreated }: CreatePODDialogProps) => {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showSignatureCapture, setShowSignatureCapture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<PODFormData>({
    pod_type: '',
    pod_category: 'DELIVERY',
    supplier_name: '',
    description: '',
    signed_by_name: '',
    damage_notes: '',
    plot_location: '',
    order_reference: '',
    hire_item_id: '',
    quantity_expected: '',
    quantity_received: '',
    condition_on_arrival: 'good',
    discrepancy_value: '',
    supplier_contact: '',
    delivery_method: ''
  });

  // Auto-set category based on POD type
  useEffect(() => {
    const deliveryTypes = ['material_delivery', 'site_delivery', 'welfare_delivery', 'tool_delivery'];
    const hireTypes = ['collection', 'off_hire', 'equipment_return'];
    
    if (deliveryTypes.includes(formData.pod_type)) {
      setFormData(prev => ({ ...prev, pod_category: 'DELIVERY' }));
    } else if (hireTypes.includes(formData.pod_type)) {
      setFormData(prev => ({ ...prev, pod_category: 'HIRE_RETURN' }));
    }
  }, [formData.pod_type]);

  const resetForm = () => {
    setFormData({
      pod_type: '',
      pod_category: 'DELIVERY',
      supplier_name: '',
      description: '',
      signed_by_name: '',
      damage_notes: '',
      plot_location: '',
      order_reference: '',
      hire_item_id: '',
      quantity_expected: '',
      quantity_received: '',
      condition_on_arrival: 'good',
      discrepancy_value: '',
      supplier_contact: '',
      delivery_method: ''
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setSignatureData(null);
    setShowSignatureCapture(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select a photo under 10MB",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !profile?.id) return null;

    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('pod-photos')
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pod-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pod_type || !formData.supplier_name || !formData.description) return;
    
    // Show signature capture as the final step
    setShowSignatureCapture(true);
  };

  const handleSignatureCapture = (signature: string) => {
    setSignatureData(signature);
    setShowSignatureCapture(false);
    // Proceed with final POD creation
    createPODWithSignature(signature);
  };

  const createPODWithSignature = async (signature: string) => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Get user's current location for signature verification
      let location = null;
      try {
        if (navigator.geolocation) {
          location = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
        }
      } catch (error) {
        console.warn('Could not get location:', error);
      }

      // Upload photo first if provided
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      // Calculate discrepancy value
      const discrepancyValue = formData.discrepancy_value ? parseFloat(formData.discrepancy_value) : 0;

      // Create POD record with all new fields
      const { data: podData, error: podError } = await supabase
        .from('pod_register')
        .insert({
          project_id: projectId,
          pod_type: formData.pod_type,
          pod_category: formData.pod_category,
          supplier_name: formData.supplier_name,
          description: formData.description,
          signed_by_name: formData.signed_by_name || null,
          uploaded_by: profile.id,
          pod_photo_url: photoUrl,
          damage_notes: formData.damage_notes || null,
          plot_location: formData.plot_location || null,
          order_reference: formData.order_reference || null,
          hire_item_id: formData.hire_item_id || null,
          quantity_expected: formData.quantity_expected ? parseFloat(formData.quantity_expected) : null,
          quantity_received: formData.quantity_received ? parseFloat(formData.quantity_received) : null,
          condition_on_arrival: formData.condition_on_arrival,
          discrepancy_value: discrepancyValue,
          supplier_contact: formData.supplier_contact || null,
          delivery_method: formData.delivery_method || null,
          status: 'pending'
        })
        .select()
        .single();

      if (podError) throw podError;

      // Create signature record
      const { error: signatureError } = await supabase
        .from('pod_signatures')
        .insert({
          pod_id: podData.id,
          user_id: profile.id,
          signature_type: 'creation',
          signature_data: signature,
          location_lat: location?.coords.latitude || null,
          location_lng: location?.coords.longitude || null,
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timestamp: new Date().toISOString()
          },
          signature_context: {
            pod_type: formData.pod_type,
            pod_category: formData.pod_category,
            supplier_name: formData.supplier_name,
            plot_location: formData.plot_location,
            project_id: projectId
          }
        });

      if (signatureError) throw signatureError;

      toast({
        title: "POD Created & Signed",
        description: "Proof of delivery record has been uploaded and digitally signed",
      });

      resetForm();
      onPodCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating POD:', error);
      toast({
        title: "Error",
        description: "Failed to create POD record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isDelivery = formData.pod_category === 'DELIVERY';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isDelivery ? <Package className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
            <span>Add {isDelivery ? 'Delivery' : 'Collection'} POD</span>
          </DialogTitle>
        </DialogHeader>

        {/* Signature Capture Modal */}
        {showSignatureCapture && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center space-x-2 mb-4">
                <PenTool className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Digital Signature Required</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Please sign to confirm the accuracy of this POD record
              </p>
              <SignatureCanvas
                onSignature={handleSignatureCapture}
                onCancel={() => setShowSignatureCapture(false)}
                title="POD Creation Signature"
              />
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>POD Photo *</Label>
            {photoPreview ? (
              <Card>
                <CardContent className="p-3">
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="POD Preview" 
                      className="w-full h-40 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-40 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Take or Upload Photo</p>
                </div>
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* POD Type Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pod_type">POD Type *</Label>
              <Select 
                value={formData.pod_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, pod_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select POD type" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">DELIVERIES</div>
                  <SelectItem value="material_delivery">Material Delivery</SelectItem>
                  <SelectItem value="site_delivery">Site Equipment Delivery</SelectItem>
                  <SelectItem value="welfare_delivery">Welfare Unit Delivery</SelectItem>
                  <SelectItem value="tool_delivery">Tool/Plant Delivery</SelectItem>
                  <Separator className="my-2" />
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">COLLECTIONS</div>
                  <SelectItem value="collection">Collection</SelectItem>
                  <SelectItem value="off_hire">Off-Hire Return</SelectItem>
                  <SelectItem value="equipment_return">Equipment Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Supplier/Company *</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                placeholder={isDelivery ? "e.g., Travis Perkins" : "e.g., MEP Hire Ltd"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plot_location">Plot/Location</Label>
              <Input
                id="plot_location"
                value={formData.plot_location}
                onChange={(e) => setFormData(prev => ({ ...prev, plot_location: e.target.value }))}
                placeholder="e.g., Level 2 - Plot 2.04"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={isDelivery ? 
                "e.g., 50x 110mm soil pipes, 20x 90° bends, fittings as per order #12345" : 
                "Brief description of items collected/returned"
              }
              required
              rows={3}
            />
          </div>

          {/* Conditional Fields Based on Category */}
          {isDelivery ? (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">DELIVERY DETAILS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order_reference">Order Reference</Label>
                  <Input
                    id="order_reference"
                    value={formData.order_reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, order_reference: e.target.value }))}
                    placeholder="e.g., PO-12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_method">Delivery Method</Label>
                  <Select 
                    value={formData.delivery_method} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crane_offload">Crane Offload</SelectItem>
                      <SelectItem value="forklift">Forklift</SelectItem>
                      <SelectItem value="manual">Manual Handling</SelectItem>
                      <SelectItem value="direct_drop">Direct Drop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity_expected">Quantity Expected</Label>
                  <Input
                    id="quantity_expected"
                    type="number"
                    step="0.01"
                    value={formData.quantity_expected}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity_expected: e.target.value }))}
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity_received">Quantity Received</Label>
                  <Input
                    id="quantity_received"
                    type="number"
                    step="0.01"
                    value={formData.quantity_received}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity_received: e.target.value }))}
                    placeholder="e.g., 48"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">COLLECTION DETAILS</h3>
              <div className="space-y-2">
                <Label htmlFor="hire_item_id">Hire Item Reference</Label>
                <Input
                  id="hire_item_id"
                  value={formData.hire_item_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, hire_item_id: e.target.value }))}
                  placeholder="Link to on-hire record"
                />
              </div>
            </div>
          )}

          {/* Condition and Issues */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition_on_arrival">Condition</Label>
                <Select 
                  value={formData.condition_on_arrival} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, condition_on_arrival: value as 'good' | 'damaged' | 'incomplete' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good Condition</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="incomplete">Incomplete/Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.condition_on_arrival !== 'good' && (
                <div className="space-y-2">
                  <Label htmlFor="discrepancy_value">Discrepancy Value (£)</Label>
                  <Input
                    id="discrepancy_value"
                    type="number"
                    step="0.01"
                    value={formData.discrepancy_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, discrepancy_value: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {formData.condition_on_arrival !== 'good' && (
              <div className="space-y-2">
                <Label htmlFor="damage_notes">Damage/Issues Details *</Label>
                <Textarea
                  id="damage_notes"
                  value={formData.damage_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, damage_notes: e.target.value }))}
                  placeholder="Describe the damage, shortage, or issues in detail"
                  rows={3}
                  required={formData.condition_on_arrival === 'damaged' || formData.condition_on_arrival === 'incomplete'}
                />
              </div>
            )}
          </div>

          {/* Contact & Signature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signed_by_name">Signed By</Label>
              <Input
                id="signed_by_name"
                value={formData.signed_by_name}
                onChange={(e) => setFormData(prev => ({ ...prev, signed_by_name: e.target.value }))}
                placeholder="Person who signed the POD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_contact">Supplier Contact</Label>
              <Input
                id="supplier_contact"
                value={formData.supplier_contact}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_contact: e.target.value }))}
                placeholder="Driver/delivery contact"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.pod_type || !formData.supplier_name || !formData.description}
              className="flex-1 bg-[#1d1e3d] hover:bg-[#1d1e3d]/90"
            >
              {loading ? 'Uploading...' : 'Save POD'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePODDialog;