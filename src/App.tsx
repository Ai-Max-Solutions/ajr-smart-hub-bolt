
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { IndexWrapper } from "@/components/dashboard/IndexWrapper";
import Auth from "@/pages/Auth";
import { UserManagement } from "@/pages/UserManagement";
import { SessionManagement } from "@/components/auth/SessionManagement";


const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthErrorBoundary>
            <AuthProvider>
              <OnboardingProvider>
                <Routes>
                  <Route path="/auth/*" element={<Auth />} />
                  
                  <Route 
                    path="/" 
                    element={
                      <RouteProtection>
                        <IndexWrapper />
                      </RouteProtection>
                    } 
                  />
                  <Route 
                    path="/user-management" 
                    element={
                      <RouteProtection requiredRole={['admin', 'director']}>
                        <UserManagement />
                      </RouteProtection>
                    } 
                  />
                  <Route 
                    path="/session-management" 
                    element={
                      <RouteProtection>
                        <SessionManagement />
                      </RouteProtection>
                    } 
                  />
                </Routes>
              </OnboardingProvider>
            </AuthProvider>
          </AuthErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
