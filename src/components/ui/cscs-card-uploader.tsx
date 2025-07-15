import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, CheckCircle, AlertCircle, Camera, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSCSCardData {
  number: string;
  expiryDate: string;
  cardType: string;
  frontImage?: File;
  backImage?: File;
}

interface CSCSCardUploaderProps {
  data: CSCSCardData;
  updateData: (data: Partial<CSCSCardData>) => void;
  onAnalysisComplete?: (analysis: any) => void;
  required?: boolean;
}

export const CSCSCardUploader: React.FC<CSCSCardUploaderProps> = ({
  data,
  updateData,
  onAnalysisComplete,
  required = false
}) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Get current user ID
  const userId = supabase.auth.getUser().then(({ data }) => data.user?.id);

  const cardTypes = [
    'Green - Labourer',
    'Blue - Skilled Worker',
    'Yellow - Supervisor', 
    'White - Trainee',
    'Black - Manager',
    'Gold - Academically Qualified'
  ];

  const handleImageUpload = useCallback(async (file: File, side: 'front' | 'back') => {
    try {
      setUploadProgress(0);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Update the form data
      updateData({ [`${side}Image`]: file });
      
      // Only analyze the front image
      if (side === 'front') {
        setIsAnalyzing(true);
        
        // Upload to Supabase Storage with proper user folder structure
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-front.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cscs-cards')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
        
        // Get signed URL for private bucket
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('cscs-cards')
          .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
          
        if (urlError) {
          console.error('Signed URL error:', urlError);
          throw new Error(`Failed to create signed URL: ${urlError.message}`);
        }
        
        const imageUrl = signedUrlData.signedUrl;
          
        // Call AI analysis function
        console.log('Calling CSCS card analyzer with URL:', imageUrl);
        const { data: analysis, error: analysisError } = await supabase.functions
          .invoke('cscs-card-analyzer', {
            body: { imageUrl }
          });
          
        if (analysisError) {
          console.error('Analysis error:', analysisError);
          throw new Error(`Analysis failed: ${analysisError.message}`);
        }
        
        if (analysis?.success) {
          const result = analysis.analysis;
          setAnalysisResult(result);
          
          // Auto-populate form fields
          updateData({
            number: result.card_number || data.number,
            expiryDate: result.expiry_date ? formatDateForInput(result.expiry_date) : data.expiryDate,
            cardType: mapColorToType(result.card_color, result.card_type) || data.cardType
          });
          
          onAnalysisComplete?.(result);
          
          toast({
            title: "CSCS Card Analyzed",
            description: `Successfully extracted details from your ${result.card_color} CSCS card`,
          });
        }
      }
      
      setUploadProgress(100);
    } catch (error) {
      console.error('Error analyzing CSCS card:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Analysis Failed",
        description: `Failed to analyze the card: ${errorMessage}. Please enter details manually.`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  }, [data, updateData, onAnalysisComplete, toast]);

  const formatDateForInput = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  const mapColorToType = (color: string, type: string) => {
    if (!color) return type;
    
    const colorLower = color.toLowerCase();
    if (colorLower.includes('green')) return 'Green - Labourer';
    if (colorLower.includes('blue')) return 'Blue - Skilled Worker';
    if (colorLower.includes('yellow')) return 'Yellow - Supervisor';
    if (colorLower.includes('white')) return 'White - Trainee';
    if (colorLower.includes('black')) return 'Black - Manager';
    if (colorLower.includes('gold')) return 'Gold - Academically Qualified';
    
    return type;
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits and format as groups of 4
    const digits = value.replace(/\D/g, '');
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          CSCS Card Details
          {required && <span className="text-destructive">*</span>}
        </CardTitle>
        <CardDescription>
          Upload your CSCS card image and we'll automatically extract the details for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Front Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="front-image" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Front of Card {required && <span className="text-destructive">*</span>}
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
              <input
                id="front-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'front');
                }}
                className="hidden"
              />
              <label htmlFor="front-image" className="cursor-pointer">
                {isAnalyzing ? (
                  <div className="space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Analyzing card...</p>
                  </div>
                ) : data.frontImage ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                    <p className="text-sm font-medium">{data.frontImage.name}</p>
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload front of CSCS card</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Back Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="back-image" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Back of Card (Optional)
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors">
              <input
                id="back-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'back');
                }}
                className="hidden"
              />
              <label htmlFor="back-image" className="cursor-pointer">
                {data.backImage ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                    <p className="text-sm font-medium">{data.backImage.name}</p>
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload back of CSCS card</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Analysis Result */}
        {analysisResult && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Analysis:</strong> Detected {analysisResult.card_color} {analysisResult.card_type} card
              {analysisResult.confidence_score && ` (${Math.round(analysisResult.confidence_score * 100)}% confidence)`}
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="card-number">
              Card Number {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="card-number"
              placeholder="1234 5678 9012 3456"
              value={data.number}
              onChange={(e) => updateData({ number: formatCardNumber(e.target.value) })}
              maxLength={19}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-date">
              Expiry Date {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="expiry-date"
              type="date"
              value={data.expiryDate}
              onChange={(e) => updateData({ expiryDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-type">
              Card Type {required && <span className="text-destructive">*</span>}
            </Label>
            <Select value={data.cardType} onValueChange={(value) => updateData({ cardType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select card type" />
              </SelectTrigger>
              <SelectContent>
                {cardTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Qualifications Display */}
        {analysisResult?.qualifications && (
          <div className="space-y-2">
            <Label>Detected Qualifications</Label>
            <div className="p-3 bg-accent/50 rounded-lg">
              <p className="font-medium">{analysisResult.qualifications.primary_qualification}</p>
              {analysisResult.qualifications.work_categories?.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Work Categories: {analysisResult.qualifications.work_categories.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};