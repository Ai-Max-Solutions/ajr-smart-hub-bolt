import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users, 
  FileText, 
  Settings,
  Send,
  PoundSterling,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  HardHat,
  Wrench,
  MessageSquare,
  DollarSign,
  Bot,
  Megaphone
} from 'lucide-react';
import AIDABSAssistant from '@/components/notices/AIDABSAssistant';
import DABSCreationForm from '@/components/notices/DABSCreationForm';

interface ProjectManagerDashboardProps {
  projectId: string;
}

const ProjectManagerDashboard: React.FC<ProjectManagerDashboardProps> = ({ projectId }) => {
  const [showAIAssistant, setShowAIAssistant] = React.useState(false);
  const [showDABSForm, setShowDABSForm] = React.useState(false);
  const [aiGeneratedContent, setAIGeneratedContent] = React.useState<{title: string; content: string} | null>(null);
  const [projectName, setProjectName] = React.useState<string>('');
  
  // Fetch project name when component mounts
  React.useEffect(() => {
    const fetchProjectName = async () => {
      try {
        // In a real implementation, you'd fetch from your data source
        setProjectName('Sample Project Name'); // Replace with actual fetch
      } catch (error) {
        console.error('Error fetching project name:', error);
      }
    };
    
    fetchProjectName();
  }, [projectId]);

  // Mock data - in real implementation, this would come from your data source
  const mockData = {
    compliance: {
      ramsCompliance: { signed: 92, pending: 8 },
      inductionCompliance: { completed: 100, pending: 0 },
      toolboxTalks: { signed: 85, overdue: 5, total: 100 },
      expiringCerts: 3,
      siteNotices: { new: 1, unsigned: 2, total: 10 }
    },
    plots: {
      open: 3,
      inProgress: 7,
      completed: 15,
      totalTasks: 156,
      completedTasks: 124,
      blockers: [
        { plot: '1.02', issue: 'Missing RAMS', type: 'critical' },
        { plot: '2.15', issue: 'Operative induction pending', type: 'warning' }
      ]
    },
    timesheets: {
      pending: 8,
      disputes: 2,
      overdue: 3,
      thisWeekHours: 342,
      pieceworkUnits: 156
    },
    onHire: {
      totalItems: 23,
      dueOffHire: 4,
      overdue: 2,
      weeklySpend: 2850,
      ytdSpend: 45600,
      topSupplier: 'BuildHire Ltd'
    },
    costs: {
      dayRateSpend: 15600,
      pieceworkSpend: 8900,
      avgHoursPerOperative: 38.5,
      budgetVariance: -2.1
    },
    alerts: [
      { type: 'critical', message: '3 operatives non-compliant - Plot access suspended' },
      { type: 'warning', message: '2 hire items overdue off-hire - £280/day cost' },
      { type: 'info', message: 'New RAMS version requires 12 re-signatures' }
    ]
  };

  const getComplianceStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'bg-green-500', status: 'Good', variant: 'default' as const };
    if (percentage >= 75) return { color: 'bg-yellow-500', status: 'Warning', variant: 'secondary' as const };
    return { color: 'bg-red-500', status: 'Critical', variant: 'destructive' as const };
  };

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Project Manager Dashboard</h1>
        <p className="text-muted-foreground">Live project control panel for real-time decision making</p>
      </div>

      {/* Critical Alerts Banner */}
      {mockData.alerts.length > 0 && (
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Requires Immediate Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockData.alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {alert.type === 'critical' && <XCircle className="w-4 h-4 text-destructive" />}
                  {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  {alert.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-500" />}
                  <span className="text-sm font-medium">{alert.message}</span>
                </div>
                <Button size="sm" variant="outline">Action Required</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance Status Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* RAMS Compliance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">RAMS Signed</span>
                <Badge variant={getComplianceStatus(mockData.compliance.ramsCompliance.signed).variant}>
                  {mockData.compliance.ramsCompliance.signed}%
                </Badge>
              </div>
              <Progress value={mockData.compliance.ramsCompliance.signed} className="h-2" />
              <p className="text-xs text-muted-foreground">{mockData.compliance.ramsCompliance.pending}% pending signature</p>
            </div>

            {/* Inductions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Inductions</span>
                <Badge variant="default">100%</Badge>
              </div>
              <Progress value={100} className="h-2" />
              <p className="text-xs text-green-600">All operatives inducted</p>
            </div>

            {/* Toolbox Talks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Toolbox Talks</span>
                <Badge variant={getComplianceStatus(mockData.compliance.toolboxTalks.signed).variant}>
                  {mockData.compliance.toolboxTalks.signed}%
                </Badge>
              </div>
              <Progress value={mockData.compliance.toolboxTalks.signed} className="h-2" />
              <p className="text-xs text-muted-foreground">{mockData.compliance.toolboxTalks.overdue} overdue</p>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 space-y-2">
              <Button size="sm" variant="outline" className="w-full justify-between">
                Show Non-Compliant
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="secondary" className="w-full">
                Send Reminders
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Plots & Handovers */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-primary" />
              Plots & Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Plot Status Overview */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xl font-bold text-blue-600">{mockData.plots.open}</p>
                <p className="text-xs text-blue-600">Open</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xl font-bold text-yellow-600">{mockData.plots.inProgress}</p>
                <p className="text-xs text-yellow-600">In Progress</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xl font-bold text-green-600">{mockData.plots.completed}</p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm font-bold">{Math.round((mockData.plots.completedTasks / mockData.plots.totalTasks) * 100)}%</span>
              </div>
              <Progress value={(mockData.plots.completedTasks / mockData.plots.totalTasks) * 100} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {mockData.plots.completedTasks} of {mockData.plots.totalTasks} tasks completed
              </p>
            </div>

            {/* Blockers */}
            {mockData.plots.blockers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive">Plot Blockers</h4>
                {mockData.plots.blockers.map((blocker, index) => (
                  <div key={index} className="p-2 bg-red-50 rounded border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Plot {blocker.plot}</span>
                      <Badge variant={blocker.type === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                        {blocker.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{blocker.issue}</p>
                  </div>
                ))}
              </div>
            )}

            <Button size="sm" className="w-full">
              View Plot Details
            </Button>
          </CardContent>
        </Card>

        {/* Timesheets & Costs */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Timesheets & Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Pending Approvals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-semibold text-yellow-800">Pending Approval</p>
                  <p className="text-sm text-yellow-600">{mockData.timesheets.pending} timesheets</p>
                </div>
                <Badge variant="secondary">{mockData.timesheets.overdue} overdue</Badge>
              </div>
              
              {mockData.timesheets.disputes > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-red-800">Disputes</p>
                    <p className="text-sm text-red-600">{mockData.timesheets.disputes} require resolution</p>
                  </div>
                  <Button size="sm" variant="outline">Resolve</Button>
                </div>
              )}
            </div>

            {/* This Week Summary */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-medium">This Week</h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-muted/50 rounded">
                  <p className="text-lg font-bold">{mockData.timesheets.thisWeekHours}</p>
                  <p className="text-xs text-muted-foreground">Hours Logged</p>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <p className="text-lg font-bold">{mockData.timesheets.pieceworkUnits}</p>
                  <p className="text-xs text-muted-foreground">Piecework Units</p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-medium">Weekly Spend</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Day Rate:</span>
                  <span className="font-medium">£{mockData.costs.dayRateSpend.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Piecework:</span>
                  <span className="font-medium">£{mockData.costs.pieceworkSpend.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">£{(mockData.costs.dayRateSpend + mockData.costs.pieceworkSpend).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="default">Approve All</Button>
              <Button size="sm" variant="outline">Review</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* On-Hire Register */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" />
              On-Hire Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{mockData.onHire.totalItems}</p>
                <p className="text-xs text-muted-foreground">Items on Hire</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{mockData.onHire.dueOffHire}</p>
                <p className="text-xs text-muted-foreground">Due Off-Hire</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{mockData.onHire.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>

            {/* Cost Overview */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Weekly Spend:</span>
                <span className="text-lg font-bold text-primary">£{mockData.onHire.weeklySpend}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">YTD Total:</span>
                <span className="text-sm font-medium">£{mockData.onHire.ytdSpend.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Top Supplier:</span>
                <span className="text-sm font-medium">{mockData.onHire.topSupplier}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline">Off-Hire Request</Button>
              <Button size="sm" variant="secondary">View Register</Button>
            </div>
          </CardContent>
        </Card>

        {/* Broadcast & Communications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Communications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Pending Communications */}
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-800">New RAMS Version</p>
                    <p className="text-sm text-blue-600">Riser Pipework - Rev 2.1</p>
                  </div>
                  <Badge variant="secondary">12 signatures needed</Badge>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">Site Notice</p>
                    <p className="text-sm text-green-600">New H&S Protocol</p>
                  </div>
                  <Badge variant="outline">Ready to broadcast</Badge>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-4 border-t">
              <h4 className="text-sm font-medium">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  size="sm" 
                  onClick={() => setShowAIAssistant(true)}
                  className="justify-start btn-accent"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  AI DABS Assistant
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => setShowDABSForm(true)}
                >
                  <Megaphone className="w-4 h-4 mr-2" />
                  Quick DABS Notice
                </Button>
                <Button size="sm" variant="outline" className="justify-start">
                  <Send className="w-4 h-4 mr-2" />
                  Broadcast Site Notice
                </Button>
                <Button size="sm" variant="outline" className="justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Send Compliance Reminders
                </Button>
                <Button size="sm" variant="outline" className="justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  RAMS Re-signature Alert
                </Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-2 pt-4 border-t">
              <h4 className="text-sm font-medium">Recent Broadcasts</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Safety briefing sent to 15 operatives (2 hours ago)</p>
                <p>• Toolbox talk reminder sent (Yesterday)</p>
                <p>• Plot 1.02 update broadcast (2 days ago)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI DABS Assistant Dialog */}
      <AIDABSAssistant
        open={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onUseContent={(title, content) => {
          setAIGeneratedContent({ title, content });
          setShowDABSForm(true);
        }}
        projectName={projectName}
      />

      {/* DABS Creation Form */}
      <DABSCreationForm
        open={showDABSForm}
        onClose={() => {
          setShowDABSForm(false);
          setAIGeneratedContent(null);
        }}
        onSuccess={() => {
          setShowDABSForm(false);
          setAIGeneratedContent(null);
        }}
        initialContent={aiGeneratedContent}
      />
    </div>
  );
};

export default ProjectManagerDashboard;