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
  const [uploadError, setUploadError] = useState('');
  const [isCustomType, setIsCustomType] = useState(false);
  const [showGoldSubtype, setShowGoldSubtype] = useState(false);
  const [goldSubtype, setGoldSubtype] = useState('');
  
  // CSCS card type options with colors
  const cardTypes = [
    { value: 'Labourer', label: 'Labourer (Green)', color: '#00A650' },
    { value: 'Apprentice', label: 'Apprentice (Red)', color: '#D71920' },
    { value: 'Trainee', label: 'Trainee (Red)', color: '#D71920' },
    { value: 'Experienced Worker', label: 'Experienced Worker (Red)', color: '#D71920' },
    { value: 'Experienced Technical/Supervisor/Manager', label: 'Experienced Technical/Supervisor/Manager (Red)', color: '#D71920' },
    { value: 'Skilled Worker', label: 'Skilled Worker (Blue)', color: '#0072CE' },
    { value: 'Gold', label: 'Gold (Requires Specification)', color: '#FFD700' },
    { value: 'Academically Qualified Person', label: 'Academically Qualified Person (White)', color: '#FFFFFF' },
    { value: 'Professionally Qualified Person', label: 'Professionally Qualified Person (White)', color: '#FFFFFF' },
    { value: 'Manager', label: 'Manager (Black)', color: '#000000' },
    { value: 'Operative', label: 'Operative (Default)', color: '#00A650' },
    { value: 'Other', label: 'Other (Custom)', color: '#666666' }
  ];

  const goldSubtypes = [
    { value: 'Advanced Craft', label: 'Advanced Craft' },
    { value: 'Supervisor', label: 'Supervisor' }
  ];

  // File validation
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'File must be PDF, JPG or PNG, max 5MB.';
    }

    if (file.size > maxSize) {
      return 'File must be PDF, JPG or PNG, max 5MB.';
    }

    return null;
  };

  const handleImageUpload = useCallback(async (file: File, side: 'front' | 'back') => {
    try {
      setUploadError('');
      
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }
      
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
          .from('cards')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
        
        // Get signed URL for private bucket
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('cards')
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
          
        console.log('Analysis response:', { analysis, analysisError });
          
        if (analysisError) {
          console.error('Analysis error details:', {
            message: analysisError.message,
            details: analysisError.details,
            hint: analysisError.hint,
            code: analysisError.code
          });
          
          // Check if it's an API key issue
          if (analysisError.message?.includes('API key')) {
            throw new Error('AI API key not configured. Please check your Supabase edge function secrets.');
          }
          
          throw new Error(`Analysis failed: ${analysisError.message}`);
        }
        
        if (analysis?.success) {
          const result = analysis.analysis;
          setAnalysisResult(result);
          
          // Auto-populate form fields - default to Operative if AI doesn't know
          updateData({
            number: result.card_number || data.number,
            expiryDate: result.expiry_date ? formatDateForInput(result.expiry_date) : data.expiryDate,
            cardType: result.card_type || data.cardType || 'Operative'
          });
          
          onAnalysisComplete?.(result);
          
          toast({
            title: "CSCS Card Analyzed",
            description: `Successfully extracted details from your CSCS card`,
          });
        }
      }
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

  const formatCardNumber = (value: string) => {
    // Remove all non-digits and format as groups of 4
    const digits = value.replace(/\D/g, '');
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const handleCardTypeChange = (value: string) => {
    if (value === 'Other') {
      setIsCustomType(true);
      setShowGoldSubtype(false);
      updateData({ cardType: '' });
    } else if (value === 'Gold') {
      setIsCustomType(false);
      setShowGoldSubtype(true);
      setGoldSubtype('');
      updateData({ cardType: '' }); // Will be set when subtype is selected
    } else {
      setIsCustomType(false);
      setShowGoldSubtype(false);
      updateData({ cardType: value });
    }
  };

  const handleGoldSubtypeChange = (value: string) => {
    setGoldSubtype(value);
    updateData({ cardType: `Gold – ${value}` });
  };

  const validateForm = (): string | null => {
    if (!data.frontImage) return 'Please upload a CSCS card image.';
    if (!data.cardType) return 'Please select a card type.';
    if (isCustomType && !data.cardType.trim()) return 'Please enter a custom card type.';
    if (showGoldSubtype && !goldSubtype) return 'Please select Advanced Craft or Supervisor for Gold card.';
    if (!data.number) return 'Please enter the card number.';
    if (!data.expiryDate) return 'Please enter the expiry date.';
    return null;
  };

  const handleSaveCard = async () => {
    try {
      const validationError = validateForm();
      if (validationError) {
        toast({
          title: "Validation Error",
          description: validationError,
          variant: "destructive",
        });
        return;
      }

      // Get color hex based on card type
      const cardTypeObj = cardTypes.find(type => type.value === data.cardType);
      const colourHex = cardTypeObj?.color || '#666666';

      // Insert into cscs_cards table
      const { error } = await supabase
        .from('cscs_cards')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          file_url: data.frontImage ? URL.createObjectURL(data.frontImage) : '',
          cscs_card_type: data.cardType,
          colour: colourHex,
          custom_card_type: isCustomType ? data.cardType : null,
          expiry_date: data.expiryDate || null,
          card_number: data.number || null
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Card added successfully.",
      });

      // Reset form
      updateData({
        number: '',
        expiryDate: '',
        cardType: '',
        frontImage: undefined,
        backImage: undefined
      });
      setIsCustomType(false);
      setShowGoldSubtype(false);
      setGoldSubtype('');

    } catch (error) {
      console.error('Error saving card:', error);
      toast({
        title: "Upload Failed",
        description: "Upload failed, please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <CreditCard className="h-5 w-5" />
          Upload CSCS Card
          {required && <span className="text-destructive">*</span>}
        </CardTitle>
        <CardDescription>
          Upload your CSCS card image and select your card type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front-image" className="flex items-center gap-2 text-primary">
              <Camera className="h-4 w-4" />
              Upload CSCS Card {required && <span className="text-destructive">*</span>}
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
              <input
                id="front-image"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
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
                    <p className="text-sm text-primary font-medium">Click to upload CSCS card</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 5MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <Alert className="border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-destructive font-medium">
                {uploadError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Card Type Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-type" className="text-primary">
              Select Card Type {required && <span className="text-destructive">*</span>}
            </Label>
            <Select 
              value={isCustomType ? 'Other' : showGoldSubtype ? 'Gold' : data.cardType} 
              onValueChange={handleCardTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your CSCS card type (defaults to Operative)" />
              </SelectTrigger>
              <SelectContent>
                {cardTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border" 
                        style={{ backgroundColor: type.color, borderColor: type.color === '#FFFFFF' ? '#ccc' : type.color }}
                      />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gold Subtype Selection */}
          {showGoldSubtype && (
            <div className="space-y-2">
              <Label htmlFor="gold-subtype" className="text-primary">
                Specify Gold Type {required && <span className="text-destructive">*</span>}
              </Label>
              <Select value={goldSubtype} onValueChange={handleGoldSubtypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Advanced Craft or Supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {goldSubtypes.map((subtype) => (
                    <SelectItem key={subtype.value} value={subtype.value}>
                      {subtype.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Type Input */}
          {isCustomType && (
            <div className="space-y-2">
              <Label htmlFor="custom-type" className="text-primary">
                Enter Custom Card Type {required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="custom-type"
                placeholder="Enter the exact text from your card (e.g., Mate, Skilled Worker, etc.)"
                value={data.cardType}
                onChange={(e) => updateData({ cardType: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Analysis Result */}
        {analysisResult && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Analysis:</strong> Successfully analyzed your CSCS card
              {analysisResult.confidence_score && ` (${Math.round(analysisResult.confidence_score * 100)}% confidence)`}
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="card-number" className="text-primary">
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
            <Label htmlFor="expiry-date" className="text-primary">
              Expiry Date {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="expiry-date"
              type="date"
              value={data.expiryDate}
              onChange={(e) => updateData({ expiryDate: e.target.value })}
            />
          </div>
        </div>

        {/* Save Card Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSaveCard}
            className="bg-accent text-primary hover:bg-accent/90"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Processing...' : 'Save Card'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};