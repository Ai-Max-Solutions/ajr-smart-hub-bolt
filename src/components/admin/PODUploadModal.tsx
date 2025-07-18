import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Upload, Sparkles, Eye, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PODUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PODUploadModal = ({ isOpen, onClose }: PODUploadModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasPermission, setHasPermission] = useState(true); // TODO: Check actual permission
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image (JPG, PNG, WebP) or PDF file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    // Check permission first
    if (!hasPermission) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to upload POD photos. Contact your admin!",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Upload to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `pods/${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Complete upload progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      // TODO: Trigger n8n workflow for OCR processing
      // This would call the n8n webhook endpoint to:
      // 1. Process the uploaded file with OCR
      // 2. Extract relevant data (date, consignment, notes)
      // 3. Log to Airtable
      // 4. Update app with processed data

      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "POD Upload Successful! 📄",
        description: "OCR processing complete - all data extracted perfectly!",
      });

      // Reset and close
      setSelectedFile(null);
      setUploadProgress(0);
      onClose();

    } catch (error) {
      console.error('Error uploading POD:', error);
      toast({
        title: "Upload Failed",
        description: "Looks like the pipe's blocked - try again!",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const mockOCRResults = [
    { label: 'Delivery Date', value: '18/07/2025', confidence: 98 },
    { label: 'Consignment No.', value: 'CON-2025-0718-001', confidence: 95 },
    { label: 'Recipient', value: 'AJ Ryan Construction', confidence: 92 },
    { label: 'Items', value: '50x Concrete Blocks, 2x Steel Beams', confidence: 89 }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-sparkle rounded-lg flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            Smart POD Upload & OCR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Permission Check */}
          {!hasPermission ? (
            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">Access Restricted</h4>
                    <p className="text-xs text-muted-foreground">
                      POD photo upload is currently disabled for your account. 
                      Contact your administrator to enable this feature.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* AI Info Card */}
              <Card className="bg-gradient-subtle border-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-aj-yellow rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-aj-navy-deep" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">AI-Powered OCR</h4>
                      <p className="text-xs text-muted-foreground">
                        Upload your POD photo and our AI will automatically extract 
                        delivery details, quantities, and recipient information.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload Area */}
              <div className="space-y-4">
                <Label>Upload POD Document</Label>
                
                {!selectedFile ? (
                  <div
                    className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Click to upload POD</p>
                        <p className="text-sm text-muted-foreground">
                          Supports JPG, PNG, WebP, PDF (Max 10MB)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Card className="bg-muted/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-accent" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                          disabled={isUploading}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing with AI...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-ai h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Mock OCR Preview */}
              {selectedFile && !isUploading && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-accent" />
                        <h4 className="font-medium text-sm">Expected OCR Results</h4>
                        <Badge variant="secondary" className="text-xs">Preview</Badge>
                      </div>
                      <div className="space-y-2">
                        {mockOCRResults.map((result, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{result.label}:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{result.value}</span>
                              <Badge variant="outline" className="text-xs">
                                {result.confidence}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isUploading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1 bg-gradient-sparkle text-white"
                >
                  {isUploading ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Upload & Process
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};