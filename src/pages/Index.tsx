import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/components/auth/AuthContext";
import { Building, Users, FileText, Shield, Calendar, TrendingUp, LogIn, LayoutDashboard, Activity, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { getPersonalizedGreeting, getWelcomeMessage } from "@/utils/greetings";

const Index = () => {
  const { user, session } = useAuth();

  // If user is not authenticated, show landing page with login option
  if (!session || !user) {
    return (
      <AppLayout showNavigation={false}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-lg py-12">
            {/* AJ Ryan Landing Header */}
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-8">
                <img 
                  src="/lovable-uploads/0b275deb-8a7d-4a00-85a3-ae746d59b6f1.png" 
                  alt="A&J Ryan Logo" 
                  className="w-[180px] rounded-[5px] mr-6"
                />
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-poppins">
                Modern Construction Management Platform
              </p>
              <p className="text-muted-foreground mt-3 font-poppins">
                Streamlined workflows, enhanced safety compliance, and real-time project oversight
              </p>
              
              <div className="mt-10">
                <Button asChild size="touch" variant="accent" className="font-poppins font-semibold shadow-elevated">
                  <a href="/auth">
                    <LogIn className="w-5 h-5 mr-3" />
                    Sign In to Continue
                  </a>
                </Button>
              </div>
            </div>

            {/* AJ Ryan Feature Overview */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-7 w-7 text-accent" />
                  </div>
                  <CardTitle className="font-poppins">Safety First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground font-poppins">
                    Comprehensive safety compliance tracking, risk assessments, and incident management
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-accent" />
                  </div>
                  <CardTitle className="font-poppins">Team Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground font-poppins">
                    Efficient workforce coordination, skills tracking, and resource allocation
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-7 w-7 text-accent" />
                  </div>
                  <CardTitle className="font-poppins">Real-time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground font-poppins">
                    Live project insights, performance monitoring, and predictive analytics
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Authenticated user dashboard with navigation
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Dashboard"
        description="Welcome back to AJ Ryan SmartWork Hub"
        icon={LayoutDashboard}
        badge="Home"
        breadcrumbs={[
          { label: "Home" }
        ]}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" size="touch" className="font-poppins">
              <Activity className="w-5 h-5 mr-2" />
              Activity
            </Button>
            <Button variant="accent" size="touch" className="font-poppins">
              <Zap className="w-5 h-5 mr-2" />
              Quick Actions
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-lg py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-poppins font-bold text-foreground">
                {getWelcomeMessage(user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name || user.email?.split('@')[0] || 'User')}
              </h2>
              <p className="text-muted-foreground font-poppins mt-1">
                Here's what's happening with your projects today
              </p>
            </div>
            <Badge variant="secondary" className="font-poppins">
              <Clock className="w-4 h-4 mr-2" />
              Last updated: Just now
            </Badge>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-accent" />
                </div>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-poppins font-semibold text-lg">12</h3>
                <p className="text-sm text-muted-foreground font-poppins">Active Projects</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <Badge variant="secondary" className="text-xs">Online</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-poppins font-semibold text-lg">47</h3>
                <p className="text-sm text-muted-foreground font-poppins">Team Members</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <Badge variant="default" className="text-xs">98%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-poppins font-semibold text-lg">Safe</h3>
                <p className="text-sm text-muted-foreground font-poppins">Compliance Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <Badge variant="default" className="text-xs">+12%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-poppins font-semibold text-lg">£2.4M</h3>
                <p className="text-sm text-muted-foreground font-poppins">Monthly Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins">Quick Access</CardTitle>
            <CardDescription className="font-poppins">
              Jump to your most used features and tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col font-poppins" asChild>
                <a href="/projects">
                  <Building className="h-6 w-6 mb-2 text-accent" />
                  Projects
                </a>
              </Button>
              <Button variant="outline" className="h-20 flex-col font-poppins" asChild>
                <a href="/operative">
                  <Users className="h-6 w-6 mb-2 text-accent" />
                  My Portal
                </a>
              </Button>
              <Button variant="outline" className="h-20 flex-col font-poppins" asChild>
                <a href="/ai-assistant">
                  <Zap className="h-6 w-6 mb-2 text-accent" />
                  AI Assistant
                </a>
              </Button>
              <Button variant="outline" className="h-20 flex-col font-poppins" asChild>
                <a href="/admin">
                  <Shield className="h-6 w-6 mb-2 text-accent" />
                  Admin
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
