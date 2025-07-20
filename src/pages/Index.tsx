
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  ClipboardList, 
  BarChart3, 
  Calendar,
  ArrowRight,
  Plus,
  Clock,
  Target,
  TrendingUp
} from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log("Index component - User:", user, "Loading:", loading);

  useEffect(() => {
    if (!loading && !user) {
      console.log("No user found, redirecting to auth");
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const quickActions = [
    {
      title: "View Projects",
      description: "Manage and view all active projects",
      icon: Building2,
      href: "/projects/dashboard",
      badge: "Active",
      color: "bg-blue-500/10 text-blue-600 border-blue-200"
    },
    {
      title: "My Work",
      description: "Track your assigned tasks and progress",
      icon: ClipboardList,
      href: "/operative/work",
      badge: "Tasks",
      color: "bg-green-500/10 text-green-600 border-green-200"
    },
    {
      title: "Timesheets",
      description: "Submit and review timesheet entries",
      icon: Clock,
      href: "/operative/timesheets",
      badge: "Weekly",
      color: "bg-purple-500/10 text-purple-600 border-purple-200"
    },
    {
      title: "Reports",
      description: "View analytics and performance reports",
      icon: BarChart3,
      href: "/admin/reports",
      badge: "Analytics",
      color: "bg-orange-500/10 text-orange-600 border-orange-200"
    }
  ];

  const adminActions = [
    {
      title: "User Management",
      description: "Manage users, roles and permissions",
      icon: Users,
      href: "/admin/users",
      badge: "Admin",
      color: "bg-red-500/10 text-red-600 border-red-200"
    },
    {
      title: "Create Project",
      description: "Set up new construction projects",
      icon: Plus,
      href: "/projects/new",
      badge: "New",
      color: "bg-indigo-500/10 text-indigo-600 border-indigo-200"
    }
  ];

  const isAdmin = user.role === 'Admin' || user.role === 'Director' || user.role === 'PM';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.user_metadata?.full_name || user.email}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,543</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-muted-foreground">
              58% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Hours logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {action.badge}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {action.description}
                  </CardDescription>
                  <Button asChild className="w-full group-hover:translate-x-1 transition-transform">
                    <Link to={action.href}>
                      Go to {action.title}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Admin Actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {adminActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card key={action.title} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {action.badge}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {action.description}
                    </CardDescription>
                    <Button asChild className="w-full group-hover:translate-x-1 transition-transform">
                      <Link to={action.href}>
                        Go to {action.title}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest project updates and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Project Woodberry Down Phase 12 updated</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New task assigned: Electrical Installation</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Timesheet submitted for review</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
