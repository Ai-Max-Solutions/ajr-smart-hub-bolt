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
import { ProjectsDashboard } from '@/pages/ProjectsDashboard';

const ProjectsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ✅ Role guard: Allow viewing for all, editing for authorized roles only
  useEffect(() => {
    // All users can view projects, role-based editing is handled in components
    console.log('Projects access granted for role:', user?.role);
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<ProjectsDashboard />} />
        <Route path="/dashboard" element={<ProjectDashboard />} />
        <Route path="/create" element={<CreateProject />} />
        <Route path="/setup-wizard" element={<ProjectSetupWizard />} />
        <Route path="/:projectId" element={<ProjectDetailsEnhanced />} />
      </Routes>
    </div>
  );
};

export default ProjectsManagement;