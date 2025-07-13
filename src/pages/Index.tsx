import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleBasedNavigation } from "@/components/navigation/RoleBasedNavigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Building, Users, FileText, Shield, Calendar, TrendingUp, LogIn } from "lucide-react";

const Index = () => {
  const { user, session } = useAuth();

  // If user is not authenticated, show landing page with login option
  if (!session || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Building className="h-12 w-12 text-primary mr-4" />
              <h1 className="text-4xl font-bold text-primary">A&J Ryan SmartWork Hub</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive Construction Management Platform
            </p>
            <p className="text-muted-foreground mt-2">
              Streamlined workflows, enhanced safety compliance, and real-time project oversight
            </p>
            
            <div className="mt-8">
              <Button asChild size="lg" className="mr-4">
                <a href="/auth">
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </a>
              </Button>
            </div>
          </div>

          {/* Feature Overview for Unauthenticated Users */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Safety First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Comprehensive safety compliance tracking and incident management
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Efficient workforce coordination and skills tracking
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Project Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Real-time insights and performance monitoring
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Building className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold text-primary">A&J Ryan SmartWork Hub</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Welcome back, {user.email}
          </p>
          <p className="text-muted-foreground mt-2">
            Streamlined workflows, enhanced safety compliance, and real-time project oversight
          </p>
        </div>

        {/* Role-Based Navigation */}
        <RoleBasedNavigation />

      </div>
    </div>
  );
};

export default Index;
