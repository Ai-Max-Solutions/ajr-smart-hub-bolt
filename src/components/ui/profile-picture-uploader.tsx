import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Upload, 
  Sparkles, 
  Loader2, 
  Camera, 
  User,
  RefreshCw
} from 'lucide-react';

interface ProfilePictureUploaderProps {
  currentAvatarUrl?: string;
  userName?: string;
  userRole?: string;
  userSkills?: string[];
  cscsLevel?: string;
  onAvatarUpdate: (url: string) => void;
}

// Client-side image resizing utility
const resizeImage = (file: File, maxSize: number = 500): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let newWidth, newHeight;
      if (width > height) {
        newWidth = Math.min(maxSize, width);
        newHeight = newWidth / aspectRatio;
      } else {
        newHeight = Math.min(maxSize, height);
        newWidth = newHeight * aspectRatio;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      canvas.toBlob(resolve!, 'image/png', 0.9);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  currentAvatarUrl,
  userName,
  userRole,
  userSkills,
  cscsLevel,
  onAvatarUpdate
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [aiMood, setAiMood] = useState<string>('');
  const [aiPersonality, setAiPersonality] = useState<string>('');
  const [lastError, setLastError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (PNG, JPG, GIF, WebP).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setLastError('');

    try {
      // Resize image to 500px
      const resizedBlob = await resizeImage(file);
      
      // Create file path with user ID
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, resizedBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user's avatar URL in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('supabase_auth_id', user.id);

      if (updateError) {
        throw updateError;
      }

      onAvatarUpdate(publicUrl);
      toast({
        title: "Profile Picture Updated",
        description: "Your new profile picture has been uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setLastError(errorMessage);
      toast({
        title: "Upload Failed",
        description: `Failed to upload your profile picture: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGenerateAI = async () => {
    if (!user) return;

    setIsGenerating(true);
    setAiMood('');
    setAiPersonality('');
    setLastError('');

    try {
      console.log('Starting AI avatar generation for:', { userName, userRole, userId: user.id });
      
      const response = await supabase.functions.invoke('ai-profile-generator', {
        body: {
          userName: userName || '',
          userRole: userRole || 'Site Worker',
          userId: user.id,
        },
      });

      console.log('Edge function response:', { data: response.data, error: response.error });

      // Enhanced error parsing - check for edge function errors first
      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(`AI generation service error: ${response.error.message || 'Unknown error'}`);
      }

      // Check if we have data
      if (!response.data) {
        throw new Error('No response from AI generation service');
      }

      // Parse the response data - check for application-level errors even on 200 status
      const data = response.data;
      
      // Check for error in the response payload (even if HTTP status was 200)
      if (data.error) {
        console.error('Application error in response:', data.error);
        throw new Error(data.error);
      }

      // Validate that we have an image URL
      if (!data.imageUrl && !data.avatarUrl) {
        console.error('No image URL in response:', data);
        throw new Error('AI generator completed but returned no image URL');
      }

      const avatarUrl = data.imageUrl || data.avatarUrl;
      console.log('Generated avatar URL:', avatarUrl);

      // Set the AI mood and personality for display
      setAiMood(data.aiMood || 'Creative');
      setAiPersonality(data.aiPersonality || 'AI generated your professional headshot!');

      // Avatar is already uploaded and database is updated by the edge function
      onAvatarUpdate(avatarUrl);
      
      toast({
        title: "AI Avatar Generated! 🎨",
        description: data.aiPersonality || "Your new AI-generated profile picture is ready!",
      });
    } catch (error) {
      console.error('Error generating AI avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastError(errorMessage);
      
      // Provide specific error messages based on error content
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('not configured')) {
        userFriendlyMessage = 'AI service is temporarily unavailable. Please try uploading a photo instead.';
      } else if (errorMessage.includes('User ID is required')) {
        userFriendlyMessage = 'Please refresh the page and try again.';
      } else if (errorMessage.includes('AI generation service error')) {
        userFriendlyMessage = 'AI generation failed. Please try again in a moment.';
      }
      
      toast({
        title: "Generation Failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetryAI = async () => {
    setLastError('');
    await handleGenerateAI();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front camera for selfies
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Failed",
        description: "Unable to access your camera. Please try file upload instead.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !user) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      setIsUploading(true);
      stopCamera();
      
      try {
        // Resize the captured image
        const resizedBlob = await resizeImage(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
        
        const fileName = `${user.id}/camera-avatar-${Date.now()}.jpg`;
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, resizedBlob, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Update user's avatar URL in database
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: publicUrl })
          .eq('supabase_auth_id', user.id);

        if (updateError) throw updateError;

        onAvatarUpdate(publicUrl);
        toast({
          title: "Selfie Captured! 📸",
          description: "Your new profile picture has been saved successfully!",
        });
      } catch (error) {
        console.error('Error uploading camera photo:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to save your photo. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const getUserInitials = () => {
    if (userName) {
      return userName.split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Camera View or Avatar Display */}
          {isCameraActive ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-80 h-60 bg-black rounded-lg object-cover"
              />
              <div className="absolute inset-0 border-4 border-accent rounded-lg"></div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-border">
                <AvatarImage 
                  src={currentAvatarUrl} 
                  alt="Profile picture"
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl bg-accent/20 text-accent">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              
              {/* Camera icon overlay */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent rounded-full flex items-center justify-center border-4 border-background">
                <Camera className="w-5 h-5 text-accent-foreground" />
              </div>
            </div>
          )}

          {/* AI Mood Display */}
          {aiMood && aiPersonality && (
            <div className="text-center p-4 bg-accent/10 rounded-lg border-2 border-accent/20">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="font-medium text-accent">AI Mood: {aiMood}</span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                "{aiPersonality}"
              </p>
            </div>
          )}

          {/* Error Display with Retry */}
          {lastError && (
            <div className="text-center p-4 bg-destructive/10 rounded-lg border-2 border-destructive/20 w-full">
              <p className="text-sm text-destructive mb-3">{lastError}</p>
              {lastError.includes('AI') && (
                <Button
                  onClick={handleRetryAI}
                  disabled={isGenerating}
                  size="sm"
                  variant="outline"
                  className="border-destructive/50 hover:bg-destructive/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry AI Generation
                </Button>
              )}
            </div>
          )}

          {/* Upload Options */}
          <div className="w-full space-y-3">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {!isCameraActive ? (
              <>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isGenerating}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>

                {/* Camera Button */}
                <Button
                  onClick={startCamera}
                  disabled={isUploading || isGenerating}
                  variant="outline"
                  className="w-full border-accent/50 hover:bg-accent/10"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Selfie 📸
                </Button>

                 {/* AI Generation Button */}
                <Button
                  onClick={handleGenerateAI}
                  disabled={isUploading || isGenerating}
                  variant="outline"
                  className="w-full border-accent/50 hover:bg-accent/10"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI creating your personalized avatar...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Smart AJ Ryan Avatar ✨
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={capturePhoto}
                  disabled={isUploading}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Photo
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>

          {/* Enhanced Helper Text */}
          <div className="text-center max-w-md">
            <p className="text-sm text-muted-foreground mb-2">
              🎯 Smart AI avatars use your role{userRole && ` (${userRole})`}, CSCS level{cscsLevel && ` (${cscsLevel})`}, and AJ Ryan branding!
            </p>
            <p className="text-xs text-muted-foreground italic">
              Our AI creates personalized professional headshots based on your job type, qualifications, and company standards. 
              Looking professional has never been this easy! 🏗️
            </p>
          </div>

          {/* Technical Details */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Supports PNG, JPG, GIF, WebP • Max 2MB • Auto-resized to 500px</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
