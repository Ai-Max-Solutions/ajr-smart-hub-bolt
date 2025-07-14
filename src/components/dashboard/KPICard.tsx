import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AJIcon } from "@/components/ui/aj-icon";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  progress?: number;
  target?: number;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  variant?: "default" | "large" | "compact";
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = "neutral",
  progress,
  target,
  subtitle,
  badge,
  badgeVariant = "secondary",
  variant = "default",
  className
}: KPICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-accent" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
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

  const isLarge = variant === "large";
  const isCompact = variant === "compact";

  return (
    <Card className={cn(
      "hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 relative overflow-hidden",
      className
    )}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
      
      <CardHeader className={cn(
        "relative",
        isCompact ? "pb-2" : "pb-3",
        isLarge ? "p-8" : "p-6"
      )}>
        <div className="flex items-center justify-between">
          <div className={cn(
            "rounded-lg flex items-center justify-center bg-accent/20",
            isLarge ? "w-14 h-14" : isCompact ? "w-8 h-8" : "w-12 h-12"
          )}>
            <AJIcon 
              icon={icon} 
              variant="yellow" 
              size={isLarge ? "lg" : isCompact ? "sm" : "default"} 
              hover={false} 
            />
          </div>
          
          <div className="flex items-center gap-2">
            {badge && (
              <Badge variant={badgeVariant} className={cn(
                "font-poppins",
                isCompact ? "text-xs px-2 py-0" : "text-sm"
              )}>
                {badge}
              </Badge>
            )}
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md bg-card/50",
                getTrendColor()
              )}>
                {getTrendIcon()}
                <span className={cn(
                  "font-poppins font-medium",
                  isCompact ? "text-xs" : "text-sm"
                )}>
                  {change > 0 ? "+" : ""}{change}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn(
        "relative",
        isLarge ? "p-8 pt-0" : isCompact ? "p-4 pt-0" : "p-6 pt-0"
      )}>
        <div className="space-y-3">
          {/* Main Value */}
          <div>
            <h3 className={cn(
              "font-poppins font-bold text-foreground",
              isLarge ? "text-4xl" : isCompact ? "text-xl" : "text-3xl"
            )}>
              {value}
            </h3>
            <p className={cn(
              "text-muted-foreground font-poppins",
              isLarge ? "text-lg" : isCompact ? "text-xs" : "text-sm",
              "mt-1"
            )}>
              {title}
            </p>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className={cn(
              "text-muted-foreground font-poppins",
              isCompact ? "text-xs" : "text-sm"
            )}>
              {subtitle}
            </p>
          )}

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={cn(
                  "text-muted-foreground font-poppins",
                  isCompact ? "text-xs" : "text-sm"
                )}>
                  Progress
                </span>
                {target && (
                  <span className={cn(
                    "text-muted-foreground font-poppins",
                    isCompact ? "text-xs" : "text-sm"
                  )}>
                    {progress}% of {target}
                  </span>
                )}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Change Label */}
          {changeLabel && (
            <p className={cn(
              "font-poppins",
              getTrendColor(),
              isCompact ? "text-xs" : "text-sm"
            )}>
              {changeLabel}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}