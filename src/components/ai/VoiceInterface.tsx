import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

interface VoiceInterfaceProps {
  onSpeakingChange?: (speaking: boolean) => void;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onSpeakingChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile();

  useEffect(() => {
    return () => {
      disconnectVoice();
    };
  }, []);

  const encodeAudioForAPI = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  };

  const createWavFromPCM = (pcmData: Uint8Array): ArrayBuffer => {
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray.buffer;
  };

  const playAudioData = async (audioData: Uint8Array) => {
    if (!audioContextRef.current) return;

    try {
      const wavData = createWavFromPCM(audioData);
      const audioBuffer = await audioContextRef.current.decodeAudioData(wavData);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
        onSpeakingChange?.(false);
      };
      
      setIsSpeaking(true);
      onSpeakingChange?.(true);
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const connectVoice = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Get user media
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Set up WebSocket connection
      const wsUrl = `wss://bwmkqcbfkuqmzhvqrxzo.functions.supabase.co/ai-realtime`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Voice interface connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        
        toast({
          title: "Voice Interface Connected",
          description: "You can now speak to the AJ Ryan AI Assistant",
        });
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Voice message:', data.type);

        switch (data.type) {
          case 'session.created':
            console.log('Session created, setting up audio processing');
            setupAudioProcessing();
            break;
            
          case 'response.audio.delta':
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            await playAudioData(bytes);
            break;
            
          case 'response.audio_transcript.delta':
            console.log('AI transcript:', data.delta);
            break;
            
          case 'input_audio_buffer.speech_started':
            setIsRecording(true);
            break;
            
          case 'input_audio_buffer.speech_stopped':
            setIsRecording(false);
            break;
        }
      };

      wsRef.current.onclose = () => {
        console.log('Voice interface disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        disconnectVoice();
      };

      wsRef.current.onerror = (error) => {
        console.error('Voice interface error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice interface",
          variant: "destructive",
        });
        disconnectVoice();
      };

    } catch (error) {
      console.error('Error connecting voice interface:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
      setConnectionStatus('disconnected');
    }
  };

  const setupAudioProcessing = () => {
    if (!audioContextRef.current || !mediaStreamRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    processorRef.current.onaudioprocess = (e) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const audioData = encodeAudioForAPI(new Float32Array(inputData));
      
      // Calculate audio level for visualization
      const sum = inputData.reduce((acc, val) => acc + Math.abs(val), 0);
      const average = sum / inputData.length;
      setAudioLevel(Math.min(average * 100, 100));

      // Send audio to OpenAI
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: audioData
      }));
    };

    source.connect(processorRef.current);
    processorRef.current.connect(audioContextRef.current.destination);
  };

  const disconnectVoice = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
    setAudioLevel(0);
    setConnectionStatus('disconnected');
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'Operative': 'border-aj-yellow text-aj-navy-deep',
      'Supervisor': 'border-green-500 text-green-600',
      'Project Manager': 'border-purple-500 text-purple-600',
      'Admin': 'border-red-500 text-red-600',
      'Document Controller': 'border-aj-yellow text-aj-navy-deep',
      'Director': 'border-indigo-500 text-indigo-600'
    };
    return colors[role as keyof typeof colors] || 'border-gray-500 text-gray-600';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {userProfile && (
            <Badge variant="outline" className={getRoleColor(userProfile.role)}>
              {userProfile.role} Voice Assistant
            </Badge>
          )}
          
          <div className="flex flex-col items-center space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              {connectionStatus === 'connecting' && "Connecting..."}
              {connectionStatus === 'connected' && "Ready to chat"}
              {connectionStatus === 'disconnected' && "Voice Assistant"}
            </div>
            
            {isConnected && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {isRecording ? (
                  <>
                    <Mic className="h-3 w-3 text-red-500" />
                    <span>Listening...</span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <Volume2 className="h-3 w-3 text-blue-500" />
                    <span>Speaking...</span>
                  </>
                ) : (
                  <>
                    <MicOff className="h-3 w-3" />
                    <span>Ready</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Audio level indicator */}
          {isConnected && (
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-150"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          )}

          <Button
            onClick={isConnected ? disconnectVoice : connectVoice}
            disabled={connectionStatus === 'connecting'}
            size="lg"
            className={`w-full ${isConnected ? 'bg-red-500 hover:bg-red-600' : ''}`}
          >
            {isConnected ? (
              <>
                <PhoneOff className="h-4 w-4 mr-2" />
                End Voice Chat
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Start Voice Chat
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {isConnected 
              ? "Speak naturally - I'll respond with voice and can help with your work questions"
              : "Click to start a voice conversation with your AJ Ryan AI assistant"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};