
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, User, CheckCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectCreationSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  project: any;
}

export const ProjectCreationSuccessDialog: React.FC<ProjectCreationSuccessDialogProps> = ({
  open,
  onClose,
  project
}) => {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Project Created Successfully!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Project Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Project Code</span>
              <Badge variant="outline" className="font-mono">{project.code}</Badge>
            </div>
            
            <div>
              <span className="text-sm font-medium text-muted-foreground">Project Name</span>
              <p className="font-semibold">{project.name}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-muted-foreground">Client</span>
              <p className="font-medium">{project.client}</p>
            </div>
            
            {project.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Starts {format(new Date(project.start_date), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* PM Pep Message */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary mb-1">Ready to Roll!</h4>
                <p className="text-sm text-primary/80">
                  Project setup complete—time to get the lads on site and show them what we're made of! 
                  No gate we can't open, no job we can't smash! 🔐🚀
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={onClose}
            className="w-full"
            size="lg"
          >
            <span>View Project Details</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
