import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, MessageSquare, BarChart3, Brain, Search, Lightbulb } from 'lucide-react';
import { DocumentFolders } from '@/components/project-info/DocumentFolders';
import { DocumentList } from '@/components/project-info/DocumentList';
import { GrokChat } from '@/components/project-info/GrokChat';
import { AdvancedSearch } from '@/components/project-info/AdvancedSearch';
import { DocumentAnalytics } from '@/components/project-info/DocumentAnalytics';
import { AIInsights } from '@/components/project-info/AIInsights';
import { DocumentPreview } from '@/components/project-info/DocumentPreview';

export default function ProjectInfoHub() {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  if (!projectId) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Information Hub</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered document management and intelligent search
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">Phase 3: Advanced Features</Badge>
          <Badge variant="secondary">Beta</Badge>
        </div>
      </div>

      <Tabs defaultValue="folders" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="folders" className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4" />
            <span>Documents</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Advanced Search</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>AI Assistant</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>AI Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="folders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Document Folders</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentFolders 
                    projectId={projectId}
                    activeFolder={selectedFolder}
                    onFolderSelect={setSelectedFolder}
                    onDocumentSelect={setSelectedDocument}
                  />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <DocumentList
                projectId={projectId}
                folderId={selectedFolder}
                onDocumentSelect={setSelectedDocument}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <AdvancedSearch 
            projectId={projectId}
            onSearchResults={setSearchResults}
          />
          
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Found {searchResults.length} results for your query
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <GrokChat 
            projectId={projectId} 
            documentId={selectedDocument}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <DocumentAnalytics projectId={projectId} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AIInsights projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <DocumentPreview 
          documentId={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}