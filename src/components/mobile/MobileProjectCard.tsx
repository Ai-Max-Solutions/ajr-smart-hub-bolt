import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Clock, 
  Users, 
  FileText, 
  AlertCircle,
  ChevronRight,
  Signal,
  Wifi
} from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'pending' | 'completed';
  progress: number;
  teamSize: number;
  documentsCount: number;
  urgentTasks: number;
  lastActivity: string;
  isNearby?: boolean;
  distance?: string;
}

interface MobileProjectCardProps {
  project: Project;
  compact?: boolean;
}

export function MobileProjectCard({ project, compact = false }: MobileProjectCardProps) {
  const { triggerHaptics, isOnline } = useMobile();
  const navigate = useNavigate();

  const handleProjectTap = async () => {
    await triggerHaptics();
    navigate(`/projects/${project.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (compact) {
    return (
      <Card 
        className="mb-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleProjectTap}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{project.name}</h3>
                {project.isNearby && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    <Signal className="w-3 h-3 mr-1" />
                    Nearby
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {project.distance || project.location}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {project.teamSize}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleProjectTap}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-base truncate">{project.name}</h3>
              {!isOnline && (
                <Wifi className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{project.location}</span>
              {project.isNearby && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  {project.distance}
                </Badge>
              )}
            </div>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                <Users className="w-4 h-4" />
                <span>Team</span>
              </div>
              <div className="font-semibold">{project.teamSize}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                <FileText className="w-4 h-4" />
                <span>Docs</span>
              </div>
              <div className="font-semibold">{project.documentsCount}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                <AlertCircle className="w-4 h-4" />
                <span>Urgent</span>
              </div>
              <div className={`font-semibold ${project.urgentTasks > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {project.urgentTasks}
              </div>
            </div>
          </div>

          {/* Last Activity */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Last activity</span>
            </div>
            <span className="text-gray-800">{project.lastActivity}</span>
          </div>

          {/* Quick Actions */}
          {project.urgentTasks > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full border-red-200 text-red-700 hover:bg-red-50"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              View {project.urgentTasks} Urgent Task{project.urgentTasks > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}