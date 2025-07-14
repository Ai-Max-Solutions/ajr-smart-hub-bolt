import { useState, useRef } from 'react';
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
import { Camera, Upload, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CreatePODDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onPodCreated: () => void;
}

const CreatePODDialog = ({ open, onOpenChange, projectId, onPodCreated }: CreatePODDialogProps) => {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    pod_type: '',
    supplier_name: '',
    description: '',
    signed_by_name: '',
    damage_notes: ''
  });

  const resetForm = () => {
    setFormData({
      pod_type: '',
      supplier_name: '',
      description: '',
      signed_by_name: '',
      damage_notes: ''
    });
    setPhotoFile(null);
    setPhotoPreview(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Upload photo first if provided
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      // Create POD record
      const { error } = await supabase
        .from('pod_register')
        .insert({
          project_id: projectId,
          pod_type: formData.pod_type,
          supplier_name: formData.supplier_name,
          description: formData.description,
          signed_by_name: formData.signed_by_name,
          uploaded_by: profile.id,
          pod_photo_url: photoUrl,
          damage_notes: formData.damage_notes || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "POD Created",
        description: "Proof of delivery record has been uploaded successfully",
      });

      resetForm();
      onPodCreated();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Add Proof of Delivery</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                      className="w-full h-32 object-cover rounded-md"
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
                className="w-full h-32 border-dashed"
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

          {/* POD Type */}
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
                <SelectItem value="material_delivery">Material Delivery</SelectItem>
                <SelectItem value="site_delivery">Site Equipment Delivery</SelectItem>
                <SelectItem value="welfare_delivery">Welfare Unit Delivery</SelectItem>
                <SelectItem value="tool_delivery">Tool/Plant Delivery</SelectItem>
                <SelectItem value="collection">Collection</SelectItem>
                <SelectItem value="off_hire">Off-Hire Return</SelectItem>
                <SelectItem value="equipment_return">Equipment Return</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier_name">Supplier/Company *</Label>
            <Input
              id="supplier_name"
              value={formData.supplier_name}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
              placeholder="e.g., MEP Hire Ltd"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={formData.pod_type.includes('delivery') ? "e.g., 50x 110mm soil pipes, 20x 90° bends" : "Brief description of items delivered/collected"}
              required
              rows={3}
            />
          </div>

          {/* Signed By */}
          <div className="space-y-2">
            <Label htmlFor="signed_by_name">Signed By</Label>
            <Input
              id="signed_by_name"
              value={formData.signed_by_name}
              onChange={(e) => setFormData(prev => ({ ...prev, signed_by_name: e.target.value }))}
              placeholder="Person who signed the POD"
            />
          </div>

          {/* Damage Notes */}
          <div className="space-y-2">
            <Label htmlFor="damage_notes">Damage/Issues (if any)</Label>
            <Textarea
              id="damage_notes"
              value={formData.damage_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, damage_notes: e.target.value }))}
              placeholder="Any damage or issues noted"
              rows={2}
            />
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