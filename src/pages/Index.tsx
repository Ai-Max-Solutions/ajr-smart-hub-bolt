import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/components/auth/AuthContext";
import { Building, Users, FileText, Shield, Calendar, TrendingUp, LogIn, LayoutDashboard, Activity, Clock, Zap, Plus, Upload, Search, Settings, MessageSquare, BarChart3, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { getPersonalizedGreeting, getWelcomeMessage } from "@/utils/greetings";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, session } = useAuth();
  const [activityOpen, setActivityOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Get user profile data
  useEffect(() => {
    const getUserProfile = async () => {
      if (!user || !session) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data: userData, error } = await supabase
          .from('Users')
          .select('onboarding_completed, firstname, lastname, whalesync_postgres_id, employmentstatus')
          .eq('supabase_auth_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setProfileLoading(false);
          return;
        }

        setUserProfile(userData);
        setProfileLoading(false);
      } catch (error) {
        console.error('Error checking user profile:', error);
        setProfileLoading(false);
      }
    };

    getUserProfile();
  }, [user, session]);

  // Show loading while checking onboarding status
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Mock activity data
  const recentActivity = [
    {
      id: 1,
      type: "project_update",
      title: "Project Milestone Reached",
      description: "Thames Gateway project reached 75% completion",
      time: "2 minutes ago",
      icon: Building,
      color: "text-green-600"
    },
    {
      id: 2,
      type: "document_upload",
      title: "New RAMS Document",
      description: "Health & Safety document uploaded by John Smith",
      time: "15 minutes ago",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      id: 3,
      type: "team_update",
      title: "Team Member Added",
      description: "Sarah Johnson joined as Site Supervisor",
      time: "1 hour ago",
      icon: Users,
      color: "text-purple-600"
    },
    {
      id: 4,
      type: "compliance",
      title: "Compliance Check Completed",
      description: "Weekly safety inspection passed",
      time: "3 hours ago",
      icon: Shield,
      color: "text-green-600"
    },
    {
      id: 5,
      type: "notification",
      title: "Payment Approved",
      description: "Invoice #12345 has been approved for payment",
      time: "5 hours ago",
      icon: Calendar,
      color: "text-orange-600"
    }
  ];

  const quickActions = [
    { label: "Create New Project", icon: Plus, href: "/projects?action=create" },
    { label: "Upload Documents", icon: Upload, href: "/projects?tab=documents" },
    { label: "Search Projects", icon: Search, href: "/projects?search=true" },
    { label: "Analytics Dashboard", icon: BarChart3, href: "/analytics" },
    { label: "Team Chat", icon: MessageSquare, href: "/collaboration" },
    { label: "Settings", icon: Settings, href: "/admin" }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-aj-navy-deep to-aj-navy-light">
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
            {/* Activity Sheet */}
            <Sheet open={activityOpen} onOpenChange={setActivityOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="touch" className="font-poppins">
                  <Activity className="w-5 h-5 mr-2" />
                  Activity
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px] bg-background border-l">
                <SheetHeader className="border-b pb-4 mb-6">
                  <SheetTitle className="flex items-center gap-2 font-poppins">
                    <Activity className="w-5 h-5 text-accent" />
                    Recent Activity
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  {recentActivity.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className={`p-2 rounded-lg bg-background border ${item.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-poppins font-medium text-sm leading-5">{item.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-4">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-2 opacity-70">{item.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full font-poppins"
                    onClick={() => setActivityOpen(false)}
                  >
                    View All Activity
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="accent" size="touch" className="font-poppins">
                  <Zap className="w-5 h-5 mr-2" />
                  Quick Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-sm border shadow-elevated">
                <div className="p-2">
                  <div className="text-xs font-poppins font-medium text-muted-foreground mb-2 px-2">QUICK ACTIONS</div>
                  {quickActions.slice(0, 3).map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <DropdownMenuItem key={action.label} asChild>
                        <a 
                          href={action.href}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/10 transition-colors cursor-pointer"
                        >
                          <IconComponent className="w-4 h-4 text-accent" />
                          <span className="font-poppins text-sm">{action.label}</span>
                        </a>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator className="my-2" />
                  <div className="text-xs font-poppins font-medium text-muted-foreground mb-2 px-2">TOOLS</div>
                  {quickActions.slice(3).map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <DropdownMenuItem key={action.label} asChild>
                        <a 
                          href={action.href}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/10 transition-colors cursor-pointer"
                        >
                          <IconComponent className="w-4 h-4 text-accent" />
                          <span className="font-poppins text-sm">{action.label}</span>
                        </a>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="container mx-auto px-4 md:px-lg py-6 md:py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-aj-navy-deep/80 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-poppins font-bold text-white">
                  Good evening, {user.user_metadata?.first_name || user.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-white/80 font-poppins mt-1 text-sm md:text-base">
                  Here's what's happening with your projects today
                </p>
              </div>
              <Badge variant="secondary" className="font-poppins">
                <Clock className="w-4 h-4 mr-2" />
                Last updated: Just now
              </Badge>
            </div>
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
