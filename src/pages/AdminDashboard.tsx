
import { useState, useEffect } from "react";
import { EnhancedKPICard } from "@/components/dashboard/EnhancedKPICard";
import { EnhancedSystemStatus } from "@/components/admin/EnhancedSystemStatus";
import { EnhancedQuickActions } from "@/components/admin/EnhancedQuickActions";
import { StickyHeaderCard } from "@/components/admin/StickyHeaderCard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/auth/withRoleGuard";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";
import AdminSystemSettings from "@/components/admin/AdminSystemSettings";
import { 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw
} from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
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
      <AdminLayout>
        <div className="space-y-8">
          {/* Sticky Header Card */}
          <StickyHeaderCard 
            pendingCount={metrics.pendingApprovals}
            systemHealth={metrics.errorRate < 1 ? 'excellent' : metrics.errorRate < 3 ? 'good' : 'warning'}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              className="shadow-card"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Checking Pipes..." : "Refresh Flow"}
            </Button>
            <Button className="shadow-card">
              <Download className="w-5 h-5 mr-2" />
              Export System Report
            </Button>
          </div>

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
            <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm shadow-card">
              <TabsTrigger value="overview" className="data-[state=active]:bg-aj-yellow data-[state=active]:text-aj-navy-deep">
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-aj-yellow data-[state=active]:text-aj-navy-deep">
                User Management
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-aj-yellow data-[state=active]:text-aj-navy-deep">
                Audit Logs
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-aj-yellow data-[state=active]:text-aj-navy-deep">
                System Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <EnhancedQuickActions userName={profile?.firstname || profile?.fullname || 'Chief'} />
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
      </AdminLayout>
    </RoleGuard>
  );
};

export default AdminDashboard;
