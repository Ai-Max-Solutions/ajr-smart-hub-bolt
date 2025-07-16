import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DABSCreationFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export const DABSCreationForm: React.FC<DABSCreationFormProps> = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'Medium',
    projectId: '',
    expiresAt: null as Date | null,
    autoArchive: true,
    signatureRequired: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  // Fetch projects for dropdown - using mock data
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const mockProjects = [
        { id: '1', projectname: 'Sample Project' }
      ];
      return mockProjects;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_auth_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // Mock notice creation - replace with actual table when available
      console.log('Mock notice creation:', {
        title: formData.title,
        content: formData.content,
        notice_type: 'DABS Weekly Update',
        notice_category: 'dabs',
        priority: formData.priority,
        project_id: formData.projectId,
        expires_at: formData.expiresAt?.toISOString(),
        auto_archive: formData.autoArchive,
        created_by: userData?.id,
      });

      // Simulate success since we're using mock data
      console.log('DABS notice created successfully');

      toast.success('DABS notice created successfully');
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating DABS notice:', error);
      toast.error('Failed to create DABS notice');
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create DABS Notice</CardTitle>
        <CardDescription>
          Create a new Daily Activities Briefing Sheet (DABS) notice for the site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter DABS notice title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => setFormData({ ...formData, projectId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.projectname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter DABS notice content"
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Expires At</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expiresAt ? format(formData.expiresAt, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.expiresAt}
                  onSelect={(date) => setFormData({ ...formData, expiresAt: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoArchive"
              checked={formData.autoArchive}
              onChange={(e) => setFormData({ ...formData, autoArchive: e.target.checked })}
            />
            <Label htmlFor="autoArchive">Auto-archive when expired</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="signatureRequired"
              checked={formData.signatureRequired}
              onChange={(e) => setFormData({ ...formData, signatureRequired: e.target.checked })}
            />
            <Label htmlFor="signatureRequired">Signature required</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create DABS Notice
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DABSCreationForm;
