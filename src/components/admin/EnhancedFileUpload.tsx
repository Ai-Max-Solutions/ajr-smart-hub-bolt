import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, File, X, Check, AlertCircle, Brain, Sparkles } from "lucide-react";
import { useAutoTagging } from "@/hooks/useAutoTagging";
import { toast } from "sonner";

interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  suggestedTags?: string[];
  suggestedType?: string;
  contentSummary?: string;
}

interface EnhancedFileUploadProps {
  onFilesUploaded: (files: Array<{
    file: File;
    url: string;
    suggestedTags: string[];
    suggestedType: string;
    contentSummary: string;
  }>) => void;
  acceptedTypes?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export const EnhancedFileUpload = ({
  onFilesUploaded,
  acceptedTypes = ".pdf,.doc,.docx,.jpg,.png,.txt",
  maxFiles = 5,
  maxSize = 10
}: EnhancedFileUploadProps) => {
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processDocumentFile, loading: aiLoading } = useAutoTagging();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    // Size check
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Type check
    const allowedTypes = acceptedTypes.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `File type not supported. Allowed: ${acceptedTypes}`;
    }

    return null;
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate total files count
    if (uploadItems.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Create upload items
    const newItems: FileUploadItem[] = fileArray.map(file => {
      const validationError = validateFile(file);
      return {
        file,
        id: generateId(),
        progress: 0,
        status: validationError ? 'error' : 'pending',
        error: validationError || undefined
      };
    });

    setUploadItems(prev => [...prev, ...newItems]);

    // Process valid files
    const validItems = newItems.filter(item => item.status !== 'error');
    
    for (const item of validItems) {
      await processFile(item);
    }
  }, [uploadItems.length, maxFiles]);

  const processFile = async (item: FileUploadItem) => {
    try {
      // Update status to processing
      setUploadItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'processing', progress: 20 } : i
      ));

      // Simulate upload progress
      let progress = 20;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 80) {
          setUploadItems(prev => prev.map(i => 
            i.id === item.id ? { ...i, progress } : i
          ));
        }
      }, 200);

      // AI processing
      const aiResult = await processDocumentFile(item.file);
      
      clearInterval(progressInterval);

      // Complete upload
      setUploadItems(prev => prev.map(i => 
        i.id === item.id ? { 
          ...i, 
          status: 'completed', 
          progress: 100,
          suggestedTags: aiResult.suggested_tags,
          suggestedType: aiResult.document_type_suggestion,
          contentSummary: aiResult.content_summary
        } : i
      ));

      toast.success(`${item.file.name} processed successfully with AI suggestions`);

    } catch (error: any) {
      setUploadItems(prev => prev.map(i => 
        i.id === item.id ? { 
          ...i, 
          status: 'error', 
          error: error.message || 'Processing failed'
        } : i
      ));
      toast.error(`Failed to process ${item.file.name}`);
    }
  };

  const removeItem = (id: string) => {
    setUploadItems(prev => prev.filter(i => i.id !== id));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const handleUploadComplete = () => {
    const completedFiles = uploadItems
      .filter(item => item.status === 'completed')
      .map(item => ({
        file: item.file,
        url: URL.createObjectURL(item.file), // In production, this would be the actual uploaded URL
        suggestedTags: item.suggestedTags || [],
        suggestedType: item.suggestedType || 'Other',
        contentSummary: item.contentSummary || ''
      }));

    if (completedFiles.length > 0) {
      onFilesUploaded(completedFiles);
      setUploadItems([]);
      toast.success(`${completedFiles.length} files ready for upload`);
    }
  };

  const getStatusIcon = (status: FileUploadItem['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Brain className="h-4 w-4 text-primary animate-pulse" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: FileUploadItem['status']) => {
    switch (status) {
      case 'completed':
        return 'border-success bg-success/5';
      case 'error':
        return 'border-destructive bg-destructive/5';
      case 'processing':
        return 'border-primary bg-primary/5';
      default:
        return 'border-muted';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-all cursor-pointer hover:border-primary/50 ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full transition-colors ${
              isDragOver ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              <Upload className="h-8 w-8" />
            </div>
            <div>
              <div className="text-lg font-semibold mb-2">
                {isDragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
              </div>
              <div className="text-sm text-muted-foreground">
                Supports {acceptedTypes} • Max {maxSize}MB per file • Up to {maxFiles} files
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>AI-powered auto-tagging and analysis</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Queue */}
      {uploadItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Upload Queue ({uploadItems.length})
            </Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setUploadItems([])}
                variant="outline"
              >
                Clear All
              </Button>
              {uploadItems.some(item => item.status === 'completed') && (
                <Button
                  size="sm"
                  onClick={handleUploadComplete}
                >
                  Complete Upload
                </Button>
              )}
            </div>
          </div>

          {uploadItems.map((item) => (
            <Card key={item.id} className={`transition-all ${getStatusColor(item.status)}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(item.file.size)}
                        {item.status === 'processing' && ' • AI analyzing...'}
                        {item.status === 'completed' && ' • Ready'}
                      </div>
                      
                      {item.status === 'error' && item.error && (
                        <div className="text-sm text-destructive mt-1">{item.error}</div>
                      )}

                      {(item.status === 'uploading' || item.status === 'processing') && (
                        <Progress value={item.progress} className="mt-2" />
                      )}

                      {item.status === 'completed' && (
                        <div className="mt-2 space-y-2">
                          {item.suggestedType && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Suggested Type:</span>
                              <Badge variant="secondary">{item.suggestedType}</Badge>
                            </div>
                          )}
                          
                          {item.suggestedTags && item.suggestedTags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">AI Tags:</span>
                              {item.suggestedTags.slice(0, 4).map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {item.suggestedTags.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.suggestedTags.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {item.contentSummary && (
                            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              <strong>Summary:</strong> {item.contentSummary.substring(0, 150)}...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};