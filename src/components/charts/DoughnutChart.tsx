
import React from 'react';

interface DoughnutData {
  label: string;
  value: number;
  color: string;
}

interface DoughnutChartProps {
  data: DoughnutData[];
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  className?: string;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  size = 80,
  strokeWidth = 8,
  showLabels = false,
  className = ''
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativeValue = 0;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            opacity="0.2"
          />
          
          {/* Data segments */}
          {data.map((item, index) => {
            const percentage = item.value / total;
            const dashArray = percentage * circumference;
            const dashOffset = -(cumulativeValue / total) * circumference;
            
            cumulativeValue += item.value;
            
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashArray} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-300 hover:opacity-80"
              >
                <title>{`${item.label}: ${item.value} (${(percentage * 100).toFixed(1)}%)`}</title>
              </circle>
            );
          })}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{total}</span>
        </div>
      </div>
      
      {/* Legend */}
      {showLabels && (
        <div className="space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
