
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';

interface ProjectCreationSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  project: {
    id: string;
    code: string;
    name: string;
    client: string;
  } | null;
}

export const ProjectCreationSuccessDialog: React.FC<ProjectCreationSuccessDialogProps> = ({
  open,
  onClose,
  project,
}) => {
  const { profile } = useUserProfile();
  const { user } = useAuth();
  
  const firstName = profile?.firstname || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Builder';

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <DialogTitle className="text-xl font-semibold text-center">
            {project.code} – {project.name} Created
          </DialogTitle>
          
          <DialogDescription className="text-center space-y-2">
            <p className="text-base font-medium text-green-700">
              Brilliant work, {firstName}! Project is ready to roll—efficiency at its finest! 🚧💪
            </p>
            
            <p className="text-sm text-muted-foreground">
              Time to build something amazing! Every great structure starts with solid planning.
            </p>
            
            <div className="flex items-center justify-center gap-2 mt-4">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Client: {project.client}</span>
            </div>
            
            <Badge variant="outline" className="mt-2">
              Project ID: {project.id.slice(-8)}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={onClose}
            className="w-full sm:w-auto bg-aj-yellow hover:bg-aj-yellow/90 text-aj-navy-deep font-semibold"
          >
            View Project Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
