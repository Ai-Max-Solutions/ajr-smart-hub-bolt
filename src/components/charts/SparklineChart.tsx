
import React from 'react';

interface SparklineData {
  value: number;
  label?: string;
}

interface SparklineChartProps {
  data: SparklineData[];
  color?: string;
  height?: number;
  showDots?: boolean;
  className?: string;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color = '#4DA6FF',
  height = 40,
  showDots = true,
  className = ''
}) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const width = 120;
  const padding = 4;
  const innerHeight = height - padding * 2;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = padding + (1 - (point.value - minValue) / range) * innerHeight;
    return { x, y, value: point.value };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className={`inline-block ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Fill area */}
        <path
          d={`${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
          fill="url(#sparkline-gradient)"
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Dots */}
        {showDots && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill={color}
            className="opacity-80 hover:opacity-100 transition-opacity"
          >
            <title>{point.value}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};
