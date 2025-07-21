import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Mic, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface CreateRFIFormProps {
  onSuccess: () => void;
}

interface Project {
  id: string;
  name: string;
  plots: Plot[];
}

interface Plot {
  id: string;
  name: string;
  composite_code: string;
}

export function CreateRFIForm({ onSuccess }: CreateRFIFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedPlotId, setSelectedPlotId] = useState('');
  const [availablePlots, setAvailablePlots] = useState<Plot[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    due_date: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      setAvailablePlots(project?.plots || []);
      setSelectedPlotId('');
    }
  }, [selectedProjectId, projects]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          plots(id, name, composite_code)
        `)
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const generateRFINumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RFI-${timestamp}-${random}`;
  };

  const uploadAttachments = async () => {
    const uploadedUrls: string[] = [];
    
    for (const file of attachments) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('rfi-attachments')
        .upload(filePath, file);

      if (error) throw error;
      uploadedUrls.push(filePath);
    }

    return uploadedUrls;
  };

  const uploadVoiceNote = async () => {
    if (!audioBlob) return null;

    const fileName = `${Date.now()}-voice-note.webm`;
    const filePath = `${user?.id}/${fileName}`;

    const { error } = await supabase.storage
      .from('voice-notes')
      .upload(filePath, audioBlob);

    if (error) throw error;
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProjectId) return;

    setLoading(true);
    try {
      // Upload files
      const [attachmentUrls, voiceNoteUrl] = await Promise.all([
        uploadAttachments(),
        uploadVoiceNote(),
      ]);

      // Create RFI
      const { error } = await supabase
        .from('rfi_tracker' as any)
        .insert({
          project_id: selectedProjectId,
          plot_id: selectedPlotId || null,
          rfi_number: generateRFINumber(),
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          due_date: formData.due_date || null,
          submitted_by: user.id,
          attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null,
          voice_note_url: voiceNoteUrl,
        });

      if (error) throw error;

      toast.success('RFI submitted successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating RFI:', error);
      toast.error('Failed to submit RFI');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 5 minutes
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 300000);

      // Manual stop handler
      const stopRecording = () => {
        mediaRecorder.stop();
        setIsRecording(false);
      };

      // Store stop function globally for the button
      (window as any).stopRecording = stopRecording;
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="project">Project *</Label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="plot">Plot (Optional)</Label>
          <Select value={selectedPlotId} onValueChange={setSelectedPlotId}>
            <SelectTrigger>
              <SelectValue placeholder="Select plot" />
            </SelectTrigger>
            <SelectContent>
              {availablePlots.map((plot) => (
                <SelectItem key={plot.id} value={plot.id}>
                  {plot.composite_code} - {plot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief title of the information request"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of the information needed"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="due_date">Due Date (Optional)</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
      </div>

      {/* File Attachments */}
      <div>
        <Label htmlFor="attachments">Attachments</Label>
        <Input
          id="attachments"
          type="file"
          multiple
          accept="image/*,application/pdf,video/*"
          onChange={handleFileChange}
        />
        {attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Note */}
      <div>
        <Label>Voice Note (Optional)</Label>
        <div className="flex items-center gap-2 mt-1">
          {!isRecording ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startRecording}
              disabled={!!audioBlob}
            >
              <Mic className="h-4 w-4 mr-2" />
              {audioBlob ? 'Voice note recorded' : 'Record voice note'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => (window as any).stopRecording?.()}
            >
              <div className="animate-pulse flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Stop recording
              </div>
            </Button>
          )}
          {audioBlob && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAudioBlob(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading || !selectedProjectId || !formData.title || !formData.description}>
          {loading ? 'Submitting...' : 'Submit RFI'}
        </Button>
      </div>
    </form>
  );
}