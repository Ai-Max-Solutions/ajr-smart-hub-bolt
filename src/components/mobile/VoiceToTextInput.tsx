import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoiceToTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function VoiceToTextInput({ 
  value, 
  onChange, 
  placeholder = "Tap to speak...",
  label,
  className 
}: VoiceToTextInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { triggerHaptics, isNative } = useMobile();
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      setError(null);
      await triggerHaptics();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Speak clearly into your device microphone",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Could not access microphone. Please check permissions.');
      toast({
        title: "Recording Error",
        description: "Unable to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      await triggerHaptics();
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send to voice-to-text edge function
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data?.text) {
        const newText = value ? `${value} ${data.text}` : data.text;
        onChange(newText);
        
        toast({
          title: "Speech Converted",
          description: "Text has been added to the input",
        });
      } else {
        throw new Error('No text returned from speech recognition');
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Failed to convert speech to text. Please try again.');
      toast({
        title: "Conversion Failed",
        description: "Could not convert speech to text",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-12"
        />
        
        <Button
          type="button"
          size="sm"
          variant={isRecording ? "destructive" : "outline"}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          onClick={handleToggleRecording}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isRecording && (
        <Card className="mt-2 border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-red-700">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Recording... Tap to stop</span>
              <Volume2 className="w-4 h-4 ml-auto" />
            </div>
          </CardContent>
        </Card>
      )}

      {isProcessing && (
        <Card className="mt-2 border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Converting speech to text...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert className="mt-2" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isNative && (
        <p className="text-xs text-gray-500 mt-1">
          Voice input works best in native mobile apps. Web version may have limited functionality.
        </p>
      )}
    </div>
  );
}