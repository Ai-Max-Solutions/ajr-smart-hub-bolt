import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  MapPin, 
  CheckCircle, 
  FileText, 
  Users, 
  Clock,
  Mic,
  QrCode,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { useNavigate } from 'react-router-dom';

interface WorkflowShortcut {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  badge?: string;
  urgent?: boolean;
}

export function MobileWorkflowShortcuts() {
  const { triggerHaptics, canUseCamera, canUseLocation } = useMobile();
  const navigate = useNavigate();
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const handleShortcut = async (action: () => void) => {
    await triggerHaptics();
    action();
  };

  const shortcuts: WorkflowShortcut[] = [
    {
      id: 'scan-document',
      title: 'Scan Document',
      description: 'Capture and process documents',
      icon: Camera,
      action: () => navigate('/projects/documents'),
      badge: canUseCamera ? undefined : 'Web Only',
    },
    {
      id: 'check-in',
      title: 'Site Check-In',
      description: 'Log your location and start work',
      icon: MapPin,
      action: () => navigate('/mobile/check-in'),
      badge: canUseLocation ? 'GPS Ready' : undefined,
    },
    {
      id: 'quick-task',
      title: 'Complete Task',
      description: 'Mark tasks as completed',
      icon: CheckCircle,
      action: () => navigate('/operative/tasks'),
      badge: '3 Due',
      urgent: true,
    },
    {
      id: 'voice-note',
      title: 'Voice Note',
      description: 'Record audio notes',
      icon: Mic,
      action: () => setIsVoiceActive(!isVoiceActive),
    },
    {
      id: 'qr-scan',
      title: 'QR Scanner',
      description: 'Scan QR codes for instant access',
      icon: QrCode,
      action: () => navigate('/demo/qr'),
    },
    {
      id: 'report-issue',
      title: 'Report Issue',
      description: 'Quick incident reporting',
      icon: AlertTriangle,
      action: () => navigate('/operative/incidents'),
      urgent: true,
    },
    {
      id: 'team-chat',
      title: 'Team Chat',
      description: 'Communicate with your team',
      icon: MessageSquare,
      action: () => navigate('/ai-assistant'),
      badge: '2 New',
    },
    {
      id: 'timesheet',
      title: 'Log Hours',
      description: 'Record your work hours',
      icon: Clock,
      action: () => navigate('/operative/timesheet'),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Button
                key={shortcut.id}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-center gap-2 text-center relative ${
                  shortcut.urgent 
                    ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleShortcut(shortcut.action)}
              >
                {shortcut.badge && (
                  <Badge 
                    variant={shortcut.urgent ? "destructive" : "secondary"}
                    className="absolute -top-2 -right-2 text-xs"
                  >
                    {shortcut.badge}
                  </Badge>
                )}
                
                <Icon className={`w-6 h-6 ${
                  shortcut.urgent ? 'text-red-600' : 'text-gray-600'
                }`} />
                
                <div>
                  <div className={`font-medium text-sm ${
                    shortcut.urgent ? 'text-red-700' : 'text-gray-900'
                  }`}>
                    {shortcut.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {shortcut.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {isVoiceActive && (
          <Card className="mt-4 border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Mic className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">Recording...</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setIsVoiceActive(false)}
              >
                Stop Recording
              </Button>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}