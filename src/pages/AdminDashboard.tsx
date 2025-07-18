
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/auth/withRoleGuard";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";
import AdminSystemSettings from "@/components/admin/AdminSystemSettings";
import { 
  Settings, 
  Users, 
  Building2, 
  Shield, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Download,
  RefreshCw,
  Wrench,
  Gauge,
  Truck,
  Camera
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  // Mock real-time metrics - in production, these would come from your analytics service
  const [metrics, setMetrics] = useState({
    totalUsers: 1247,
    activeSessions: 342,
    pendingApprovals: 23,
    errorRate: 0.8
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    toast({
      title: "Refreshing the Flow",
      description: "Checking all pipes for updates...",
    });
    
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data update
    setMetrics(prev => ({
      ...prev,
      activeSessions: prev.activeSessions + Math.floor(Math.random() * 10) - 5,
      pendingApprovals: Math.max(0, prev.pendingApprovals + Math.floor(Math.random() * 6) - 3),
      errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5)))
    }));
    
    setIsLoading(false);
    toast({
      title: "System Refreshed",
      description: "All flows running smooth as silk! 🔧",
    });
  };

  const kpiData = [
    {
      title: "Total Users",
      value: metrics.totalUsers.toLocaleString(),
      change: 12,
      changeLabel: "vs last month",
      icon: Users,
      trend: "up" as const,
      progress: 85,
      target: 1500,
      subtitle: "Crew size steady, no leaks!"
    },
    {
      title: "Active Sessions",
      value: metrics.activeSessions.toString(),
      change: 5,
      changeLabel: "real-time flow",
      icon: Activity,
      trend: "up" as const,
      badge: "Live",
      subtitle: "Team flowing strong"
    },
    {
      title: "Pending Approvals",
      value: metrics.pendingApprovals.toString(),
      change: -2,
      changeLabel: "backlog clearing",
      icon: Clock,
      trend: metrics.pendingApprovals > 30 ? "down" as const : "up" as const,
      progress: Math.max(0, 100 - (metrics.pendingApprovals * 2)),
      subtitle: metrics.pendingApprovals > 30 ? "Backlog? Let's unblock it!" : "Smooth flowing approvals"
    },
    {
      title: "Error Rate (24h)",
      value: `${metrics.errorRate.toFixed(1)}%`,
      change: metrics.errorRate > 1 ? 1 : -1,
      changeLabel: "system stability",
      icon: metrics.errorRate > 2 ? AlertTriangle : CheckCircle,
      trend: metrics.errorRate > 1 ? "down" as const : "up" as const,
      badge: metrics.errorRate < 1 ? "Excellent" : metrics.errorRate < 3 ? "Good" : "Needs Attention",
      subtitle: metrics.errorRate < 1 ? "Smooth sailing!" : "Time for a fix?"
    }
  ];

  return (
    <RoleGuard allowedRoles={["Admin", "DPO"]} showFunnyMessage={true}>
      <div className="min-h-screen bg-background">
        <PageHeader
          title="🔧 Master Control Room"
          description="All the valves, gauges, and switches to keep the operation flowing smooth as silk."
          icon={Wrench}
          badge={user?.role ? `⚡ Chief ${user.role}` : "Admin Control"}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Admin Dashboard" }
          ]}
          actions={
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="touch" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="font-poppins"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Checking Pipes..." : "Refresh Flow"}
              </Button>
              <Button variant="accent" size="touch" className="font-poppins">
                <Download className="w-5 h-5 mr-2" />
                Export System Report
              </Button>
            </div>
          }
        />

        <div className="container mx-auto px-lg py-8 space-y-8">
          {/* Top Metrics Cards - 2x2 Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                changeLabel={kpi.changeLabel}
                icon={kpi.icon}
                trend={kpi.trend}
                progress={kpi.progress}
                target={kpi.target}
                subtitle={kpi.subtitle}
                badge={kpi.badge}
              />
            ))}
          </div>

          {/* System Status Quick View */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins flex items-center gap-2">
                <Gauge className="w-5 h-5 text-accent" />
                System Status - All Pipes Flowing?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <span className="text-sm font-medium">Database</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm">Flowing Strong</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <span className="text-sm font-medium">API Services</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm">No Leaks</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                  <span className="text-sm font-medium">Background Jobs</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-warning text-sm">Working Hard</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <span className="text-sm font-medium">Security</span>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-destructive" />
                    <span className="text-destructive text-sm">Tight as a Pipe</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Admin Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="font-poppins">Overview</TabsTrigger>
              <TabsTrigger value="users" className="font-poppins">User Management</TabsTrigger>
              <TabsTrigger value="audit" className="font-poppins">Audit Logs</TabsTrigger>
              <TabsTrigger value="settings" className="font-poppins">System Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-poppins">Recent Activity - What's Been Flowing?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Users className="w-5 h-5 text-accent" />
                        <div>
                          <p className="font-medium">New user joined the crew</p>
                          <p className="text-sm text-muted-foreground">John Smith completed onboarding</p>
                        </div>
                        <Badge>2 min ago</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Shield className="w-5 h-5 text-warning" />
                        <div>
                          <p className="font-medium">CSCS cards expiring soon</p>
                          <p className="text-sm text-muted-foreground">3 users need renewals</p>
                        </div>
                        <Badge variant="secondary">15 min ago</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">Project milestone completed</p>
                          <p className="text-sm text-muted-foreground">Riverside Development Phase 1</p>
                        </div>
                        <Badge variant="outline">1 hour ago</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Quick Actions with AI */}
                <div className="space-y-4">
                  <h3 className="font-poppins text-lg font-semibold">AI-Powered Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-gradient-ai/10 hover:bg-gradient-ai/20">
                      <Truck className="w-6 h-6 text-accent" />
                      <span className="text-sm">AI Hire Request</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2 bg-gradient-sparkle/10 hover:bg-gradient-sparkle/20">
                      <Camera className="w-6 h-6 text-warning" />
                      <span className="text-sm">Smart POD Upload</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Users className="w-6 h-6" />
                      <span className="text-sm">Add User</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Shield className="w-6 h-6" />
                      <span className="text-sm">Security Audit</span>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <AdminUserManagement />
            </TabsContent>

            <TabsContent value="audit">
              <AdminAuditLogs />
            </TabsContent>

            <TabsContent value="settings">
              <AdminSystemSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
};

export default AdminDashboard;
