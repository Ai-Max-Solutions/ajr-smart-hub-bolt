
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
    
    const greetings = {
      morning: [
        `Good morning, ${name}! ☕ Ready to check the flow?`,
        `Rise and grind, ${name}! 🌅 Pipes need your magic!`,
        `Morning, ${name}! ☕ Let's fix what needs fixing!`,
        `Early bird ${name}! 🐦 Time to prime the system!`
      ],
      afternoon: [
        `Good afternoon, ${name}! 🔧 Pressure holding steady?`,
        `Afternoon, ${name}! ⚙️ How's the flow looking?`,
        `Hey ${name}! 💪 Systems running like clockwork?`,
        `Midday check, ${name}! 🌞 All joints sealed tight?`
      ],
      evening: [
        `Evening, ${name}! 🌅 Time for a final system sweep!`,
        `Good evening, ${name}! 🌙 Winding down the pipework?`,
        `Evening chief ${name}! 🌆 Last call for leak checks!`,
        `Night shift, ${name}! 🌃 Everything flowing smooth?`
      ]
    };
    
    let timeGroup: keyof typeof greetings;
    if (hour < 12) timeGroup = 'morning';
    else if (hour < 17) timeGroup = 'afternoon'; 
    else timeGroup = 'evening';
    
    const messages = greetings[timeGroup];
    return messages[Math.floor(Date.now() / 300000) % messages.length]; // Changes every 5 minutes
  };

  const getAINudge = () => {
    const urgentMessages = [
      `${pendingCount} users backing up—time to clear the pipes! 🚰`,
      `Queue overflowing with ${pendingCount} requests—flush now! 💦`,
      `${pendingCount} approvals creating pressure—release the valve! ⚡`,
      `System bottleneck detected—${pendingCount} users waiting! 🔧`
    ];
    
    const moderateMessages = [
      `${pendingCount} approvals in the pipeline—steady flow needed! 💧`,
      `${pendingCount} requests flowing through—maintain pressure! 📈`,
      `Light workload of ${pendingCount}—perfect maintenance window! ⚙️`,
      `${pendingCount} users queued—system handling beautifully! ✨`
    ];
    
    const clearMessages = [
      "All pipes flowing smooth—no blockages detected! ✨",
      "System running crystal clear—zero backlog! 💎",
      "Perfect flow achieved—maintenance excellence! 🏆",
      "No leaks, no blocks, no worries—pure perfection! 🌊"
    ];
    
    if (pendingCount > 5) {
      return urgentMessages[Math.floor(Date.now() / 180000) % urgentMessages.length];
    } else if (pendingCount > 0) {
      return moderateMessages[Math.floor(Date.now() / 180000) % moderateMessages.length];
    } else {
      return clearMessages[Math.floor(Date.now() / 180000) % clearMessages.length];
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
    <Card className="sticky top-4 z-30 shadow-ai bg-gradient-to-r from-card/98 to-card/95 backdrop-blur-lg border border-border/30 rounded-2xl overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-aj-yellow/5 via-transparent to-aj-blue-accent/5 animate-pulse opacity-50" />
      
      <CardContent className="relative p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-0 lg:justify-between">
          {/* Left: Enhanced User Info & Greeting */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-14 h-14 ring-3 ring-aj-yellow/40 ring-offset-2 ring-offset-background shadow-lg">
                <AvatarImage src={profile?.avatar_url} alt={profile?.firstname || 'Admin'} />
                <AvatarFallback className="bg-gradient-to-br from-aj-yellow via-aj-yellow to-aj-yellow/90 text-aj-navy-deep font-bold text-lg">
                  {(profile?.firstname || profile?.fullname || user?.email || 'A').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background animate-pulse shadow-sm" />
            </div>
            
            <div className="space-y-1.5">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-tight">
                {getGreeting()}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                System Command Center • All gauges operational 🎛️
              </p>
            </div>
          </div>

          {/* Right: Enhanced Status & AI Nudges */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* System Health Badge with glow effect */}
            <Badge className={`px-4 py-2 border-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${healthConfig.color}`}>
              <HealthIcon className="w-4 h-4 mr-2" />
              {healthConfig.label}
            </Badge>

            {/* Admin Mode Badge with enhanced styling */}
            <Badge className="px-4 py-2 bg-gradient-to-r from-aj-blue-accent/15 to-aj-blue-accent/10 border-2 border-aj-blue-accent/30 text-aj-blue-accent font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Zap className="w-4 h-4 mr-2" />
              Master Control
            </Badge>

            {/* Enhanced AI Nudge with improved visibility */}
            <div className="hidden xl:block p-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 backdrop-blur-sm max-w-sm">
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {getAINudge()}
              </p>
            </div>

            {/* Action buttons group */}
            <div className="flex items-center gap-2">
              {/* Enhanced Notification Bell */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative hover:bg-accent/50 transition-all duration-300 hover:scale-110 p-3 rounded-xl"
              >
                <Bell className="w-5 h-5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse font-bold shadow-lg">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Button>

              {/* Enhanced Settings */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-accent/50 transition-all duration-300 hover:scale-110 p-3 rounded-xl"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile AI Nudge */}
        <div className="xl:hidden mt-4 p-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground font-medium text-center">
            {getAINudge()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
