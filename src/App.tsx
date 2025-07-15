import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/auth/AuthContext";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import DocumentStatusChecker from "./pages/DocumentStatusChecker";
import OnboardingFlow from "./pages/OnboardingFlow";
import OperativePortal from "./pages/OperativePortal";
import { CSCSOnboardingFlow } from "./components/onboarding/CSCSOnboardingFlow";
import ProjectsManagement from "./pages/ProjectsManagement";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import DirectorDashboard from "./pages/DirectorDashboard";
import AIAssistant from "./pages/AIAssistant";
import { Auth } from "./pages/Auth";
import ContractorAuth from "./pages/ContractorAuth";
import ContractorOnboarding from "./pages/ContractorOnboarding";
import ContractorDashboard from "./pages/ContractorDashboard";
import NotFound from "./pages/NotFound";
import InductionDemo from "./pages/InductionDemo";
import MobileDashboard from "./pages/MobileDashboard";
import { JobTrackerDashboard } from "./components/job-tracker/JobTrackerDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Public routes without navigation */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/contractor/auth" element={<ContractorAuth />} />
              <Route path="/contractor/onboarding" element={<ContractorOnboarding />} />
              <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
              <Route path="/check/:docId" element={<DocumentStatusChecker />} />
              <Route path="/beta/*" element={<InductionDemo />} />
              <Route path="/onboarding/cscs" element={<CSCSOnboardingFlow />} />
              
              {/* Protected routes with navigation */}
              <Route path="/" element={
                <AppLayout>
                  <Index />
                </AppLayout>
              } />
              
              <Route 
                path="/onboarding/*" 
                element={
                  <RouteProtection requiredResource="onboarding" requireCSCS={false}>
                    <AppLayout>
                      <OnboardingFlow />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/operative/*" 
                element={
                  <RouteProtection requiredResource="my_dashboard">
                    <AppLayout>
                      <OperativePortal />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/projects/*" 
                element={
                  <RouteProtection requiredRole={['pm', 'admin', 'supervisor']}>
                    <AppLayout>
                      <ProjectsManagement />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  <RouteProtection requiredRole={['admin', 'dpo']}>
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/admin/reports" 
                element={
                  <RouteProtection requiredRole={['admin', 'dpo', 'pm']}>
                    <AppLayout>
                      <AdminReports />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/director" 
                element={
                  <RouteProtection requiredRole={['director', 'admin', 'dpo']}>
                    <AppLayout>
                      <DirectorDashboard />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/ai-assistant" 
                element={
                  <RouteProtection fallbackPath="/auth">
                    <AppLayout>
                      <AIAssistant />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/job-tracker" 
                element={
                  <RouteProtection requiredRole={['operative', 'pm', 'admin', 'supervisor']}>
                    <AppLayout>
                      <JobTrackerDashboard />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/mobile" 
                element={
                  <RouteProtection fallbackPath="/auth">
                    <AppLayout>
                      <MobileDashboard />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;