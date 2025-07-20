import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Archive, Trash2 } from 'lucide-react';

interface ArchiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  projectName: string;
  loading?: boolean;
}

interface DeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  projectName: string;
  loading?: boolean;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  projectName,
  loading = false
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-yellow-600" />
            Archive Project
          </AlertDialogTitle>
          <AlertDialogDescription>
            Archive <strong>{projectName}</strong>? This will hide it from the dashboard 
            but retain all data. You can restore it later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {loading ? 'Archiving...' : 'Archive Project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const DeleteModal: React.FC<DeleteModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  projectName,
  loading = false
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Project Forever
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong className="text-red-600">Permanently delete</strong> {' '}
              <strong>{projectName}</strong>? This will remove the project and ALL related data:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>All plots and units</li>
              <li>Work assignments and logs</li>
              <li>Team members and progress</li>
              <li>All project history</li>
            </ul>
            <p className="text-red-600 font-medium">
              This action cannot be undone. Think of the lads' graft!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Deleting...' : 'Delete Forever'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};