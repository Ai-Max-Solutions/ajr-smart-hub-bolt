
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Layers, CheckCircle, ArrowRight, Settings } from 'lucide-react';

interface ProjectSuccessPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectData: {
    code: string;
    name: string;
    totalBlocks: number;
    totalLevels: number;
    totalUnits: number;
    samplePlots?: string[];
  };
  onViewDetails: () => void;
  onBackToWizard: () => void;
}

export const ProjectSuccessPopup: React.FC<ProjectSuccessPopupProps> = ({
  open,
  onOpenChange,
  projectData,
  onViewDetails,
  onBackToWizard
}) => {
  const { code, name, totalBlocks, totalLevels, totalUnits, samplePlots = [] } = projectData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <DialogTitle className="text-xl">
              {code} - {name} Summary
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Woodberry Down Phase Complete! 🚧
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Success Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <Building className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">{totalBlocks}</div>
                <div className="text-sm text-muted-foreground">Blocks Built</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
              <Layers className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold">{totalLevels}</div>
                <div className="text-sm text-muted-foreground">Levels Layered</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="font-semibold">{totalUnits} Plots Plotted</div>
              <div className="text-sm text-muted-foreground">
                Foundation for your empire!
              </div>
            </div>
          </div>

          {/* Sample Plots */}
          {samplePlots.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Sample Units:</div>
              <div className="flex flex-wrap gap-2">
                {samplePlots.slice(0, 4).map((plot, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {plot}
                  </Badge>
                ))}
                {samplePlots.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{samplePlots.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* PM Pep Talk */}
          <div className="p-4 bg-gradient-to-r from-ajryan-yellow/20 to-ajryan-yellow/10 rounded-lg border border-ajryan-yellow/20">
            <div className="font-semibold text-ajryan-dark mb-2">
              💪 PM Pep: Job Smashed, Mark!
            </div>
            <p className="text-sm text-muted-foreground">
              That's efficiency gold right there! More wins, less hours – time for the lads now. 
              What'd the PM say to the deadline? "Plumb out of luck!" You've got this! 🚧💧
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onViewDetails} className="flex-1">
            <ArrowRight className="h-4 w-4 mr-2" />
            Smash On
          </Button>
          <Button variant="outline" onClick={onBackToWizard}>
            <Settings className="h-4 w-4 mr-2" />
            Tweak?
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
