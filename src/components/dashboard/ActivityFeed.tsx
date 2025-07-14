import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Clock, User, AlertTriangle, CheckCircle } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "user_action" | "system" | "alert" | "completion";
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  status?: "success" | "warning" | "error" | "info";
  badge?: string;
}

interface ActivityFeedProps {
  title?: string;
  activities: ActivityItem[];
  maxItems?: number;
  showTimestamps?: boolean;
  className?: string;
}

export function ActivityFeed({
  title = "Recent Activity",
  activities,
  maxItems = 10,
  showTimestamps = true,
  className
}: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "user_action":
        return <User className="w-4 h-4" />;
      case "system":
        return <Clock className="w-4 h-4" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4" />;
      case "completion":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return "text-accent";
      case "warning":
        return "text-warning";
      case "error":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getBadgeVariant = (status: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return "default" as const;
      case "warning":
        return "secondary" as const;
      case "error":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-poppins text-xl">{title}</CardTitle>
          <Badge variant="secondary" className="font-poppins">
            {activities.length} Total
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {displayedActivities.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground font-poppins">
              No recent activity
            </div>
          ) : (
            <div className="space-y-0">
              {displayedActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-transparent hover:border-accent",
                    index !== displayedActivities.length - 1 && "border-b border-border/50"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                    "bg-accent/20",
                    getStatusColor(activity.status)
                  )}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-poppins font-medium text-foreground text-sm leading-tight">
                          {activity.title}
                        </h4>
                        <p className="text-muted-foreground text-sm font-poppins mt-1 leading-relaxed">
                          {activity.description}
                        </p>
                        
                        {/* User info */}
                        {activity.user && (
                          <p className="text-xs text-muted-foreground font-poppins mt-2">
                            by {activity.user}
                          </p>
                        )}
                      </div>

                      {/* Right side */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {activity.badge && (
                          <Badge 
                            variant={getBadgeVariant(activity.status)} 
                            className="text-xs font-poppins"
                          >
                            {activity.badge}
                          </Badge>
                        )}
                        
                        {showTimestamps && (
                          <time className="text-xs text-muted-foreground font-poppins">
                            {formatTimestamp(activity.timestamp)}
                          </time>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}