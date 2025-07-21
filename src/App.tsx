import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { AppLayout } from "@/components/layout/AppLayout";
import { IndexWrapper } from "@/components/dashboard/IndexWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingProvider } from "@/context/OnboardingContext";
import Index from "./pages/Index";
import DocumentStatusChecker from "./pages/DocumentStatusChecker";
import OnboardingFlow from "./pages/OnboardingFlow";
import OperativePortal from "./pages/OperativePortal";
import { CSCSOnboardingFlow } from "./components/onboarding/CSCSOnboardingFlow";
import ProjectsManagement from "./pages/ProjectsManagement";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import DirectorDashboard from "./pages/DirectorDashboard";
import AIAssistant from "./pages/AIAssistant";
import EngineerDashboard from "./pages/EngineerDashboard";
import DocumentControllerDashboard from "./pages/DocumentControllerDashboard";
import { Auth } from "./pages/Auth";
import { UnderReview } from "./pages/UnderReview";
import ContractorAuth from "./pages/ContractorAuth";
import ContractorOnboarding from "./pages/ContractorOnboarding";
import ContractorDashboard from "./pages/ContractorDashboard";
import NotFound from "./pages/NotFound";
import InductionDemo from "./pages/InductionDemo";
import MobileDashboard from "./pages/MobileDashboard";
import WorkAssignment from "./pages/WorkAssignment";
import { JobTrackerDashboard } from "./components/job-tracker/JobTrackerDashboard";
import { SecurityHeader } from "@/components/ui/security-header";
import ProjectInfoHub from "./pages/ProjectInfoHub";
import AuthDashboard from "./pages/AuthDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <SecurityHeader />
        <Toaster />
        <Sonner />
        <BrowserRouter>
            <AuthProvider>
              <OnboardingProvider>
            <Routes>
              {/* Public routes without navigation */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/under-review" element={<UnderReview />} />
              <Route path="/contractor/auth" element={<ContractorAuth />} />
              <Route path="/contractor/onboarding" element={<ContractorOnboarding />} />
              <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
              <Route path="/check/:docId" element={<DocumentStatusChecker />} />
              <Route path="/beta/*" element={<InductionDemo />} />
              <Route path="/onboarding/cscs" element={<CSCSOnboardingFlow />} />
              
              {/* Protected routes with navigation */}
              <Route path="/" element={
                <ErrorBoundary>
                  <RouteProtection fallbackPath="/auth" requireCSCS={false}>
                    <AppLayout>
                      <IndexWrapper />
                    </AppLayout>
                  </RouteProtection>
                </ErrorBoundary>
              } />
              
              <Route 
                path="/onboarding/*" 
                element={
                  <ErrorBoundary>
                    <RouteProtection requiredResource="onboarding" requireCSCS={false}>
                      <AppLayout>
                        <OnboardingFlow />
                      </AppLayout>
                    </RouteProtection>
                  </ErrorBoundary>
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
                  <RouteProtection requiredRole={['pm', 'admin', 'supervisor', 'operative', 'director']}>
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
                path="/admin/users" 
                element={
                  <RouteProtection requiredRole={['admin', 'dpo']}>
                    <AppLayout>
                      <AdminUserManagement />
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
              
              <Route 
                path="/work-assignment" 
                element={
                  <RouteProtection requiredRole={['pm', 'admin', 'supervisor', 'operative', 'director']}>
                    <AppLayout>
                      <WorkAssignment />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/engineer-dashboard" 
                element={
                  <RouteProtection fallbackPath="/auth">
                    <AppLayout>
                      <EngineerDashboard />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/document-control" 
                element={
                  <RouteProtection fallbackPath="/auth">
                    <AppLayout>
                      <DocumentControllerDashboard />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/project-info-hub/:projectId" 
                element={
                  <RouteProtection fallbackPath="/auth">
                    <AppLayout>
                      <ProjectInfoHub />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route 
                path="/auth-dashboard" 
                element={
                  <RouteProtection requiredRole={['admin', 'director']}>
                    <AppLayout>
                      <AuthDashboard />
                    </AppLayout>
                  </RouteProtection>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
              </OnboardingProvider>
            </AuthProvider>
          </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
