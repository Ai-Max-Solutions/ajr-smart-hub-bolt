import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadProps {
  projectId: string;
  onUploadComplete: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  title: string;
  description: string;
  document_type: string;
  folder_id?: string;
}

const DOCUMENT_TYPES = [
  { value: 'RAMS', label: 'RAMS Documents' },
  { value: 'Drawing', label: 'Technical Drawings' },
  { value: 'Technical_Manual', label: 'Technical Manuals' },
  { value: 'RFI', label: 'RFI Responses' },
  { value: 'Correspondence', label: 'Correspondence' },
  { value: 'Health_Safety', label: 'Health & Safety' },
  { value: 'O_M_Manual', label: 'O&M Manuals' },
  { value: 'Inspection_Checklist', label: 'Inspection Checklists' },
  { value: 'Other', label: 'Other Documents' }
];

export function DocumentUpload({ projectId, onUploadComplete }: DocumentUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending' as const,
      title: file.name.split('.').slice(0, -1).join('.'),
      description: '',
      document_type: 'Other'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }

    setUploading(true);

    try {
      for (const fileData of files) {
        if (fileData.status === 'complete') continue;

        updateFile(fileData.id, { status: 'uploading', progress: 0 });

        // Upload file to storage
        const fileName = `${projectId}/${Date.now()}_${fileData.file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project-documents')
          .upload(fileName, fileData.file);

        if (uploadError) throw uploadError;

        updateFile(fileData.id, { progress: 100 });

        // Create document registry entry
        const { data: documentData, error: dbError } = await supabase
          .from('document_registry' as any)
          .insert({
            project_id: projectId,
            title: fileData.title,
            description: fileData.description,
            document_type: fileData.document_type,
            file_name: fileData.file.name,
            file_path: uploadData.path,
            file_size: fileData.file.size,
            mime_type: fileData.file.type,
            uploaded_by: user.id,
            version_number: '1.0',
            status: 'draft'
          })
          .select('id')
          .single();

        if (dbError) throw dbError;

        updateFile(fileData.id, { status: 'complete' });

        // Trigger document ingestion for AI processing
        try {
          await supabase.functions.invoke('document-ingestion', {
            body: {
              document_id: (documentData as any)?.id,
              file_path: uploadData.path,
              project_id: projectId
            }
          });
          console.log('Document ingestion triggered successfully');
        } catch (ingestionError) {
          console.warn('Document ingestion failed, but upload succeeded:', ingestionError);
        }
      }

      toast.success('All files uploaded successfully');
      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload some files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${uploading ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, DOC, DOCX, XLS, XLSX, and images up to 50MB
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Files to Upload</h3>
          
          {files.map((fileData) => (
            <Card key={fileData.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{fileData.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  {fileData.status === 'complete' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                      disabled={fileData.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Progress Bar */}
                {fileData.status === 'uploading' && (
                  <Progress value={fileData.progress} className="mb-3" />
                )}

                {/* File Details Form */}
                {fileData.status === 'pending' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`title-${fileData.id}`}>Document Title</Label>
                      <Input
                        id={`title-${fileData.id}`}
                        value={fileData.title}
                        onChange={(e) => updateFile(fileData.id, { title: e.target.value })}
                        placeholder="Enter document title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`type-${fileData.id}`}>Document Type</Label>
                      <Select
                        value={fileData.document_type}
                        onValueChange={(value) => updateFile(fileData.id, { document_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor={`description-${fileData.id}`}>Description (Optional)</Label>
                      <Textarea
                        id={`description-${fileData.id}`}
                        value={fileData.description}
                        onChange={(e) => updateFile(fileData.id, { description: e.target.value })}
                        placeholder="Enter document description"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Upload Button */}
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear All
            </Button>
            <Button 
              onClick={uploadFiles}
              disabled={uploading || files.length === 0 || files.every(f => f.status === 'complete')}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}