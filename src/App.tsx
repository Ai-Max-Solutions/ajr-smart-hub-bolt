import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/auth/AuthContext";
import { RouteProtection } from "@/components/auth/RouteProtection";
import Index from "./pages/Index";
import DocumentStatusChecker from "./pages/DocumentStatusChecker";
import OnboardingFlow from "./pages/OnboardingFlow";
import OperativePortal from "./pages/OperativePortal";
import ProjectsManagement from "./pages/ProjectsManagement";
import AdminDashboard from "./pages/AdminDashboard";
import DirectorDashboard from "./pages/DirectorDashboard";
import { Auth } from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/check/:docId" element={<DocumentStatusChecker />} />
              <Route 
                path="/onboarding/*" 
                element={
                  <RouteProtection requiredResource="onboarding">
                    <OnboardingFlow />
                  </RouteProtection>
                } 
              />
              <Route 
                path="/operative/*" 
                element={
                  <RouteProtection requiredResource="my_dashboard">
                    <OperativePortal />
                  </RouteProtection>
                } 
              />
              <Route 
                path="/projects/*" 
                element={
                  <RouteProtection requiredRole={['pm', 'admin', 'supervisor']}>
                    <ProjectsManagement />
                  </RouteProtection>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <RouteProtection requiredRole={['admin', 'dpo']}>
                    <AdminDashboard />
                  </RouteProtection>
                } 
              />
              <Route 
                path="/director" 
                element={
                  <RouteProtection requiredRole={['director', 'admin', 'dpo']}>
                    <DirectorDashboard />
                  </RouteProtection>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;