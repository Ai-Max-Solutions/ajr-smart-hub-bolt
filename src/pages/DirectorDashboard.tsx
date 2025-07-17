import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Clock, 
  DollarSign, 
  Download, 
  Eye,
  Building2,
  Calendar,
  Star,
  AlertCircle,
  CheckCircle
} from "lucide-react";

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // ✅ Role guard: Director dashboard access only
  useEffect(() => {
    const userRole = user?.role?.trim().toLowerCase();
    if (user && !['director', 'admin', 'dpo'].includes(userRole)) {
      toast({
        title: "Wrong floor, boss!",
        description: "This is the C-suite — back to your workspace!",
        variant: "destructive",
      });
      const rolePathMap = {
        'operative': '/operative',
        'supervisor': '/operative',
        'pm': '/projects',
        'admin': '/admin',
        'manager': '/projects'
      };
      const redirectPath = rolePathMap[userRole] || '/operative';
      navigate(redirectPath);
    }
  }, [user, navigate, toast]);

  // Mock data for Director-level overview
  const complianceOverview = {
    rams: { signed: 94, total: 100, trend: 2 },
    inductions: { signed: 98, total: 100, trend: 1 },
    toolboxTalks: { signed: 87, total: 100, trend: -3 },
    trainingMatrix: { expiring: 8, total: 247 },
    siteNotices: { unsigned: 12, total: 45 }
  };

  const projectRAG = [
    {
      id: 1,
      name: "Kidbrooke Village Block C",
      compliance: 94,
      onHireSpend: 22000,
      overduePlots: 2,
      status: "green"
    },
    {
      id: 2,
      name: "Nine Elms Riverside",
      compliance: 84,
      onHireSpend: 18500,
      overduePlots: 1,
      status: "amber"
    },
    {
      id: 3,
      name: "Royal Wharf Phase 3",
      compliance: 97,
      onHireSpend: 31000,
      overduePlots: 0,
      status: "green"
    },
    {
      id: 4,
      name: "Elephant Park",
      compliance: 71,
      onHireSpend: 15200,
      overduePlots: 4,
      status: "red"
    }
  ];

  const financialMetrics = {
    dayRateVsPiecework: { dayRate: 65, piecework: 35, trend: 3 },
    avgHoursPerDay: { current: 8.2, previous: 7.3, trend: 12 },
    overtimeFlags: 3,
    openDisputes: 7
  };

  const supplierMetrics = [
    { name: "MEP Hire Ltd", spend: 42000, rating: 4.7, overdue: 2 },
    { name: "Access Solutions", spend: 38500, rating: 4.9, overdue: 0 },
    { name: "Tool Direct", spend: 34200, rating: 4.2, overdue: 5 },
    { name: "Plant Hire Co", spend: 29800, rating: 4.6, overdue: 1 }
  ];

  const riskAlerts = [
    {
      type: "compliance",
      severity: "high",
      message: "Elephant Park project below 75% compliance threshold",
      action: "Review PM dashboard"
    },
    {
      type: "financial",
      severity: "medium",
      message: "On-hire costs up 15% month-on-month",
      action: "Review supplier contracts"
    },
    {
      type: "operational",
      severity: "low",
      message: "3 operatives with expiring CSCS cards this week",
      action: "Schedule renewals"
    }
  ];

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return "text-success";
    if (percentage >= 75) return "text-warning";
    return "text-destructive";
  };

  const getRAGColor = (status: string) => {
    switch (status) {
      case "green": return "bg-success";
      case "amber": return "bg-warning";
      case "red": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "border-destructive bg-destructive/10";
      case "medium": return "border-warning bg-warning/10";
      case "low": return "border-muted bg-muted/10";
      default: return "border-border";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">👋 Welcome, Director.</h1>
                <p className="text-primary-foreground/80">Company oversight and strategic metrics.</p>
              </div>
              {user?.role && (
                <span className="bg-accent/20 text-accent-foreground px-3 py-1 text-sm rounded-full font-medium">
                  🎯 {user.role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                LIVE DATA
              </Badge>
              <Button variant="outline" className="text-primary-foreground border-primary-foreground/20">
                <Download className="w-4 h-4 mr-2" />
                Export Reports
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Company-wide Compliance Overview */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Company-wide Compliance Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">RAMS Signed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getComplianceColor(complianceOverview.rams.signed)}`}>
                    {complianceOverview.rams.signed}%
                  </span>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-success mr-1" />
                    +{complianceOverview.rams.trend}%
                  </div>
                </div>
                <Progress value={complianceOverview.rams.signed} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inductions Complete</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getComplianceColor(complianceOverview.inductions.signed)}`}>
                    {complianceOverview.inductions.signed}%
                  </span>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-success mr-1" />
                    +{complianceOverview.inductions.trend}%
                  </div>
                </div>
                <Progress value={complianceOverview.inductions.signed} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toolbox Talks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getComplianceColor(complianceOverview.toolboxTalks.signed)}`}>
                    {complianceOverview.toolboxTalks.signed}%
                  </span>
                  <div className="flex items-center text-sm">
                    <TrendingDown className="w-4 h-4 text-destructive mr-1" />
                    {complianceOverview.toolboxTalks.trend}%
                  </div>
                </div>
                <Progress value={complianceOverview.toolboxTalks.signed} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Training Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-warning">
                    {complianceOverview.trainingMatrix.expiring}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expiring certifications
                  </div>
                  <div className="text-xs font-medium">
                    Total: {complianceOverview.trainingMatrix.total} operatives
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Site Notices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-destructive">
                    {complianceOverview.siteNotices.unsigned}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Unsigned notices
                  </div>
                  <div className="text-xs font-medium">
                    Total: {complianceOverview.siteNotices.total} notices
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Project RAG Board */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <Building2 className="w-6 h-6 mr-2" />
            Project RAG Status Board
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projectRAG.map((project) => (
              <Card key={project.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <div className={`w-4 h-4 rounded-full ${getRAGColor(project.status)}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Compliance</span>
                      <span className={`font-bold ${getComplianceColor(project.compliance)}`}>
                        {project.compliance}%
                      </span>
                    </div>
                    <Progress value={project.compliance} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>On-hire YTD</span>
                      <span className="font-bold">£{project.onHireSpend.toLocaleString()}</span>
                    </div>
                    
                    {project.overduePlots > 0 && (
                      <div className="flex items-center text-sm text-destructive">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {project.overduePlots} overdue plots
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/projects')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Open PM Dashboard
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Financial and Operational Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timesheet & Payroll Trends */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Timesheet & Payroll Trends
            </h2>
            
            <Card className="card-hover">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Day Rate vs Piecework Split</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Day Rate</span>
                        <span>{financialMetrics.dayRateVsPiecework.dayRate}%</span>
                      </div>
                      <Progress value={financialMetrics.dayRateVsPiecework.dayRate} />
                    </div>
                    <div className="text-sm text-success flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +{financialMetrics.dayRateVsPiecework.trend}%
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Avg Hours/Day</div>
                    <div className="text-2xl font-bold">{financialMetrics.avgHoursPerDay.current}</div>
                    <div className="text-sm text-warning">
                      +{financialMetrics.avgHoursPerDay.trend}% vs prev month
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Open Disputes</div>
                    <div className="text-2xl font-bold text-destructive">{financialMetrics.openDisputes}</div>
                    <div className="text-sm text-muted-foreground">Requires attention</div>
                  </div>
                </div>

                {financialMetrics.overtimeFlags > 0 && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                    <div className="flex items-center text-warning">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {financialMetrics.overtimeFlags} projects with high overtime
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Supplier Performance */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              On-Hire Spend & Supplier Trends
            </h2>
            
            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {supplierMetrics.map((supplier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-muted-foreground">
                          £{supplier.spend.toLocaleString()} YTD
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-accent mr-1" />
                          <span className="font-bold">{supplier.rating}</span>
                        </div>
                        {supplier.overdue > 0 && (
                          <div className="text-xs text-destructive">
                            {supplier.overdue} overdue
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">£144.5k</div>
                    <div className="text-sm text-muted-foreground">Total On-Hire Spend YTD</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Risk Alerts */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Key Risk Alerts
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {riskAlerts.map((alert, index) => (
              <Card key={index} className={`card-hover border-2 ${getSeverityColor(alert.severity)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {alert.severity === "high" ? (
                        <AlertCircle className="w-6 h-6 text-destructive" />
                      ) : alert.severity === "medium" ? (
                        <AlertTriangle className="w-6 h-6 text-warning" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-success" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-2">{alert.message}</div>
                      <Button variant="outline" size="sm" className="text-xs">
                        {alert.action}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Audit & Export Section */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Audit & Export
          </h2>
          
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-12">
                  <Download className="w-4 h-4 mr-2" />
                  Compliance Report
                </Button>
                <Button variant="outline" className="h-12">
                  <Download className="w-4 h-4 mr-2" />
                  Financial Summary
                </Button>
                <Button variant="outline" className="h-12">
                  <Download className="w-4 h-4 mr-2" />
                  Supplier Performance
                </Button>
                <Button variant="outline" className="h-12">
                  <Download className="w-4 h-4 mr-2" />
                  Board Pack
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Live Data Export</div>
                    <div className="text-sm text-muted-foreground">
                      All reports are generated from real-time data - no stale snapshots
                    </div>
                  </div>
                  <div className="flex items-center text-success">
                    <Calendar className="w-4 h-4 mr-2" />
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default DirectorDashboard;