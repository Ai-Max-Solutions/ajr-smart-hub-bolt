
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
  RefreshCw,
  Gauge,
  FileText,
  Settings
} from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Enhanced real-time metrics with more dynamic data
  const [metrics, setMetrics] = useState({
    totalUsers: 1247,
    activeSessions: 342,
    pendingApprovals: 23,
    errorRate: 0.8,
    systemUptime: 99.97,
    dailyActions: 2847
  });

  // Real-time updates effect
  useEffect(() => {
    if (!realTimeUpdates) return;
    
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeSessions: Math.max(200, prev.activeSessions + Math.floor(Math.random() * 10) - 5),
        dailyActions: prev.dailyActions + Math.floor(Math.random() * 5),
        errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.1))
      }));
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

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
    const refreshMessages = [
      "🔧 Checking All Pipes",
      "🚰 Flushing Cache Drains", 
      "💧 Testing Pressure Points",
      "🔍 Hunting for Leaks"
    ];
    
    const randomMessage = refreshMessages[Math.floor(Math.random() * refreshMessages.length)];
    
    toast({
      title: randomMessage,
      description: "Running full system diagnostics—no leaks allowed!",
    });
    
    // Simulate realistic data refresh with progress
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Enhanced mock data update with more realistic changes
    setMetrics(prev => ({
      ...prev,
      activeSessions: Math.max(200, prev.activeSessions + Math.floor(Math.random() * 20) - 10),
      pendingApprovals: Math.max(0, prev.pendingApprovals + Math.floor(Math.random() * 6) - 3),
      errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.3)),
      systemUptime: Math.min(99.99, prev.systemUptime + (Math.random() * 0.02)),
      dailyActions: prev.dailyActions + Math.floor(Math.random() * 50) + 10
    }));
    
    setIsLoading(false);
    
    const successMessages = [
      "✨ All Pipes Sealed Tight!",
      "🌊 Flow Restored to Perfection",
      "🔧 System Tuned Like a Violin", 
      "💎 Running Cleaner Than Crystal"
    ];
    
    const randomSuccess = successMessages[Math.floor(Math.random() * successMessages.length)];
    
    toast({
      title: randomSuccess,
      description: "All flows running smooth as silk—no blockages detected!",
    });
  };

  // Enhanced KPI data with more personality and dynamic content
  const kpiData = [
    {
      title: "Total Crew Members",
      value: metrics.totalUsers.toLocaleString(),
      change: 12,
      changeLabel: "vs last month",
      icon: Users,
      trend: "up" as const,
      progress: Math.round((metrics.totalUsers / 1500) * 100),
      target: 1500,
      wittyMessage: getCrewMessage(),
      sparklineData: sparklineData,
      badgeVariant: "default" as const
    },
    {
      title: "Active Sessions",
      value: metrics.activeSessions.toString(),
      change: realTimeUpdates ? Math.floor(Math.random() * 10) - 5 : 5,
      changeLabel: "real-time flow",
      icon: Activity,
      trend: "up" as const,
      badge: realTimeUpdates ? "🔴 Live" : "Offline",
      wittyMessage: getSessionMessage(),
      doughnutData: sessionDoughnutData,
      badgeVariant: "secondary" as const
    },
    {
      title: "Pending Approvals",
      value: metrics.pendingApprovals.toString(),
      change: -2,
      changeLabel: "backlog clearing",
      icon: Clock,
      trend: metrics.pendingApprovals > 30 ? "down" as const : "up" as const,
      progress: Math.max(0, 100 - (metrics.pendingApprovals * 2)),
      wittyMessage: getApprovalMessage(),
      badgeVariant: metrics.pendingApprovals > 30 ? "destructive" as const : "default" as const
    },
    {
      title: "Error Rate (24h)",
      value: `${metrics.errorRate.toFixed(1)}%`,
      change: metrics.errorRate > 1 ? Math.ceil(metrics.errorRate) : -Math.ceil(Math.abs(metrics.errorRate - 1)),
      changeLabel: "system stability",
      icon: metrics.errorRate > 2 ? AlertTriangle : CheckCircle,
      trend: metrics.errorRate > 1 ? "down" as const : "up" as const,
      badge: getBadgeText(),
      wittyMessage: getErrorMessage(),
      sparklineData: [
        { value: 1.2 }, { value: 0.9 }, { value: 0.7 }, { value: 0.8 }, 
        { value: 0.6 }, { value: 0.8 }, { value: metrics.errorRate }
      ],
      badgeVariant: metrics.errorRate < 1 ? "default" as const : 
                   metrics.errorRate < 3 ? "secondary" as const : "destructive" as const
    }
  ];

  // Dynamic message generators for enhanced personality
  function getCrewMessage() {
    const messages = [
      "Crew size steady—no leaks in recruitment! 👷‍♂️",
      "Team roster solid as copper pipes! 🔧",
      "Building the crew, brick by brick! 🧱",
      "No shortage of skilled hands here! 💪"
    ];
    return messages[Math.floor(Date.now() / 60000) % messages.length];
  }

  function getSessionMessage() {
    const onsite = Math.floor((metrics.activeSessions * 0.8));
    const remote = metrics.activeSessions - onsite;
    return `${onsite} onsite, ${remote} remote—hybrid flow perfection! 🌊`;
  }

  function getApprovalMessage() {
    if (metrics.pendingApprovals > 30) return "Backlog building—time to unblock those pipes! 🚰";
    if (metrics.pendingApprovals > 15) return "Moderate flow—keep the pressure steady! 📈";
    if (metrics.pendingApprovals > 5) return "Light workload—smooth sailing ahead! ⛵";
    return "All clear—pipes flowing like a dream! ✨";
  }

  function getErrorMessage() {
    if (metrics.errorRate < 0.5) return "Flawless operation—not a single drip! 💎";
    if (metrics.errorRate < 1) return "Tight as a sealed pipe—zero leaks! 🔧";
    if (metrics.errorRate < 2) return "Minor bubbles in the system—easily fixed! 🛠️";
    return "Pressure spikes detected—time for maintenance! ⚠️";
  }

  function getBadgeText() {
    if (metrics.errorRate < 1) return "Excellent";
    if (metrics.errorRate < 3) return "Good"; 
    return "Needs Attention";
  }

  return (
    <RoleGuard allowedRoles={["Admin", "DPO"]} showFunnyMessage={true}>
      <AdminLayout>
        <div className="space-y-8">
          {/* Sticky Header Card */}
          <StickyHeaderCard 
            pendingCount={metrics.pendingApprovals}
            systemHealth={metrics.errorRate < 1 ? 'excellent' : metrics.errorRate < 3 ? 'good' : 'warning'}
          />

          {/* Enhanced Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm border border-border/50 shadow-elevated">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${realTimeUpdates ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
                <span className="text-sm font-medium text-muted-foreground">
                  {realTimeUpdates ? 'Live Updates' : 'Static View'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                className="text-xs"
              >
                {realTimeUpdates ? 'Pause' : 'Resume'} Flow
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                className="shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Checking Pipes..." : "Refresh Flow"}
              </Button>
              <Button className="shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-r from-aj-yellow to-aj-yellow/90 text-aj-navy-deep hover:from-aj-yellow/90 hover:to-aj-yellow">
                <Download className="w-5 h-5 mr-2" />
                Export System Report
              </Button>
            </div>
          </div>

          {/* Enhanced KPI Cards with Staggered Animation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map((kpi, index) => (
              <div 
                key={index}
                className="animate-fade-in opacity-0"
                style={{ 
                  animationDelay: `${index * 150}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <EnhancedKPICard
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
                  badgeVariant={kpi.badgeVariant}
                  sparklineData={kpi.sparklineData}
                  doughnutData={kpi.doughnutData}
                  className="hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* Enhanced System Status */}
          <EnhancedSystemStatus />

          {/* Enhanced Main Admin Tabs with Icons */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-md shadow-elevated border border-border/30 rounded-2xl p-1 h-auto">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-aj-yellow data-[state=active]:to-aj-yellow/90 data-[state=active]:text-aj-navy-deep data-[state=active]:shadow-card rounded-xl py-3 px-4 transition-all duration-300 hover:bg-accent/50"
              >
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-aj-yellow data-[state=active]:to-aj-yellow/90 data-[state=active]:text-aj-navy-deep data-[state=active]:shadow-card rounded-xl py-3 px-4 transition-all duration-300 hover:bg-accent/50"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Users</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="audit" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-aj-yellow data-[state=active]:to-aj-yellow/90 data-[state=active]:text-aj-navy-deep data-[state=active]:shadow-card rounded-xl py-3 px-4 transition-all duration-300 hover:bg-accent/50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Audit</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-aj-yellow data-[state=active]:to-aj-yellow/90 data-[state=active]:text-aj-navy-deep data-[state=active]:shadow-card rounded-xl py-3 px-4 transition-all duration-300 hover:bg-accent/50"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </div>
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
