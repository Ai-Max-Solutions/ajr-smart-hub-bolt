
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  FileUp, 
  Shield, 
  Zap, 
  Wrench, 
  Search,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface EnhancedQuickActionsProps {
  userName: string;
}

export const EnhancedQuickActions: React.FC<EnhancedQuickActionsProps> = ({ userName }) => {
  const quickActions = [
    {
      title: 'AI Hire Request',
      description: 'Smart recruitment—let AI find the best crew!',
      icon: Zap,
      color: 'bg-aj-blue-accent/10 text-aj-blue-accent border-aj-blue-accent/20',
      action: () => console.log('AI Hire Request'),
      wittyHint: 'No manual sifting—AI does the heavy lifting! 🤖'
    },
    {
      title: 'Smart POD Upload',
      description: 'OCR magic—turn photos into data!',
      icon: FileUp,
      color: 'bg-aj-yellow/10 text-aj-yellow border-aj-yellow/20',
      action: () => console.log('Smart POD Upload'),
      wittyHint: 'Snap, scan, sorted—like magic but better! 📱'
    },
    {
      title: 'Add New User',
      description: 'Expand the crew—no leaks in onboarding!',
      icon: UserPlus,
      color: 'bg-success/10 text-success border-success/20',
      action: () => console.log('Add New User'),
      wittyHint: 'Growing the team—quality pipes need quality people! 👷‍♂️'
    },
    {
      title: 'Security Audit',
      description: 'System health check—tight as a sealed pipe!',
      icon: Shield,
      color: 'bg-warning/10 text-warning border-warning/20',
      action: () => console.log('Security Audit'),
      wittyHint: 'Fort Knox wishes it was this secure! 🔐'
    }
  ];

  const recentActivity = [
    {
      user: 'John Smith',
      action: 'Completed CSCS upload',
      time: '2 minutes ago',
      status: 'success',
      icon: CheckCircle
    },
    {
      user: 'Sarah Johnson',
      action: 'Requested role change',
      time: '15 minutes ago',
      status: 'pending',
      icon: AlertTriangle
    },
    {
      user: 'Mike Wilson',
      action: 'Updated profile',
      time: '1 hour ago',
      status: 'success',
      icon: CheckCircle
    }
  ];

  return (
    <div className="space-y-8">
      {/* AI Quick Actions */}
      <Card className="shadow-ai">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-accent animate-pulse" />
            AI Quick Actions—{userName}'s Power Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={index}
                  className={`
                    cursor-pointer transition-all duration-300 hover:shadow-sparkline hover:-translate-y-1
                    ${action.color} border-2
                  `}
                  onClick={action.action}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-current/10 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                        <p className="text-xs opacity-80 mb-2">{action.description}</p>
                        <p className="text-xs italic opacity-60">{action.wittyHint}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-accent" />
              Recent Activity—What's Flowing in the Pipes?
            </CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${activity.status === 'success' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                      <Badge 
                        variant={activity.status === 'success' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">All quiet—fancy a brew? ☕</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                No recent activity to report—systems running smooth as silk!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
