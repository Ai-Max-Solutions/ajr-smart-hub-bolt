import { Routes, Route, Navigate } from 'react-router-dom';
import ProjectDashboard from '@/components/projects/ProjectDashboard';
import ProjectDetails from '@/components/projects/ProjectDetails';
import CreateProject from '@/components/projects/CreateProject';
import ProjectHeader from '@/components/projects/ProjectHeader';

const ProjectsManagement = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <ProjectHeader />
      
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/projects/dashboard" replace />} />
          <Route path="/dashboard" element={<ProjectDashboard />} />
          <Route path="/create" element={<CreateProject />} />
          <Route path="/:projectId" element={<ProjectDetails />} />
        </Routes>
      </div>
    </div>
  );
};

export default ProjectsManagement;