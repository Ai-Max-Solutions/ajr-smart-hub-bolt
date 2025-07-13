import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  FileText, 
  Calendar,
  X
} from 'lucide-react';

interface PlotDetailsCardProps {
  plot: {
    id: string;
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'on-hold';
    assignedTo?: string;
    completedDate?: string;
    ramsRequired?: string[];
    timesheetsLinked?: number;
  };
  onClose: () => void;
}

const PlotDetailsCard = ({ plot, onClose }: PlotDetailsCardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'on-hold':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default:
        return <div className="w-5 h-5 border-2 border-muted-foreground rounded-full" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-warning text-warning-foreground">In Progress</Badge>;
      case 'on-hold':
        return <Badge variant="secondary">On Hold</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(plot.status)}
            <span>Plot {plot.name}</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {getStatusBadge(plot.status)}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {plot.assignedTo && (
          <div>
            <p className="text-sm font-medium mb-2">Assigned Operative</p>
            <div className="flex items-center space-x-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {plot.assignedTo.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{plot.assignedTo}</span>
            </div>
          </div>
        )}
        
        {plot.completedDate && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Completed: {new Date(plot.completedDate).toLocaleDateString()}</span>
          </div>
        )}
        
        {plot.ramsRequired && plot.ramsRequired.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">RAMS Required</p>
            <div className="space-y-1">
              {plot.ramsRequired.map((rams, index) => (
                <Badge key={index} variant="outline" className="text-xs mr-1">
                  {rams}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {plot.timesheetsLinked && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>{plot.timesheetsLinked} timesheets linked</span>
          </div>
        )}
        
        <div className="pt-2">
          <Button className="w-full btn-primary" size="sm">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlotDetailsCard;