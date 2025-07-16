import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { createBrowserRouter, RouterProvider, redirect } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/auth/AuthContext";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { AppLayout } from "@/components/layout/AppLayout";
import { IndexWrapper } from "@/components/dashboard/IndexWrapper";
import { supabase } from "@/integrations/supabase/client";
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

// Root loader - handles auth/onboarding/CSCS checks before rendering
const rootLoader = async () => {
  console.info('[Loader] Starting root route checks');
  
  try {
    // Check authentication status with explicit error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.info('[Loader] Auth error (403/token issue):', authError.message);
      return redirect('/auth');
    }
    
    if (!user) {
      console.info('[Loader] No authenticated user, redirecting to auth');
      return redirect('/auth');
    }

    // Query user data using maybeSingle() to handle missing user records gracefully
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('onboarding_completed, firstname, lastname, cscs_required, whalesync_postgres_id')
      .eq('supabase_auth_id', user.id)
      .maybeSingle();

    if (userError) {
      console.error('[Loader] Database error fetching user data:', userError);
      return redirect('/onboarding/personal-details');
    }

    // Handle new users who don't have a Users record yet
    if (!userData) {
      console.info('[Loader] No Users row - new user, redirect onboarding');
      return redirect('/onboarding/personal-details');
    }

    console.info('[Loader] User data:', userData);

    // Check if user needs to complete onboarding
    if (!userData.onboarding_completed || !userData.firstname || !userData.lastname) {
      console.info('[Loader] Redirect: Incomplete onboarding');
      return redirect('/onboarding/personal-details');
    }

    // If onboarding is completed and CSCS is required, check for valid CSCS card
    if (userData.cscs_required) {
      console.info('[Loader] Checking CSCS status for onboarded user');
      
      try {
        // Query with both possible user ID references to handle Whalesync/Supabase mapping
        const idToUse = userData.whalesync_postgres_id || user.id;
        const { data: cscsCards, error: cscsError } = await supabase
          .from('cscs_cards')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.eq.${idToUse}`)
          .order('created_at', { ascending: false });

        if (cscsError) {
          console.warn('[Loader] CSCS query error:', cscsError);
          // Continue without CSCS check if error
        } else {
          console.info('[Loader] CSCS cards query result:', { 
            cscsCards, 
            userAuthId: user.id, 
            userWhalesyncId: userData.whalesync_postgres_id 
          });

          const validCard = cscsCards?.find(card => {
            const expiryDate = new Date(card.expiry_date);
            return expiryDate > new Date();
          });

          if (!validCard) {
            console.info('[Loader] Redirect: Invalid CSCS');
            return redirect('/onboarding/cscs');
          }
        }
      } catch (cscsErr) {
        console.warn('[Loader] CSCS check failed, continuing:', cscsErr);
        // Continue to dashboard if CSCS check fails
      }
    }

    console.info('[Loader] All checks passed, proceeding to render dashboard');
    return null; // Proceed to render IndexWrapper
    
  } catch (error) {
    console.error('[Loader] Unexpected error:', error);
    return redirect('/onboarding/personal-details');
  }
};

// Create the router with loader support
const router = createBrowserRouter([
  // Public routes without navigation
  { path: "/auth", element: <Auth /> },
  { path: "/contractor/auth", element: <ContractorAuth /> },
  { path: "/contractor/onboarding", element: <ContractorOnboarding /> },
  { path: "/contractor/dashboard", element: <ContractorDashboard /> },
  { path: "/check/:docId", element: <DocumentStatusChecker /> },
  { path: "/beta/*", element: <InductionDemo /> },
  { path: "/onboarding/cscs", element: <CSCSOnboardingFlow /> },
  
  // Root route with loader - handles auth/onboarding/CSCS before mounting
  {
    path: "/",
    loader: rootLoader,
    element: (
      <AppLayout>
        <IndexWrapper />
      </AppLayout>
    )
  },
  
  // Other protected routes with RouteProtection
  {
    path: "/onboarding/*",
    element: (
      <RouteProtection requiredResource="onboarding" requireCSCS={false}>
        <AppLayout>
          <OnboardingFlow />
        </AppLayout>
      </RouteProtection>
    )
  },
  {
    path: "/operative/*",
    element: (
      <RouteProtection requiredResource="my_dashboard" requireCSCS={true}>
        <AppLayout>
          <OperativePortal />
        </AppLayout>
      </RouteProtection>
    )
  },
  {
    path: "/projects/*",
    element: (
      <RouteProtection requiredRole={['pm', 'admin', 'supervisor']}>
        <AppLayout>
          <ProjectsManagement />
        </AppLayout>
      </RouteProtection>
    )
  },
  {
    path: "/admin",
    element: (
      <RouteProtection requiredRole={['admin', 'dpo']}>
        <AppLayout>
          <AdminDashboard />
        </AppLayout>
      </RouteProtection>
    )
  },
  {
    path: "/admin/reports",
    element: (
      <RouteProtection requiredRole={['admin', 'dpo', 'pm']}>
        <AppLayout>
          <AdminReports />
        </AppLayout>
      </RouteProtection>
    )
  },
  {
    path: "/director",
    element: (
      <RouteProtection requiredRole={['director', 'admin', 'dpo']}>
        <AppLayout>
          <DirectorDashboard />
        </AppLayout>
      </RouteProtection>
    )
  },
  {
    path: "/ai-assistant",
    element: (
      <RouteProtection fallbackPath="/auth">
        <AppLayout>
          <AIAssistant />
        </AppLayout>
      </RouteProtection>
    )
  },
  {
    path: "/job-tracker",
    element: (
      <RouteProtection requiredRole={['operative', 'pm', 'admin', 'supervisor']}>
        <AppLayout>
          <JobTrackerDashboard />
        </AppLayout>
      </RouteProtection>
    )
  },
  {
    path: "/mobile",
    element: (
      <RouteProtection fallbackPath="/auth">
        <AppLayout>
          <MobileDashboard />
        </AppLayout>
      </RouteProtection>
    )
  },
  { path: "*", element: <NotFound /> }
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <RouterProvider router={router} />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;