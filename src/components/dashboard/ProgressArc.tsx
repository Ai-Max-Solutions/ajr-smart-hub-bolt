import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProgressArcProps {
  title: string;
  percentage: number;
  size?: "sm" | "md" | "lg";
  color?: "accent" | "success" | "warning" | "destructive";
  showValue?: boolean;
  subtitle?: string;
  badge?: string;
  className?: string;
}

export function ProgressArc({
  title,
  percentage,
  size = "md",
  color = "accent",
  showValue = true,
  subtitle,
  badge,
  className
}: ProgressArcProps) {
  const getSize = () => {
    switch (size) {
      case "sm":
        return { container: "w-24 h-24", stroke: 4 };
      case "lg":
        return { container: "w-40 h-40", stroke: 8 };
      default:
        return { container: "w-32 h-32", stroke: 6 };
    }
  };

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

  const { container, stroke } = getSize();
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className={cn("text-center hover:shadow-elevated transition-all duration-300", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-center gap-2">
          <CardTitle className="font-poppins text-lg">{title}</CardTitle>
          {badge && (
            <Badge variant="secondary" className="font-poppins text-xs">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground font-poppins">{subtitle}</p>
        )}
      </CardHeader>
      
      <CardContent className="flex flex-col items-center">
        {/* SVG Progress Arc */}
        <div className={cn("relative", container)}>
          <svg 
            className="w-full h-full transform -rotate-90" 
            viewBox="0 0 100 100"
          >
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={stroke / 2}
              strokeLinecap="round"
            />
            
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={getColor()}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: "drop-shadow(0 0 4px hsla(var(--accent), 0.3))"
              }}
            />
          </svg>
          
          {/* Center Value */}
          {showValue && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className={cn(
                  "font-poppins font-bold text-foreground",
                  size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl"
                )}>
                  {percentage}%
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Progress Bar Alternative for Small Sizes */}
        {size === "sm" && (
          <div className="w-full mt-4">
            <Progress value={percentage} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}