
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Wrench, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

interface PersonalizedHeaderProps {
  pendingCount?: number;
  systemHealth?: 'excellent' | 'good' | 'warning' | 'critical';
}

export const PersonalizedHeader: React.FC<PersonalizedHeaderProps> = ({
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

  const getWittyMessage = () => {
    if (pendingCount > 5) {
      return "Backlog building pressure—time to unblock the flow! 🚰";
    } else if (pendingCount > 0) {
      return `${pendingCount} items pending—let's flush 'em through! 💧`;
    } else {
      return "All pipes flowing smooth as silk—no leaks detected! ✨";
    }
  };

  const getHealthBadge = () => {
    switch (systemHealth) {
      case 'excellent':
        return { label: 'All Systems Flowing', variant: 'default' as const, color: 'text-success' };
      case 'good':
        return { label: 'Minor Drips Detected', variant: 'secondary' as const, color: 'text-warning' };
      case 'warning':
        return { label: 'Pressure Building', variant: 'destructive' as const, color: 'text-warning' };
      case 'critical':
        return { label: 'Emergency Repairs Needed!', variant: 'destructive' as const, color: 'text-destructive' };
      default:
        return { label: 'Status Unknown', variant: 'outline' as const, color: 'text-muted-foreground' };
    }
  };

  const healthBadge = getHealthBadge();

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-card via-card/95 to-accent/5 border-border/50 shadow-ai">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-aj-yellow/10 to-transparent transform translate-x-32 -translate-y-32" />
      </div>
      
      <CardContent className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          {/* Left: User Info & Greeting */}
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 ring-2 ring-accent/20 ring-offset-2 ring-offset-background">
              <AvatarImage src={profile?.avatar_url} alt={profile?.firstname || 'Admin'} />
              <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground font-bold">
                {(profile?.firstname || profile?.fullname || user?.email || 'A').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold font-poppins text-foreground">
                {getGreeting()}
              </h1>
              <p className="text-sm text-muted-foreground font-poppins">
                {getWittyMessage()}
              </p>
            </div>
          </div>

          {/* Right: Status & Actions */}
          <div className="flex items-center gap-3">
            {/* System Health Badge */}
            <Badge 
              variant={healthBadge.variant}
              className={cn(
                "px-3 py-1 font-poppins font-medium animate-pulse-glow",
                healthBadge.color
              )}
            >
              <Wrench className="w-3 h-3 mr-1" />
              {healthBadge.label}
            </Badge>

            {/* Admin Mode Badge */}
            <Badge variant="outline" className="px-3 py-1 font-poppins bg-gradient-to-r from-accent/10 to-accent/5 border-accent/30">
              <Zap className="w-3 h-3 mr-1 text-accent" />
              Master Control
            </Badge>

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

// Helper function for cn
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
