
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, Settings, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

interface StickyHeaderCardProps {
  pendingCount?: number;
  systemHealth?: 'excellent' | 'good' | 'warning' | 'critical';
}

export const StickyHeaderCard: React.FC<StickyHeaderCardProps> = ({
  pendingCount = 0,
  systemHealth = 'excellent'
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = profile?.firstname || profile?.fullname || user?.email?.split('@')[0] || 'Chief';
    
    if (hour < 12) {
      return `Good morning, ${name}! ☕`;
    } else if (hour < 17) {
      return `Good afternoon, ${name}! 🔧`;
    } else {
      return `Evening, ${name}! 🌅`;
    }
  };

  const getAINudge = () => {
    if (pendingCount > 5) {
      return `${pendingCount} users pending—flush the backlog! 🚰`;
    } else if (pendingCount > 0) {
      return `${pendingCount} approvals waiting—time to unblock! 💧`;
    } else {
      return "All pipes flowing smooth—no blockages detected! ✨";
    }
  };

  const getSystemHealthConfig = () => {
    switch (systemHealth) {
      case 'excellent':
        return { 
          icon: CheckCircle, 
          color: 'bg-success/10 text-success border-success/20',
          label: 'All Systems Flowing'
        };
      case 'good':
        return { 
          icon: CheckCircle, 
          color: 'bg-aj-blue-accent/10 text-aj-blue-accent border-aj-blue-accent/20',
          label: 'Running Smooth'
        };
      case 'warning':
        return { 
          icon: AlertTriangle, 
          color: 'bg-warning/10 text-warning border-warning/20',
          label: 'Pressure Building'
        };
      case 'critical':
        return { 
          icon: AlertTriangle, 
          color: 'bg-destructive/10 text-destructive border-destructive/20',
          label: 'Emergency Repairs!'
        };
      default:
        return { 
          icon: Clock, 
          color: 'bg-muted/10 text-muted-foreground border-muted/20',
          label: 'Status Unknown'
        };
    }
  };

  const healthConfig = getSystemHealthConfig();
  const HealthIcon = healthConfig.icon;

  return (
    <Card className="sticky top-4 z-30 shadow-elevated bg-gradient-to-r from-card/95 to-card/90 backdrop-blur-sm border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left: User Info & Greeting */}
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 ring-2 ring-aj-yellow/30 ring-offset-2 ring-offset-background">
              <AvatarImage src={profile?.avatar_url} alt={profile?.firstname || 'Admin'} />
              <AvatarFallback className="bg-gradient-to-br from-aj-yellow to-aj-yellow/80 text-aj-navy-deep font-bold">
                {(profile?.firstname || profile?.fullname || user?.email || 'A').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                {getGreeting()}
              </h1>
              <p className="text-sm text-muted-foreground">
                Pipes flowing? Let's check the gauges! 🔧
              </p>
            </div>
          </div>

          {/* Right: Status & AI Nudges */}
          <div className="flex items-center gap-3">
            {/* System Health Badge */}
            <Badge className={`px-3 py-1 border-2 ${healthConfig.color}`}>
              <HealthIcon className="w-3 h-3 mr-1" />
              {healthConfig.label}
            </Badge>

            {/* Admin Mode Badge */}
            <Badge className="px-3 py-1 bg-gradient-to-r from-aj-blue-accent/10 to-aj-blue-accent/5 border-2 border-aj-blue-accent/20 text-aj-blue-accent">
              <Zap className="w-3 h-3 mr-1" />
              Admin Mode
            </Badge>

            {/* AI Nudge */}
            <div className="hidden lg:block text-sm text-muted-foreground max-w-xs">
              {getAINudge()}
            </div>

            {/* Notification Bell */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
