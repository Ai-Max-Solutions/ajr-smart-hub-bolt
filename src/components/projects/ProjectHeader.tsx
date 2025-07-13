import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Plus, Settings, ArrowLeft } from 'lucide-react';

const ProjectHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isOnProjectDetails = location.pathname.includes('/projects/') && 
                           !location.pathname.endsWith('/dashboard') && 
                           !location.pathname.endsWith('/create');

  return (
    <div className="bg-primary text-primary-foreground py-6 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {isOnProjectDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/projects/dashboard')}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">AJ Ryan SmartWork Hub</h1>
              <p className="text-primary-foreground/80">Projects Management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              PROJECTS
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Home className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {!isOnProjectDetails && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Project Overview</h2>
              <p className="text-primary-foreground/70 text-sm">
                Manage projects, assign teams, and track compliance
              </p>
            </div>
            
            {location.pathname.includes('/dashboard') && (
              <Button
                onClick={() => navigate('/projects/create')}
                className="bg-accent text-accent-foreground hover:bg-accent/90 btn-accent"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;