
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SparklineChart } from "@/components/charts/SparklineChart";
import { DoughnutChart } from "@/components/charts/DoughnutChart";

interface SparklineData {
  value: number;
  label?: string;
}

interface DoughnutData {
  label: string;
  value: number;
  color: string;
}

interface EnhancedKPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  progress?: number;
  target?: number;
  subtitle?: string;
  wittyMessage?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  sparklineData?: SparklineData[];
  doughnutData?: DoughnutData[];
  variant?: "default" | "large" | "compact";
  className?: string;
}

export function EnhancedKPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = "neutral",
  progress,
  target,
  subtitle,
  wittyMessage,
  badge,
  badgeVariant = "secondary",
  sparklineData,
  doughnutData,
  variant = "default",
  className
}: EnhancedKPICardProps) {
  const Icon = icon;

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-success";
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
      "relative overflow-hidden transition-all duration-300 hover:shadow-ai hover:-translate-y-1 group",
      "bg-gradient-to-br from-card to-card/80 border-border/50",
      className
    )}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
      
      <CardHeader className={cn(
        "relative z-10",
        isCompact ? "pb-2 p-4" : "pb-3",
        isLarge ? "p-8" : "p-6"
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className={cn(
            "rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20",
            isLarge ? "w-16 h-16" : isCompact ? "w-10 h-10" : "w-12 h-12"
          )}>
            <Icon className={cn(
              "text-accent",
              isLarge ? "w-8 h-8" : isCompact ? "w-5 h-5" : "w-6 h-6"
            )} />
          </div>
          
          <div className="flex items-center gap-2">
            {badge && (
              <Badge variant={badgeVariant} className={cn(
                "font-poppins shadow-sm",
                isCompact ? "text-xs px-2 py-0" : "text-sm"
              )}>
                {badge}
              </Badge>
            )}
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full",
                "bg-card/50 backdrop-blur-sm border border-border/50",
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

        {/* Title and Value */}
        <div className="space-y-1">
          <h3 className={cn(
            "font-poppins font-semibold text-muted-foreground",
            isCompact ? "text-sm" : "text-base"
          )}>
            {title}
          </h3>
          <div className="flex items-end gap-3">
            <span className={cn(
              "font-poppins font-bold text-foreground",
              isLarge ? "text-4xl" : isCompact ? "text-2xl" : "text-3xl"
            )}>
              {value}
            </span>
            {sparklineData && (
              <div className="mb-1">
                <SparklineChart 
                  data={sparklineData} 
                  height={isCompact ? 30 : 40}
                  color="hsl(var(--accent))"
                />
              </div>
            )}
            {doughnutData && (
              <div className="mb-1">
                <DoughnutChart 
                  data={doughnutData} 
                  size={isCompact ? 50 : 60}
                  strokeWidth={6}
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn(
        "relative z-10",
        isLarge ? "p-8 pt-0" : isCompact ? "p-4 pt-0" : "p-6 pt-0"
      )}>
        <div className="space-y-3">
          {/* Witty Message */}
          {wittyMessage && (
            <div className="p-3 rounded-lg bg-aj-yellow/10 border border-aj-yellow/20">
              <p className={cn(
                "text-aj-navy-deep font-poppins font-medium",
                isCompact ? "text-xs" : "text-sm"
              )}>
                {wittyMessage}
              </p>
            </div>
          )}

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
