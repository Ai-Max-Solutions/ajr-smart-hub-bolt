import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, MessageSquare, Search, Filter } from 'lucide-react';
import { DocumentFolders } from '@/components/project-info/DocumentFolders';
import { DocumentUpload } from '@/components/project-info/DocumentUpload';
import { DocumentBrowser } from '@/components/project-info/DocumentBrowser';
import { GrokChat } from '@/components/project-info/GrokChat';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  code: string;
}

export default function ProjectInfoHub() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId && user) {
      fetchProject();
    }
  }, [projectId, user]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, code')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project information');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Please sign in to access project information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Project not found or you don't have access to it.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/projects')}>
                Back to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {project.name} - Information Hub
            </h1>
            <p className="text-muted-foreground">
              Project Code: {project.code} • Access and manage project documentation with AI-powered search
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Grok AI Chat
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowUpload(!showUpload)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Upload Documents
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUpload(false)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUpload 
              projectId={projectId!}
              onUploadComplete={() => {
                setShowUpload(false);
                toast.success('Documents uploaded successfully');
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Document Folders */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentFolders 
                projectId={projectId!}
                activeFolder={activeFolder}
                onFolderSelect={setActiveFolder}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="browser" className="space-y-4">
            <TabsList>
              <TabsTrigger value="browser" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Document Browser</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>AI Assistant</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browser">
              <DocumentBrowser 
                projectId={projectId!}
                folderId={activeFolder}
              />
            </TabsContent>

            <TabsContent value="chat">
              <GrokChat 
                projectId={projectId!}
                documentId={null}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Floating Chat Widget */}
      {showChat && (
        <div className="fixed bottom-4 right-4 w-96 h-96 z-50">
          <Card className="h-full border-primary shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Grok AI Assistant
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowChat(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full pb-4">
              <GrokChat 
                projectId={projectId!}
                documentId={null}
                compact={true}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}