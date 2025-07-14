import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download,
  Eye,
  PenTool,
  Megaphone,
  Plus,
  Users,
  Calendar,
  Shield,
  Building
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import DABSCreationForm from './DABSCreationForm';

interface SiteNotice {
  id: string;
  title: string;
  content: string;
  notice_type: string;
  notice_category?: string;
  priority?: string;
  requires_signature?: boolean;
  status?: string;
  expires_at?: string;
  auto_archive?: boolean;
  created_at: string;
  created_by?: string;
  attachments?: any;
  project_id?: string;
  valid_from?: string;
  valid_until?: string;
  project_name?: string;
}

interface UserProject {
  project_id: string;
  project_name: string;
}

const SiteNotices = () => {
  const [notices, setNotices] = useState<SiteNotice[]>([]);
  const [dabsNotices, setDabsNotices] = useState<SiteNotice[]>([]);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
  const [showDABSForm, setShowDABSForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchUserProjects = async () => {
    if (!user?.user_id) return [];
    
    try {
      // Get user's current project
      const currentProject = user.current_project;
      const projects: UserProject[] = [];
      
      if (currentProject) {
        const { data: currentProjectData, error: currentError } = await supabase
          .from('Projects')
          .select('whalesync_postgres_id, projectname')
          .eq('whalesync_postgres_id', currentProject)
          .single();
          
        if (!currentError && currentProjectData) {
          projects.push({
            project_id: currentProjectData.whalesync_postgres_id,
            project_name: currentProjectData.projectname
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
          if (team.Projects && !projects.find(p => p.project_id === team.project_id)) {
            projects.push({
              project_id: team.project_id,
              project_name: team.Projects.projectname
            });
          }
        });
      }
      
      return projects;
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return [];
    }
  };

  const fetchNotices = async () => {
    try {
      const userProjectsList = await fetchUserProjects();
      setUserProjects(userProjectsList);
      
      const projectIds = userProjectsList.map(p => p.project_id);
      
      // Build query for project-specific notices
      let query = supabase
        .from('site_notices')
        .select(`
          *,
          Projects(projectname)
        `)
        .order('created_at', { ascending: false });
      
      // Filter by user's projects if they have any assigned
      if (projectIds.length > 0) {
        query = query.or(`project_id.in.(${projectIds.join(',')}),project_id.is.null`);
      } else {
        // If no projects assigned, show only global notices (no project_id)
        query = query.is('project_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const allNotices = (data || []).map((notice: any) => ({
        ...notice,
        project_name: notice.Projects?.projectname || null
      })) as SiteNotice[];
      
      const dabs = allNotices.filter(notice => notice.notice_category === 'dabs');
      const regular = allNotices.filter(notice => notice.notice_category !== 'dabs');
      
      setDabsNotices(dabs);
      setNotices(regular);
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast({
        title: "Error",
        description: "Failed to load site notices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const pendingNotices = [...notices, ...dabsNotices].filter(n => n.status === 'active').length;
  const requiresSignature = [...notices, ...dabsNotices].filter(n => n.requires_signature && n.status !== 'signed').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'read':
        return <Eye className="w-4 h-4 text-warning" />;
      case 'active':
        return <Clock className="w-4 h-4 text-destructive" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Signed';
      case 'read':
        return 'Read';
      case 'active':
        return 'Pending';
      default:
        return 'Unknown';
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety_alert':
        return 'destructive';
      case 'toolbox_talk':
        return 'accent';
      case 'dabs':
        return 'default';
      case 'general':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'safety_alert':
        return 'Safety Alert';
      case 'toolbox_talk':
        return 'Toolbox Talk';
      case 'dabs':
        return 'DABS';
      case 'general':
        return 'Site Notice';
      default:
        return 'Notice';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety_alert':
        return <Shield className="w-4 h-4" />;
      case 'toolbox_talk':
        return <Users className="w-4 h-4" />;
      case 'dabs':
        return <Megaphone className="w-4 h-4" />;
      case 'general':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleMarkAsRead = async (noticeId: string) => {
    try {
      const { error } = await supabase
        .from('site_notices')
        .update({ status: 'read' })
        .eq('id', noticeId);

      if (error) throw error;
      
      fetchNotices();
      toast({
        title: "Success",
        description: "Notice marked as read",
      });
    } catch (error) {
      console.error('Error updating notice:', error);
      toast({
        title: "Error",
        description: "Failed to update notice",
        variant: "destructive",
      });
    }
  };

  const handleSignNotice = async (noticeId: string) => {
    try {
      const { error } = await supabase
        .from('site_notices')
        .update({ status: 'signed' })
        .eq('id', noticeId);

      if (error) throw error;
      
      fetchNotices();
      toast({
        title: "Success",
        description: "Notice signed successfully",
      });
    } catch (error) {
      console.error('Error signing notice:', error);
      toast({
        title: "Error",
        description: "Failed to sign notice",
        variant: "destructive",
      });
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Expires soon';
  };

  const renderNoticeCard = (notice: SiteNotice) => (
    <Card key={notice.id} className={`card-hover border-l-4 ${
      notice.priority === 'Critical' ? 'border-l-destructive' :
      notice.priority === 'High' ? 'border-l-warning' :
      notice.priority === 'Medium' ? 'border-l-accent' :
      'border-l-secondary'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={getCategoryColor(notice.notice_category) as any} className="flex items-center gap-1">
              {getCategoryIcon(notice.notice_category)}
              {getCategoryLabel(notice.notice_category)}
            </Badge>
            <Badge variant={getPriorityColor(notice.priority) as any} className="text-xs">
              {notice.priority}
            </Badge>
            <div className="flex items-center gap-2">
              {getStatusIcon(notice.status)}
              <span className="text-sm font-medium">
                {getStatusText(notice.status)}
              </span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(notice.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <CardTitle className="text-lg cursor-pointer hover:text-primary flex items-center justify-between" 
                  onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}>
          <span>{notice.title}</span>
          {notice.expires_at && (
            <span className="text-sm text-warning font-normal">
              {formatTimeRemaining(notice.expires_at)}
            </span>
          )}
        </CardTitle>
        
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Type: {notice.notice_type}</span>
              {notice.project_name && (
                <div className="flex items-center gap-1 text-primary">
                  <Building className="w-3 h-3" />
                  <span className="font-medium">{notice.project_name}</span>
                </div>
              )}
            </div>
            {notice.expires_at && notice.notice_category === 'dabs' && (
              <div className="text-accent">Auto-archives in {formatTimeRemaining(notice.expires_at)}</div>
            )}
          </div>
      </CardHeader>

      {expandedNotice === notice.id && (
        <CardContent className="pt-0 border-t">
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{notice.content}</p>
            </div>

            {notice.attachments && Array.isArray(notice.attachments) && notice.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Attachments
                </h4>
                <div className="space-y-2">
                  {notice.attachments.map((attachment: any, index: number) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm" 
                      className="justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {attachment.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-3 border-t">
              {notice.status === 'active' && (
                <Button 
                  onClick={() => handleMarkAsRead(notice.id)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Mark as Read
                </Button>
              )}
              
              {notice.requires_signature && notice.status !== 'signed' && (
                <Button 
                  onClick={() => handleSignNotice(notice.id)}
                  className="btn-accent"
                  size="sm"
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Sign & Confirm
                </Button>
              )}
              
              {notice.status === 'signed' && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle className="w-4 h-4" />
                  Signed
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Site Notices"
          description="Stay updated with important site communications, DABS briefings, and safety alerts"
        />

        {/* Alert Banner */}
        {(pendingNotices > 0 || requiresSignature > 0) && (
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <AlertDescription className="text-warning">
              {pendingNotices > 0 && `You have ${pendingNotices} new notice${pendingNotices > 1 ? 's' : ''}`}
              {pendingNotices > 0 && requiresSignature > 0 && ' • '}
              {requiresSignature > 0 && `${requiresSignature} notice${requiresSignature > 1 ? 's' : ''} require${requiresSignature === 1 ? 's' : ''} your signature before work`}
            </AlertDescription>
          </Alert>
        )}

        {/* DABS Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone className="w-6 h-6 text-accent" />
              <div>
                <h2 className="text-2xl font-bold text-primary">DABS Briefings</h2>
                <p className="text-sm text-muted-foreground">Weekly site access briefings and important updates</p>
              </div>
            </div>
            <Button onClick={() => setShowDABSForm(true)} className="btn-accent">
              <Plus className="w-4 h-4 mr-2" />
              Create DABS
            </Button>
          </div>

          {dabsNotices.length > 0 ? (
            <div className="space-y-4">
              {dabsNotices.map(renderNoticeCard)}
            </div>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No DABS briefings this week</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check back after the weekly DABS meeting
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-8" />

        {/* Regular Notices Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-primary">Site Notices</h2>
              <p className="text-sm text-muted-foreground">General site communications and updates</p>
            </div>
          </div>

          {notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map(renderNoticeCard)}
            </div>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No site notices at this time</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* DABS Creation Form */}
        <DABSCreationForm 
          open={showDABSForm}
          onClose={() => setShowDABSForm(false)}
          onSuccess={() => {
            setShowDABSForm(false);
            fetchNotices();
          }}
        />
      </div>
    </div>
  );
};

export default SiteNotices;