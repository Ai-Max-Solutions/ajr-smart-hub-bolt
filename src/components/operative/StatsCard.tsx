
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  color: string;
  bgColor: string;
  icon: string;
  trend: string;
  visual: 'bar' | 'sparkline' | 'progress' | 'pie';
  className?: string;
}

const MiniChart = ({ type, color }: { type: string; color: string }) => {
  switch (type) {
    case 'sparkline':
      return (
        <div className="flex items-end gap-0.5 h-6 w-12">
          {[3, 5, 4, 6, 8, 7, 9].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm opacity-60 bg-[#FFCC00]"
              style={{ height: `${height * 3}px` }}
            />
          ))}
        </div>
      );
    case 'progress':
      return (
        <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 bg-[#4DA6FF]"
            style={{ width: '75%' }}
          />
        </div>
      );
    case 'pie':
      return (
        <div className="relative w-6 h-6">
          <div className="w-6 h-6 rounded-full border-2 border-[#00E676] border-r-gray-600 animate-spin" 
               style={{ animationDuration: '3s' }} />
        </div>
      );
    case 'bar':
      return (
        <div className="flex items-end gap-0.5 h-6 w-8">
          {[4, 6, 5, 7].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm opacity-60 bg-[#00E676]"
              style={{ height: `${height * 2}px` }}
            />
          ))}
        </div>
      );
    default:
      return null;
  }
};

export const StatsCard = ({ 
  label, 
  value, 
  color, 
  bgColor, 
  icon, 
  trend, 
  visual,
  className 
}: StatsCardProps) => {
  return (
    <Card className={cn(
      "bg-[#1C2234] border-white/10 hover:scale-105 transition-all duration-300 hover:shadow-lg group",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgColor)}>
            <span className="text-lg">{icon}</span>
          </div>
          <div className="flex items-center gap-2">
            <MiniChart type={visual} color={color} />
            <TrendingUp className="h-4 w-4 text-[#4DA6FF] opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div>
          <p className="text-sm text-[#C7C9D9] mb-1">{label}</p>
          <p className={cn("text-xl font-bold", color)}>{value}</p>
          <p className="text-xs text-[#A1A6B3] mt-1">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
};
