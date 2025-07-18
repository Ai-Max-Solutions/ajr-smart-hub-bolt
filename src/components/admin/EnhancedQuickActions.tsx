import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Camera, 
  Sparkles, 
  Clock, 
  MapPin, 
  Package,
  Wrench,
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HireRequestModal } from './HireRequestModal';
import { PODUploadModal } from './PODUploadModal';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  badge?: string;
  onClick: () => void;
  isAI?: boolean;
}

interface EnhancedQuickActionsProps {
  userName?: string;
}

export const EnhancedQuickActions = ({ userName = 'Chief' }: EnhancedQuickActionsProps) => {
  const { toast } = useToast();
  const [showHireModal, setShowHireModal] = useState(false);
  const [showPODModal, setShowPODModal] = useState(false);

  const handleAIAction = (actionType: string) => {
    toast({
      title: "AI Magic in Progress! ✨",
      description: "That's watertight - no leaks in this operation!",
    });
  };

  const quickActions: QuickAction[] = [
    {
      id: 'hire-company',
      title: 'AI Hire Request',
      description: 'Smart equipment booking with voice calls',
      icon: Truck,
      color: 'bg-gradient-ai',
      badge: 'AI Powered',
      isAI: true,
      onClick: () => setShowHireModal(true)
    },
    {
      id: 'pod-upload',
      title: 'Smart POD Upload',
      description: 'OCR processing with auto-extraction',
      icon: Camera,
      color: 'bg-gradient-sparkle',
      badge: 'OCR Ready',
      isAI: true,
      onClick: () => setShowPODModal(true)
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      description: 'Smart suggestions for your team',
      icon: Sparkles,
      color: 'bg-accent',
      badge: 'Beta',
      onClick: () => handleAIAction('insights')
    },
    {
      id: 'quick-approval',
      title: 'Rapid Approval',
      description: 'One-click team decisions',
      icon: Zap,
      color: 'bg-success',
      onClick: () => handleAIAction('approval')
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'hire',
      title: 'Equipment hired successfully',
      description: 'Excavator delivered to Riverside site',
      time: '5 mins ago',
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      id: 2,
      type: 'pod',
      title: '3 PODs processed via OCR',
      description: 'All delivery notes extracted perfectly',
      time: '12 mins ago',
      icon: Package,
      color: 'text-accent'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Equipment maintenance due',
      description: '2 items need servicing this week',
      time: '1 hour ago',
      icon: AlertTriangle,
      color: 'text-warning'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Wrench className="w-8 h-8 text-aj-yellow" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Control Room, {userName}!
          </h2>
          <p className="text-muted-foreground">
            AI-powered tools to keep operations flowing smooth as silk
          </p>
        </div>
      </div>

      {/* AI-Powered Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card 
              key={action.id}
              className="group relative overflow-hidden border-muted/20 hover:border-accent/50 transition-all duration-300 hover:shadow-ai cursor-pointer"
              onClick={action.onClick}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-xl ${action.color} flex items-center justify-center relative group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                    {action.isAI && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-aj-yellow rounded-full flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-aj-navy-deep" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 justify-center">
                      <h3 className="font-semibold text-card-foreground">{action.title}</h3>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                  >
                    Launch
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent AI Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Recent Activity - AI at Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div 
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className={`mt-1 ${activity.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-card-foreground">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.time}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <HireRequestModal 
        isOpen={showHireModal} 
        onClose={() => setShowHireModal(false)} 
      />
      <PODUploadModal 
        isOpen={showPODModal} 
        onClose={() => setShowPODModal(false)} 
      />
    </div>
  );
};