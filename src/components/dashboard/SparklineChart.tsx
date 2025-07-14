import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DataPoint {
  value: number;
  label?: string;
  timestamp?: string;
}

interface SparklineChartProps {
  title: string;
  data: DataPoint[];
  trend?: "up" | "down" | "neutral";
  value?: string | number;
  change?: number;
  changeLabel?: string;
  color?: "accent" | "success" | "warning" | "destructive";
  height?: number;
  showDots?: boolean;
  className?: string;
}

export function SparklineChart({
  title,
  data,
  trend = "neutral",
  value,
  change,
  changeLabel,
  color = "accent",
  height = 60,
  showDots = false,
  className
}: SparklineChartProps) {
  const getColor = () => {
    switch (color) {
      case "success":
        return "hsl(var(--success))";
      case "warning":
        return "hsl(var(--warning))";
      case "destructive":
        return "hsl(var(--destructive))";
      default:
        return "hsl(var(--accent))";
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-accent";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  // Generate SVG path from data points
  const generatePath = () => {
    if (data.length === 0) return "";

    const width = 200;
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue || 1;

    let path = "";
    
    data.forEach((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.value - minValue) / valueRange) * height;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  // Generate points for dots
  const generateDots = () => {
    if (!showDots || data.length === 0) return [];

    const width = 200;
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue || 1;

    return data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.value - minValue) / valueRange) * height;
      return { x, y, value: point.value };
    });
  };

  const path = generatePath();
  const dots = generateDots();

  return (
    <Card className={cn("hover:shadow-elevated transition-all duration-300", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-poppins text-base">{title}</CardTitle>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-poppins",
              getTrendColor()
            )}>
              <span>{change > 0 ? "+" : ""}{change}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-end justify-between">
          {/* Value */}
          <div className="flex-1">
            {value && (
              <div className="mb-3">
                <span className="text-2xl font-poppins font-bold text-foreground">
                  {value}
                </span>
                {changeLabel && (
                  <p className={cn(
                    "text-sm font-poppins mt-1",
                    getTrendColor()
                  )}>
                    {changeLabel}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sparkline Chart */}
          <div className="flex-shrink-0">
            <svg 
              width="200" 
              height={height}
              className="overflow-visible"
            >
              {/* Gradient Definition */}
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={getColor()} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={getColor()} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Fill Area */}
              {path && (
                <path
                  d={`${path} L 200 ${height} L 0 ${height} Z`}
                  fill={`url(#gradient-${title})`}
                  className="opacity-30"
                />
              )}

              {/* Line */}
              {path && (
                <path
                  d={path}
                  fill="none"
                  stroke={getColor()}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                />
              )}

              {/* Dots */}
              {showDots && dots.map((dot, index) => (
                <circle
                  key={index}
                  cx={dot.x}
                  cy={dot.y}
                  r="3"
                  fill={getColor()}
                  className="hover:r-4 transition-all duration-200"
                >
                  <title>{dot.value}</title>
                </circle>
              ))}
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}