import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AIDelayWarningProps {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  assignmentId: string;
}

export const AIDelayWarning: React.FC<AIDelayWarningProps> = ({
  riskLevel,
  reason,
}) => {
  const getWarningStyle = () => {
    switch (riskLevel) {
      case 'HIGH':
        return 'bg-red-500 text-white animate-pulse';
      case 'MEDIUM':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-yellow-500 text-white';
    }
  };

  const getIcon = () => {
    switch (riskLevel) {
      case 'HIGH':
        return <AlertTriangle className="h-3 w-3" />;
      case 'MEDIUM':
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  if (riskLevel === 'LOW') {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${getWarningStyle()}`}>
            {getIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-48">
            <div className="font-medium text-xs">⚠️ {riskLevel} Risk</div>
            <div className="text-xs mt-1">{reason}</div>
            <div className="text-xs mt-1 text-muted-foreground">
              Click avatar to reassign
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};