
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, CheckCircle, AlertCircle, Camera, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CSCSCardTypeMapper } from '@/components/ui/cscs-card-type-mapper';
import { DevJsonPreview } from '@/components/ui/dev-json-preview';

interface CSCSCardData {
  number: string;
  expiryDate: string;
  cardType: string;
  frontImage?: File;
  backImage?: File;
  uploadComplete?: boolean;
}

interface CSCSCardUploaderProps {
  data: CSCSCardData;
  updateData: (data: Partial<CSCSCardData>) => void;
  onAnalysisComplete?: (analysis: any) => void;
  required?: boolean;
}

interface AIAnalysisResult {
  cardNumber: string | null;
  cardType: string | null;
  cardSubtype: string | null;
  expiryDate: string | null;
  confidence: number;
  detectedText: string;
}

export const CSCSCardUploader: React.FC<CSCSCardUploaderProps> = ({
  data,
  updateData,
  onAnalysisComplete,
  required = false
}) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [cardNumberError, setCardNumberError] = useState('');
  
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

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]); // Just the base64
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file); // Converts to data:image/...;base64,...
    });
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
        
        try {
          // Convert file to base64 for AI analysis
          console.log('Converting file to base64 for analysis...');
          const base64Image = await fileToBase64(file);
          
          // Call enhanced AI analysis function with base64 data
          console.log('Calling enhanced CSCS card analyzer...');
          const { data: analysis, error: analysisError } = await supabase.functions
            .invoke('cscs-card-analyzer', {
              body: { base64Image }
            });
            
          console.log('Enhanced analysis response:', { analysis, analysisError });
            
          if (analysisError) {
            console.error('Analysis error:', analysisError);
            throw new Error(`Analysis failed: ${analysisError.message}`);
          }
          
          // Handle successful analysis with enhanced data structure
          if (analysis) {
            setAnalysisResult(analysis);
            
            // Map AI detected card type to our dropdown values
            let mappedCardType = data.cardType;
            if (analysis.cardSubtype) {
              mappedCardType = analysis.cardSubtype;
            } else if (analysis.cardType) {
              // Map color to default type
              const colorToTypeMap: Record<string, string> = {
                'Green': 'Labourer',
                'Blue': 'Skilled Worker',
                'Red': 'Apprentice',
                'Gold': 'Advanced Craft',
                'White': 'Academically Qualified',
                'Black': 'Manager',
                'Yellow': 'Visitor'
              };
              mappedCardType = colorToTypeMap[analysis.cardType] || mappedCardType;
            }
            
            // Auto-populate form fields with confidence-based decisions
            const updates: Partial<CSCSCardData> = {
              uploadComplete: true
            };
            
            if (analysis.cardNumber && analysis.confidence > 0.5) {
              updates.number = analysis.cardNumber;
            }
            
            if (analysis.expiryDate && analysis.confidence > 0.5) {
              updates.expiryDate = analysis.expiryDate;
            }
            
            if (mappedCardType && analysis.confidence > 0.3) {
              updates.cardType = mappedCardType;
            }
            
            updateData(updates);
            onAnalysisComplete?.(analysis);
            
            // Enhanced toast with confidence information
            const confidenceText = analysis.confidence >= 0.8 ? 'high confidence' : 
                                 analysis.confidence >= 0.5 ? 'medium confidence' : 'low confidence';
            
            toast({
              title: "CSCS Card Analyzed",
              description: `Successfully analyzed your card with ${confidenceText} (${Math.round(analysis.confidence * 100)}%)`,
            });
          } else {
            // Analysis completed but no data extracted
            updateData({ uploadComplete: true });
            
            toast({
              title: "Card Uploaded",
              description: "Please fill in the card details manually below",
              variant: "default"
            });
          }
          
          // Upload to storage for permanent storage after successful analysis
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-front.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          await supabase.storage
            .from('cards')
            .upload(filePath, file);
            
        } catch (analysisError) {
          console.error('Analysis failed:', analysisError);
          
          // Still allow manual entry even if analysis fails
          updateData({ uploadComplete: true });
          
          toast({
            title: "Analysis failed",
            description: "Please enter your card details manually below.",
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing CSCS card:', error);
      
      // Set upload as complete even if analysis fails, allowing manual entry
      updateData({ uploadComplete: true });
      
      toast({
        title: "Card analysis failed",
        description: "Please enter your card details manually below.",
        variant: "default"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [data, updateData, onAnalysisComplete, toast]);

  const formatCardNumber = (value: string) => {
    // Remove all non-alphanumeric characters for display
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
    // Add spaces every 4 characters for display only
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 19); // Max 16 chars + 3 spaces
  };

  const validateCardNumber = (value: string): string | null => {
    // Remove spaces and non-alphanumeric for validation
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
    
    if (cleaned.length < 8) {
      return 'Card number must be at least 8 characters.';
    }
    
    if (cleaned.length > 16) {
      return 'Card number must be no more than 16 characters.';
    }
    
    return null;
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    updateData({ number: formatted });
    
    // Clear previous error and validate
    setCardNumberError('');
    if (value.trim()) {
      const error = validateCardNumber(formatted);
      if (error) {
        setCardNumberError(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CreditCard className="h-5 w-5" />
            Upload CSCS Card
            {required && <span className="text-destructive">*</span>}
          </CardTitle>
          <CardDescription>
            Upload your CSCS card image for automatic analysis and verification
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
                      <p className="text-sm text-muted-foreground">Analyzing card with AI...</p>
                      <p className="text-xs text-muted-foreground">This may take a few seconds</p>
                    </div>
                  ) : data.uploadComplete ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                      <p className="text-sm font-medium text-green-600">✅ Card Uploaded & Analyzed</p>
                      <p className="text-xs text-muted-foreground">Click to change</p>
                      {analysisResult && (
                        <p className="text-xs text-muted-foreground">
                          Confidence: {Math.round(analysisResult.confidence * 100)}%
                        </p>
                      )}
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
                      <p className="text-xs text-muted-foreground">AI will automatically extract details</p>
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

          {/* Enhanced Card Type Selection */}
          <CSCSCardTypeMapper
            selectedType={data.cardType}
            onTypeChange={(value) => updateData({ cardType: value })}
            aiDetectedType={analysisResult?.cardType || undefined}
            aiConfidence={analysisResult?.confidence}
            required={required}
          />

          {/* Manual Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card-number" className="text-primary">
                Card Number {required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="card-number"
                placeholder="12345678 (8-16 characters)"
                value={data.number}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                maxLength={19} // 16 chars + 3 spaces
                className={cardNumberError ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Your CSCS card number is usually 8–16 digits — check the front of your card
              </p>
              {cardNumberError && (
                <p className="text-xs text-destructive">{cardNumberError}</p>
              )}
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

          {/* Analysis Status */}
          {analysisResult && analysisResult.confidence > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>AI Analysis Complete!</strong> Your CSCS card has been analyzed with {Math.round(analysisResult.confidence * 100)}% confidence.
                {analysisResult.detectedText && (
                  <div className="text-xs mt-1 text-green-700">
                    Detected: {analysisResult.detectedText}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dev Mode JSON Preview */}
      <DevJsonPreview 
        data={analysisResult} 
        title="AI Analysis Result"
        confidence={analysisResult?.confidence}
      />
    </div>
  );
};
