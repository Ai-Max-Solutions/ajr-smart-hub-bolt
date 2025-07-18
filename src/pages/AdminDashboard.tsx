
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnhancedKPICard } from "@/components/dashboard/EnhancedKPICard";
import { PersonalizedHeader } from "@/components/admin/PersonalizedHeader";
import { EnhancedSystemStatus } from "@/components/admin/EnhancedSystemStatus";
import { EnhancedQuickActions } from "@/components/admin/EnhancedQuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/auth/withRoleGuard";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";
import AdminSystemSettings from "@/components/admin/AdminSystemSettings";
import { 
  Users, 
  Shield, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Download,
  RefreshCw,
  Wrench
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  // Mock real-time metrics with enhanced data
  const [metrics, setMetrics] = useState({
    totalUsers: 1247,
    activeSessions: 342,
    pendingApprovals: 23,
    errorRate: 0.8
  });

  // Mock data for charts
  const sparklineData = [
    { value: 320 }, { value: 334 }, { value: 315 }, { value: 342 }, 
    { value: 356 }, { value: 342 }, { value: 339 }
  ];

  const sessionDoughnutData = [
    { label: 'Onsite', value: 274, color: 'hsl(var(--success))' },
    { label: 'Remote', value: 68, color: 'hsl(var(--warning))' }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    toast({
      title: "🔧 Checking All Pipes",
      description: "Running full system diagnostics—no leaks allowed!",
    });
    
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data update
    setMetrics(prev => ({
      ...prev,
      activeSessions: prev.activeSessions + Math.floor(Math.random() * 10) - 5,
      pendingApprovals: Math.max(0, prev.pendingApprovals + Math.floor(Math.random() * 6) - 3),
      errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5)))
    }));
    
    setIsLoading(false);
    toast({
      title: "✨ System Refreshed",
      description: "All flows running smooth as silk—no blockages detected!",
    });
  };

  const kpiData = [
    {
      title: "Total Crew Members",
      value: metrics.totalUsers.toLocaleString(),
      change: 12,
      changeLabel: "vs last month",
      icon: Users,
      trend: "up" as const,
      progress: 85,
      target: 1500,
      wittyMessage: "Crew size steady—no leaks in recruitment! 👷‍♂️",
      sparklineData: sparklineData
    },
    {
      title: "Active Sessions",
      value: metrics.activeSessions.toString(),
      change: 5,
      changeLabel: "real-time flow",
      icon: Activity,
      trend: "up" as const,
      badge: "Live",
      wittyMessage: "Team flowing strong—80% onsite keeping pipes tight! 💪",
      doughnutData: sessionDoughnutData
    },
    {
      title: "Pending Approvals",
      value: metrics.pendingApprovals.toString(),
      change: -2,
      changeLabel: "backlog clearing",
      icon: Clock,
      trend: metrics.pendingApprovals > 30 ? "down" as const : "up" as const,
      progress: Math.max(0, 100 - (metrics.pendingApprovals * 2)),
      wittyMessage: metrics.pendingApprovals > 30 ? "Backlog? Time to unblock those pipes! 🚰" : "Smooth flowing approvals—no bottlenecks! ✅"
    },
    {
      title: "Error Rate (24h)",
      value: `${metrics.errorRate.toFixed(1)}%`,
      change: metrics.errorRate > 1 ? 1 : -1,
      changeLabel: "system stability",
      icon: metrics.errorRate > 2 ? AlertTriangle : CheckCircle,
      trend: metrics.errorRate > 1 ? "down" as const : "up" as const,
      badge: metrics.errorRate < 1 ? "Excellent" : metrics.errorRate < 3 ? "Good" : "Needs Attention",
      wittyMessage: metrics.errorRate < 1 ? "Tight as a sealed pipe—zero leaks! 🔧" : "Minor drips detected—time for a quick fix? 🛠️",
      sparklineData: [
        { value: 1.2 }, { value: 0.9 }, { value: 0.7 }, { value: 0.8 }, 
        { value: 0.6 }, { value: 0.8 }, { value: metrics.errorRate }
      ]
    }
  ];

  return (
    <RoleGuard allowedRoles={["Admin", "DPO"]} showFunnyMessage={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        {/* Personalized Header */}
        <div className="p-6 pb-0">
          <PersonalizedHeader 
            pendingCount={metrics.pendingApprovals}
            systemHealth={metrics.errorRate < 1 ? 'excellent' : metrics.errorRate < 3 ? 'good' : 'warning'}
          />
        </div>

        {/* Page Header */}
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
              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Checking Pipes..." : "Refresh Flow"}
              </button>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                <Download className="w-5 h-5 mr-2" />
                Export System Report
              </button>
            </div>
          }
        />

        <div className="container mx-auto px-lg py-8 space-y-8">
          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map((kpi, index) => (
              <EnhancedKPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                changeLabel={kpi.changeLabel}
                icon={kpi.icon}
                trend={kpi.trend}
                progress={kpi.progress}
                target={kpi.target}
                wittyMessage={kpi.wittyMessage}
                badge={kpi.badge}
                sparklineData={kpi.sparklineData}
                doughnutData={kpi.doughnutData}
              />
            ))}
          </div>

          {/* Enhanced System Status */}
          <EnhancedSystemStatus />

          {/* Main Admin Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="overview" className="font-poppins data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="font-poppins data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                User Management
              </TabsTrigger>
              <TabsTrigger value="audit" className="font-poppins data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                Audit Logs
              </TabsTrigger>
              <TabsTrigger value="settings" className="font-poppins data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                System Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <EnhancedQuickActions userName={user?.name || 'Chief'} />
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
