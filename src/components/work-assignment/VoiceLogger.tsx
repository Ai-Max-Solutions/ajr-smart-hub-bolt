import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Square, Play } from 'lucide-react';

interface Assignment {
  id: string;
  plot: { composite_code: string; };
  work_category: { main_category: string; sub_task: string; };
}

interface VoiceLoggerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignments: Assignment[];
  onSubmit: (data: { hours: number; notes: string; voiceTranscript?: string; }) => void;
}

export const VoiceLogger: React.FC<VoiceLoggerProps> = ({
  open,
  onOpenChange,
  assignments,
  onSubmit
}) => {
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Mock voice recording
      setTimeout(() => {
        setTranscript("Completed electrical work on this unit, took about 6 hours total");
        setIsRecording(false);
      }, 3000);
    }
  };

  const handleSubmit = () => {
    if (transcript && selectedAssignment) {
      onSubmit({
        hours: 6,
        notes: transcript,
        voiceTranscript: transcript
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Work Logger
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignment" />
            </SelectTrigger>
            <SelectContent>
              {assignments.map(assignment => (
                <SelectItem key={assignment.id} value={assignment.id}>
                  {assignment.plot.composite_code} - {assignment.work_category.main_category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-center space-y-4">
            <Button
              onClick={handleRecord}
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="w-32 h-32 rounded-full"
            >
              {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
            
            <p className="text-sm text-muted-foreground">
              {isRecording ? "Recording..." : "Tap to record work completion"}
            </p>

            {transcript && (
              <div className="p-3 bg-muted rounded-lg text-left">
                <p className="text-sm">{transcript}</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!transcript || !selectedAssignment}
            className="w-full"
          >
            Submit Work Log
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};