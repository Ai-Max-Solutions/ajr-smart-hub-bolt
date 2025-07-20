import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'Planning' | 'Active' | 'Building' | 'Completed' | 'Delayed';
  className?: string;
  animated?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className, 
  animated = false 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planning':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Active':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Building':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Delayed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        getStatusColor(status),
        animated && 'animate-pulse',
        'transition-all duration-300',
        className
      )}
    >
      {status}
    </Badge>
  );
};