import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ProjectDashboard } from '@/components/projects/ProjectDashboard';
import { ProjectDetails } from '@/components/projects/ProjectDetails';
import CreateProject from '@/components/projects/CreateProject';
import ProjectHeader from '@/components/projects/ProjectHeader';
import { ProjectSetupWizard } from '@/components/projects/enhanced/ProjectSetupWizard';
import { ProjectDetailsEnhanced } from '@/components/projects/enhanced/ProjectDetailsEnhanced';

const ProjectsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ✅ Role guard: PM dashboard access only
  useEffect(() => {
    const userRole = user?.role?.trim().toLowerCase();
    if (user && !['pm', 'admin', 'supervisor', 'manager'].includes(userRole)) {
      toast({
        title: "Project access denied!",
        description: "Site management needed — back to the tools!",
        variant: "destructive",
      });
      const rolePathMap = {
        'operative': '/operative',
        'supervisor': '/operative',
        'director': '/director'
      };
      const redirectPath = rolePathMap[userRole] || '/operative';
      navigate(redirectPath);
    }
  }, [user, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <ProjectHeader />
      
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/projects/dashboard" replace />} />
          <Route path="/dashboard" element={<ProjectDashboard />} />
          <Route path="/create" element={<CreateProject />} />
          <Route path="/setup-wizard" element={<ProjectSetupWizard />} />
          <Route path="/:projectId" element={<ProjectDetailsEnhanced />} />
        </Routes>
      </div>
    </div>
  );
};

export default ProjectsManagement;