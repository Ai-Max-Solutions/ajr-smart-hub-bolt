import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RouteProtection } from "@/components/auth/RouteProtection";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OnboardingFlow from "./pages/OnboardingFlow";
import ProjectsManagement from "./pages/ProjectsManagement";
import OperativePortal from "./pages/OperativePortal";
import DocumentStatusChecker from "./pages/DocumentStatusChecker";
import AdminDashboard from "./pages/AdminDashboard";
import DirectorDashboard from "./pages/DirectorDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Public/General Access Routes */}
          <Route path="/check/:docId" element={<DocumentStatusChecker />} />
          
          {/* Onboarding - All authenticated users */}
          <Route 
            path="/onboarding/*" 
            element={
              <RouteProtection requiredResource="onboarding" requiredAction="read">
                <OnboardingFlow />
              </RouteProtection>
            } 
          />
          
          {/* Operative Portal - Operative role and above */}
          <Route 
            path="/operative/*" 
            element={
              <RouteProtection requiredRole={['operative', 'supervisor', 'pm', 'admin', 'dpo']}>
                <OperativePortal />
              </RouteProtection>
            } 
          />
          
          {/* Projects Management - PM role and above */}
          <Route 
            path="/projects/*" 
            element={
              <RouteProtection 
                requiredRole={['pm', 'admin', 'dpo']} 
                requiredResource="project_data" 
                requiredAction="read"
              >
                <ProjectsManagement />
              </RouteProtection>
            } 
          />
          
          {/* Admin Dashboard - Admin and DPO only */}
          <Route 
            path="/admin" 
            element={
              <RouteProtection 
                requiredRole={['admin', 'dpo']} 
                requiredResource="admin_dashboard" 
                requiredAction="read"
              >
                <AdminDashboard />
              </RouteProtection>
            } 
          />
          
          {/* Director Dashboard - Director, Admin, and DPO only */}
          <Route 
            path="/director" 
            element={
              <RouteProtection 
                requiredRole={['director', 'admin', 'dpo']} 
                requiredResource="director_dashboard" 
                requiredAction="read"
              >
                <DirectorDashboard />
              </RouteProtection>
            } 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
