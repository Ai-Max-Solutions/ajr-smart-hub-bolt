import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, FolderOpen, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentFolder {
  id: string;
  name: string;
  folder_type: string;
  sequence_order: number;
  document_count?: number;
}

interface DocumentFoldersProps {
  projectId: string;
  activeFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

const DEFAULT_FOLDERS = [
  { name: 'RAMS Documents', folder_type: 'RAMS', sequence_order: 1 },
  { name: 'Technical Drawings', folder_type: 'Drawing', sequence_order: 2 },
  { name: 'Technical Manuals', folder_type: 'Technical_Manual', sequence_order: 3 },
  { name: 'RFI Responses', folder_type: 'RFI', sequence_order: 4 },
  { name: 'Correspondence', folder_type: 'Correspondence', sequence_order: 5 },
  { name: 'Health & Safety', folder_type: 'Health_Safety', sequence_order: 6 },
  { name: 'O&M Manuals', folder_type: 'O_M_Manual', sequence_order: 7 },
  { name: 'Inspection Checklists', folder_type: 'Inspection_Checklist', sequence_order: 8 },
  { name: 'Other Documents', folder_type: 'Other', sequence_order: 9 }
];

export function DocumentFolders({ projectId, activeFolder, onFolderSelect }: DocumentFoldersProps) {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFolders();
  }, [projectId]);

  const fetchFolders = async () => {
    try {
      // First check if folders exist for this project
      const { data: existingFolders, error: fetchError } = await supabase
        .from('document_folders' as any)
        .select(`
          id,
          name,
          folder_type,
          sequence_order
        `)
        .eq('project_id', projectId)
        .order('sequence_order');

      if (fetchError) throw fetchError;

      // If no folders exist, create default ones
      if (!existingFolders || existingFolders.length === 0) {
        await createDefaultFolders();
        return;
      }

      // Get document counts for each folder
      const foldersWithCounts = await Promise.all(
        (existingFolders as any[]).map(async (folder: any) => {
          const { count } = await supabase
            .from('document_registry' as any)
            .select('*', { count: 'exact', head: true })
            .eq('folder_id', folder.id);
          
          return {
            ...folder,
            document_count: count || 0
          } as DocumentFolder;
        })
      );

      setFolders(foldersWithCounts);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load document folders');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultFolders = async () => {
    try {
      const { data: newFolders, error } = await supabase
        .from('document_folders' as any)
        .insert(
          DEFAULT_FOLDERS.map(folder => ({
            ...folder,
            project_id: projectId
          }))
        )
        .select();

      if (error) throw error;

      const foldersWithCounts = (newFolders as any[])?.map((folder: any) => ({
        ...folder,
        document_count: 0
      } as DocumentFolder)) || [];

      setFolders(foldersWithCounts);
    } catch (error) {
      console.error('Error creating default folders:', error);
      toast.error('Failed to create document folders');
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-10 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* All Documents Option */}
      <Button
        variant={activeFolder === null ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => onFolderSelect(null)}
      >
        <FileText className="h-4 w-4 mr-2" />
        All Documents
      </Button>

      {/* Individual Folders */}
      {folders.map((folder) => (
        <Button
          key={folder.id}
          variant={activeFolder === folder.id ? "default" : "ghost"}
          className="w-full justify-between"
          onClick={() => onFolderSelect(folder.id)}
        >
          <div className="flex items-center">
            {activeFolder === folder.id ? (
              <FolderOpen className="h-4 w-4 mr-2" />
            ) : (
              <Folder className="h-4 w-4 mr-2" />
            )}
            <span className="truncate">{folder.name}</span>
          </div>
          {folder.document_count !== undefined && (
            <Badge variant="secondary" className="ml-2">
              {folder.document_count}
            </Badge>
          )}
        </Button>
      ))}

      {/* Add Custom Folder Option - for admins only */}
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground"
        size="sm"
        onClick={() => toast.info('Custom folder creation coming soon')}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Folder
      </Button>
    </div>
  );
}