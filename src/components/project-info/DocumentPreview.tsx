import { useState, useEffect } from 'react';
import { X, Download, Share2, BookOpen, Eye, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface DocumentPreviewProps {
  documentId: string;
  onClose: () => void;
}

interface DocumentData {
  id: string;
  title: string;
  type: string;
  size: string;
  lastModified: string;
  author: string;
  content: string;
  metadata: {
    pages: number;
    version: string;
    tags: string[];
  };
}

export function DocumentPreview({ documentId, onClose }: DocumentPreviewProps) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    // Simulate document loading - in real implementation, fetch from Supabase
    const mockDocument: DocumentData = {
      id: documentId,
      title: 'Site Safety Protocols - Electrical Work',
      type: 'PDF',
      size: '2.4 MB',
      lastModified: '2024-01-20',
      author: 'Safety Manager',
      content: `
# Site Safety Protocols - Electrical Work

## Overview
This document outlines the essential safety protocols for all electrical work conducted on site. All personnel must familiarize themselves with these procedures before commencing any electrical activities.

## Key Safety Requirements

### 1. Personal Protective Equipment (PPE)
- **Hard hat** - Must be worn at all times
- **Safety glasses** - Required for all electrical work
- **Insulated gloves** - Class 0 minimum for voltages up to 1000V
- **Safety boots** - Steel-toed, electrical hazard rated
- **High-visibility vest** - Required in all work areas

### 2. Lockout/Tagout Procedures
1. Identify all energy sources
2. Notify affected personnel
3. Shut down equipment using normal procedures
4. Isolate energy sources using lockout devices
5. Verify zero energy state
6. Apply personal locks and tags

### 3. Electrical Testing
- Always test circuits before work begins
- Use properly rated test equipment
- Follow the "Test-Before-Touch" principle
- Verify proper grounding

### 4. Work Area Safety
- Maintain minimum approach distances
- Establish barriers and warning signs
- Ensure adequate lighting
- Keep work areas clean and organized

## Emergency Procedures
In case of electrical emergency:
1. De-energize if safely possible
2. Call emergency services (999)
3. Provide first aid if trained
4. Report incident immediately

## Training Requirements
All electrical personnel must complete:
- Basic electrical safety training
- Site-specific orientation
- Annual refresher training
- Emergency response procedures

## Documentation
All electrical work must be documented with:
- Work permits
- Test results
- Inspection records
- Incident reports (if applicable)

This document is reviewed quarterly and updated as necessary to reflect current best practices and regulatory requirements.
      `,
      metadata: {
        pages: 8,
        version: '3.2',
        tags: ['safety', 'electrical', 'protocols', 'mandatory']
      }
    };

    setTimeout(() => {
      setDocument(mockDocument);
      setIsLoading(false);
    }, 1000);
  }, [documentId]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleDownload = () => {
    console.log('Downloading document:', documentId);
  };
  const handleShare = () => {
    console.log('Sharing document:', documentId);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-4/5 h-4/5 max-w-6xl">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading document...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-4/5 h-4/5 max-w-6xl flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6" />
              <div>
                <CardTitle className="text-lg">{document.title}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">{document.type}</Badge>
                  <Badge variant="secondary">v{document.metadata.version}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {document.size} • {document.metadata.pages} pages
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Author: {document.author}</span>
              <span>Modified: {new Date(document.lastModified).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>Preview Mode</span>
            </div>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="flex-1 p-0">
          <div className="flex h-full">
            {/* Document Content */}
            <div className="flex-1 bg-white">
              <ScrollArea className="h-full">
                <div 
                  className="p-8 prose prose-sm max-w-none"
                  style={{ fontSize: `${zoom}%` }}
                >
                  <div className="whitespace-pre-wrap text-gray-900">
                    {document.content}
                  </div>
                </div>
              </ScrollArea>
            </div>
            
            {/* Sidebar */}
            <div className="w-64 border-l bg-muted/30 p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Document Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{document.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{document.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pages:</span>
                      <span>{document.metadata.pages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span>{document.metadata.version}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {document.metadata.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Maximize2 className="h-3 w-3 mr-2" />
                      Fullscreen
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <BookOpen className="h-3 w-3 mr-2" />
                      Table of Contents
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}