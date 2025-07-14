import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Mic, MicOff, Calendar, Clock, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DABSCreationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialContent?: {title: string; content: string} | null;
}

interface Project {
  id: string;
  name: string;
}

const DABSCreationForm = ({ open, onClose, onSuccess, initialContent }: DABSCreationFormProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!user?.user_id) return;
      
      try {
        const userProjects: Project[] = [];
        
        // Get user's current project
        if (user.current_project) {
          const { data: currentProjectData, error: currentError } = await supabase
            .from('Projects')
            .select('whalesync_postgres_id, projectname')
            .eq('whalesync_postgres_id', user.current_project)
            .single();
            
          if (!currentError && currentProjectData) {
            userProjects.push({
              id: currentProjectData.whalesync_postgres_id,
              name: currentProjectData.projectname
            });
          }
        }
        
        // Get projects from project_teams table
        const { data: teamData, error: teamError } = await supabase
          .from('project_teams')
          .select(`
            project_id,
            Projects!inner(whalesync_postgres_id, projectname)
          `)
          .eq('user_id', user.user_id);
          
        if (!teamError && teamData) {
          teamData.forEach((team: any) => {
            if (team.Projects && !userProjects.find(p => p.id === team.project_id)) {
              userProjects.push({
                id: team.project_id,
                name: team.Projects.projectname
              });
            }
          });
        }
        
        setProjects(userProjects);
        
        // Auto-select current project if available
        if (user.current_project && userProjects.find(p => p.id === user.current_project)) {
          setSelectedProject(user.current_project);
        }
      } catch (error) {
        console.error('Error fetching user projects:', error);
      }
    };
    
    if (open) {
      fetchUserProjects();
    }
  }, [open, user]);

  // Set initial content from AI if provided
  useEffect(() => {
    if (initialContent) {
      setTitle(initialContent.title);
      setContent(initialContent.content);
    }
  }, [initialContent]);

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { audio: base64Audio }
              });

              if (error) throw error;
              
              if (data?.text) {
                setContent(prev => prev + ' ' + data.text);
                toast({
                  title: "Voice input added",
                  description: "Speech has been converted to text",
                });
              }
            } catch (error) {
              console.error('Voice to text error:', error);
              toast({
                title: "Error",
                description: "Failed to convert speech to text",
                variant: "destructive",
              });
            }
          };
          
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        setIsRecording(true);
        mediaRecorder.start();

        // Stop recording after 30 seconds
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
          }
        }, 30000);

      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Error",
          description: "Could not access microphone",
          variant: "destructive",
        });
      }
    } else {
      // Stop recording manually
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate expiry date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from('site_notices')
        .insert([{
          title,
          content,
          notice_type: 'DABS Weekly Update',
          notice_category: 'dabs',
          priority,
          project_id: selectedProject || null,
          expires_at: expiresAt.toISOString(),
          auto_archive: true,
          requires_signature: requiresSignature,
          status: 'active'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "DABS briefing created successfully",
      });

      // Reset form
      setTitle('');
      setContent('');
      setPriority('Medium');
      setSelectedProject('');
      setRequiresSignature(false);
      
      onSuccess();
    } catch (error) {
      console.error('Error creating DABS:', error);
      toast({
        title: "Error",
        description: "Failed to create DABS briefing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'destructive';
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'accent';
      case 'Low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-accent" />
            Create DABS Briefing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto-expiry info */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-accent mb-1">
              <Calendar className="w-4 h-4" />
              <strong>Auto-expiry enabled</strong>
            </div>
            <p className="text-sm text-muted-foreground">
              This DABS briefing will automatically expire and be archived in 7 days (next week's meeting).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Briefing Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Weekly DABS - Access Restrictions"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Briefing Content *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVoiceInput}
                  className={isRecording ? 'bg-destructive/10 border-destructive text-destructive' : ''}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Recording... (tap to stop)
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Voice Input
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe access restrictions, safety updates, or other important site information..."
                className="min-h-[120px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use the voice input button to speak your briefing content
              </p>
            </div>

            <div className="space-y-2">
              <Label>Project Assignment</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project (leave blank for all projects)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>All Projects (Global Notice)</span>
                    </div>
                  </SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{project.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only operatives assigned to the selected project will see this DABS briefing
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority Level</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Low</Badge>
                        <span>General information</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground">Medium</Badge>
                        <span>Standard update</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="High">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">High</Badge>
                        <span>Important changes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Critical">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Critical</Badge>
                        <span>Safety critical</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Requires Signature</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={requiresSignature}
                    onCheckedChange={setRequiresSignature}
                  />
                  <span className="text-sm text-muted-foreground">
                    {requiresSignature ? 'Workers must sign' : 'Information only'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Clock className="w-4 h-4" />
              <span>This briefing will be visible for 7 days and then automatically archived.</span>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="btn-accent">
                {isSubmitting ? 'Creating...' : 'Create DABS Briefing'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DABSCreationForm;