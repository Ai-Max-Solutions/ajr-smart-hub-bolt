import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ProgressArc } from "@/components/dashboard/ProgressArc";
import { SparklineChart } from "@/components/dashboard/SparklineChart";
import { ShipmentTracker } from "@/components/dashboard/ShipmentTracker";
import { BarChart } from "@/components/dashboard/BarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminCRUDModule from "@/components/admin/AdminCRUDModule";
import { 
  Settings, 
  Users, 
  Building2, 
  Shield, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Package,
  FileText,
  Zap,
  Activity,
  Download,
  RefreshCw
} from "lucide-react";

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState<"dashboard" | "crud">("dashboard");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for dashboard components
  const kpiData = [
    {
      title: "Total Users",
      value: "1,247",
      change: 12,
      changeLabel: "vs last month",
      icon: Users,
      trend: "up" as const,
      progress: 85,
      target: 1500,
      subtitle: "Active users across all projects"
    },
    {
      title: "Active Projects",
      value: "43",
      change: 8,
      changeLabel: "vs last month", 
      icon: Building2,
      trend: "up" as const,
      badge: "Live"
    },
    {
      title: "Compliance Rate",
      value: "97.8%",
      change: -2,
      changeLabel: "needs attention",
      icon: Shield,
      trend: "down" as const,
      progress: 98
    },
    {
      title: "System Performance",
      value: "99.2%",
      change: 1,
      changeLabel: "uptime this month",
      icon: TrendingUp,
      trend: "up" as const,
      badge: "Excellent"
    }
  ];

  const activityData = [
    {
      id: "1",
      type: "user_action" as const,
      title: "New user registration",
      description: "John Smith completed onboarding and joined Project Alpha",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      user: "System",
      status: "success" as const,
      badge: "New User"
    },
    {
      id: "2", 
      type: "alert" as const,
      title: "Compliance alert",
      description: "3 users have expiring CSCS cards in the next 30 days",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      user: "Compliance System",
      status: "warning" as const,
      badge: "Action Required"
    },
    {
      id: "3",
      type: "completion" as const,
      title: "Project milestone",
      description: "Riverside Development - Phase 1 completed successfully",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      user: "Project Manager",
      status: "success" as const,
      badge: "Milestone"
    },
    {
      id: "4",
      type: "system" as const,
      title: "System maintenance",
      description: "Automated backup completed successfully - 847GB archived",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      user: "System",
      status: "info" as const
    },
    {
      id: "5",
      type: "user_action" as const,
      title: "Role upgrade request",
      description: "Sarah Connor requested upgrade to Project Manager role",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      user: "Sarah Connor",
      status: "warning" as const,
      badge: "Pending Review"
    }
  ];

  const sparklineData = [
    { value: 45 }, { value: 52 }, { value: 48 }, { value: 61 }, { value: 55 },
    { value: 67 }, { value: 73 }, { value: 69 }, { value: 78 }, { value: 82 },
    { value: 89 }, { value: 95 }, { value: 92 }, { value: 98 }
  ];

  const shipmentData = [
    {
      id: "1",
      reference: "SH-2024-001",
      supplier: "BuildMart Ltd",
      status: "in_transit" as const,
      expectedDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      location: "Manchester Depot",
      progress: 75,
      items: [
        { name: "Steel Beams", quantity: 50, unit: "units" },
        { name: "Concrete Blocks", quantity: 200, unit: "units" }
      ],
      priority: "high" as const
    },
    {
      id: "2", 
      reference: "SH-2024-002",
      supplier: "SafeEquip Solutions",
      status: "delivered" as const,
      expectedDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      actualDate: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      location: "Site Office",
      progress: 100,
      items: [
        { name: "Safety Helmets", quantity: 100, unit: "units" },
        { name: "High-vis Vests", quantity: 150, unit: "units" }
      ]
    },
    {
      id: "3",
      reference: "SH-2024-003", 
      supplier: "PowerTools Direct",
      status: "delayed" as const,
      expectedDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      location: "Distribution Center",
      progress: 45,
      items: [
        { name: "Drilling Equipment", quantity: 12, unit: "sets" }
      ],
      priority: "medium" as const
    }
  ];

  const chartData = [
    { label: "Operatives", value: 892, color: "hsl(var(--accent))" },
    { label: "Supervisors", value: 234, color: "hsl(var(--success))" },
    { label: "Managers", value: 87, color: "hsl(var(--warning))" },
    { label: "Admins", value: 34, color: "hsl(var(--destructive))" }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  if (activeView === "crud") {
    return <AdminCRUDModule />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Admin Dashboard"
        description="Real-time insights and system management"
        icon={Settings}
        badge="Admin Only"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Admin Dashboard" }
        ]}
        actions={
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="touch" 
              onClick={() => setActiveView("crud")}
              className="font-poppins"
            >
              <FileText className="w-5 h-5 mr-2" />
              Data Management
            </Button>
            <Button 
              variant="outline" 
              size="touch" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="font-poppins"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="accent" size="touch" className="font-poppins">
              <Download className="w-5 h-5 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-lg py-8 space-y-8">
        {/* KPI Cards Row */}
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

        {/* Charts and Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Arcs */}
          <div className="grid grid-cols-2 gap-4">
            <ProgressArc
              title="System Health"
              percentage={97}
              color="accent"
              badge="Excellent"
              subtitle="Overall performance"
            />
            <ProgressArc
              title="Data Sync"
              percentage={88}
              color="success"
              badge="Good"
              subtitle="Real-time updates"
            />
          </div>

          {/* User Distribution Chart */}
          <BarChart
            title="User Distribution by Role"
            data={chartData}
            height={200}
            showValues={true}
          />

          {/* Performance Sparkline */}
          <SparklineChart
            title="Server Performance"
            data={sparklineData}
            value="98.7%"
            change={5}
            changeLabel="vs last week"
            trend="up"
            color="accent"
            showDots={true}
          />
        </div>

        {/* Activity and Shipments Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed
            title="System Activity"
            activities={activityData}
            maxItems={8}
          />
          
          <ShipmentTracker
            title="Delivery Tracking"
            shipments={shipmentData}
            maxItems={6}
            showProgress={true}
          />
        </div>

        {/* Additional Analytics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-poppins">Active Sessions</span>
                  <Badge variant="default" className="font-poppins">342</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-poppins">Pending Approvals</span>
                  <Badge variant="secondary" className="font-poppins bg-warning/20 text-warning">23</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-poppins">System Alerts</span>
                  <Badge variant="destructive" className="font-poppins">7</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-poppins">Completed Tasks</span>
                  <Badge variant="default" className="font-poppins">1,247</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-poppins">Database</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span className="text-accent font-poppins text-sm">Healthy</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-poppins">API Services</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span className="text-accent font-poppins text-sm">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-poppins">Backup System</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-warning font-poppins text-sm">Running</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-poppins">Security</span>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive font-poppins text-sm">Alert</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-poppins flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start font-poppins">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full justify-start font-poppins">
                  <Building2 className="w-4 h-4 mr-2" />
                  Project Overview
                </Button>
                <Button variant="outline" className="w-full justify-start font-poppins">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Audit
                </Button>
                <Button variant="outline" className="w-full justify-start font-poppins">
                  <Package className="w-4 h-4 mr-2" />
                  Inventory Check
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;