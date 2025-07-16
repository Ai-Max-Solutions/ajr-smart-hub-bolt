
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, Clock, FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { DABSCreationForm } from './DABSCreationForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SiteNotice {
  id: string;
  title: string;
  content: string;
  notice_type: string;
  notice_category: string;
  priority: string;
  status: string;
  expires_at?: string;
  created_at: string;
  project_id: string;
  signature_required?: boolean;
}

interface Project {
  id: string;
  projectname: string;
}

export const SiteNotices: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch site notices - using mock data for now
  const { data: notices = [], refetch: refetchNotices } = useQuery({
    queryKey: ['site-notices'],
    queryFn: async () => {
      // Mock data since table might not exist
      const mockNotices: SiteNotice[] = [
        {
          id: '1',
          title: 'Safety Alert - Hard Hats Required',
          content: 'All personnel must wear hard hats in designated areas.',
          notice_type: 'Safety Alert',
          notice_category: 'safety_alert',
          priority: 'High',
          status: 'active',
          created_at: new Date().toISOString(),
          project_id: '1',
          signature_required: true
        }
      ];
      return mockNotices;
    },
  });

  // Fetch projects for context - using mock data
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-notices'],
    queryFn: async () => {
      const mockProjects: Project[] = [
        { id: '1', projectname: 'Sample Project' }
      ];
      return mockProjects;
    },
  });

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.projectname || 'Unknown Project';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dabs':
        return <Calendar className="h-4 w-4" />;
      case 'safety_alert':
        return <AlertCircle className="h-4 w-4" />;
      case 'toolbox_talk':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const markAsRead = async (noticeId: string) => {
    try {
      toast.success('Notice marked as read');
      refetchNotices();
    } catch (error) {
      console.error('Error marking notice as read:', error);
      toast.error('Failed to mark notice as read');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ajryan-dark">Site Notices</h2>
          <p className="text-muted-foreground">
            Current site notices, DABS updates, and safety alerts
          </p>
        </div>
        
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="bg-ajryan-yellow hover:bg-ajryan-yellow/90 text-ajryan-dark">
              <Plus className="h-4 w-4 mr-2" />
              Create Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DABSCreationForm
              onClose={() => setShowCreateForm(false)}
              onCreated={() => {
                refetchNotices();
                setShowCreateForm(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {notices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active site notices</p>
            </CardContent>
          </Card>
        ) : (
          notices.map((notice) => (
            <Card key={notice.id} className="border-l-4 border-l-ajryan-yellow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(notice.notice_category)}
                    <CardTitle className="text-lg">{notice.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(notice.priority)}>
                      {notice.priority}
                    </Badge>
                    {notice.notice_category === 'dabs' && (
                      <Badge variant="outline">DABS</Badge>
                    )}
                    {notice.signature_required && (
                      <Badge variant="outline">Signature Required</Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="flex items-center gap-4">
                  <span>{getProjectName(notice.project_id)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(notice.created_at), 'PPp')}
                  </span>
                  {notice.expires_at && (
                    <span className="flex items-center gap-1 text-orange-600">
                      <Calendar className="h-3 w-3" />
                      Expires: {format(new Date(notice.expires_at), 'PPp')}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(notice.id)}
                    >
                      Mark as Read
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
