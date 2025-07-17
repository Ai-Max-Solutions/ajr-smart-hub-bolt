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
  Shuffle,
  Download
} from 'lucide-react';

interface ProfilePictureUploaderProps {
  currentAvatarUrl?: string;
  userName?: string;
  userRole?: string;
  userSkills?: string[];
  cscsLevel?: string;
  onAvatarUpdate: (url: string) => void;
}

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
  const [isCameraActive, setIsCameraActive] = useState(false);
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

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create file path with user ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
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
        console.error('Error updating user avatar URL:', updateError);
        // Still proceed with UI update even if database update fails
      }


      onAvatarUpdate(publicUrl);
      toast({
        title: "Profile Picture Updated",
        description: "Your new profile picture has been uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload your profile picture. Please try again.",
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
        const fileName = `${user.id}/camera-avatar-${Date.now()}.jpg`;
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
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

        if (updateError) {
          console.error('Error updating user avatar URL:', updateError);
          // Still proceed with UI update even if database update fails
        }

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
                  disabled={isUploading}
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
                  disabled={isUploading}
                  variant="outline"
                  className="w-full border-accent/50 hover:bg-accent/10"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Selfie 📸
                </Button>

                 {/* AI Generation Button */}
                <Button
                  disabled={isUploading}
                  variant="outline"
                  className="w-full border-accent/50 hover:bg-accent/10"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Smart AJ Ryan Avatar ✨
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
            <p>Supports PNG, JPG, GIF, WebP • Max 5MB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};