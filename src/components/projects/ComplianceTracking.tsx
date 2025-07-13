import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Shield, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Users,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface ComplianceTrackingProps {
  projectId: string;
}

// Mock compliance data
const complianceData = {
  overall: {
    percentage: 92,
    cscsCompliance: 85,
    ramsCompliance: 88,
    documentCompliance: 95
  },
  byWorkType: [
    { type: 'Electrical Installation', compliance: 95, total: 8, compliant: 8 },
    { type: 'Testing & Inspection', compliance: 90, total: 6, compliant: 5 },
    { type: 'First Fix', compliance: 88, total: 12, compliant: 11 },
    { type: 'Second Fix', compliance: 82, total: 10, compliant: 8 },
    { type: 'Fault Finding', compliance: 100, total: 4, compliant: 4 }
  ],
  recentActivity: [
    {
      id: '1',
      type: 'rams_signed',
      user: 'Mike Wilson',
      document: 'Electrical Installation RAMS v2.1',
      timestamp: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      type: 'cscs_verified',
      user: 'Emma Davis',
      details: 'CSCS card verified - expires 2025-06-15',
      timestamp: '2024-01-20T10:15:00Z'
    },
    {
      id: '3',
      type: 'document_uploaded',
      user: 'Sarah Johnson',
      document: 'Updated Risk Assessment',
      timestamp: '2024-01-19T16:45:00Z'
    },
    {
      id: '4',
      type: 'compliance_issue',
      user: 'Tom Brown',
      details: 'CSCS card expired - access restricted',
      timestamp: '2024-01-19T09:00:00Z'
    }
  ],
  nonCompliantMembers: [
    {
      id: '1',
      name: 'Tom Brown',
      issues: ['CSCS Expired', 'RAMS Overdue'],
      severity: 'high'
    },
    {
      id: '2', 
      name: 'James Wilson',
      issues: ['RAMS Pending'],
      severity: 'medium'
    },
    {
      id: '3',
      name: 'Lisa Taylor',
      issues: ['Document Upload Required'],
      severity: 'low'
    }
  ]
};

const ComplianceTracking = ({ projectId }: ComplianceTrackingProps) => {
  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-destructive';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-destructive text-destructive-foreground">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">Medium Risk</Badge>;
      default:
        return <Badge variant="secondary">Low Risk</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'rams_signed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'cscs_verified':
        return <Shield className="w-4 h-4 text-success" />;
      case 'document_uploaded':
        return <FileText className="w-4 h-4 text-primary" />;
      case 'compliance_issue':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${getComplianceColor(complianceData.overall.percentage)}`}>
              {complianceData.overall.percentage}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Compliance</p>
            <Progress 
              value={complianceData.overall.percentage} 
              className={`mt-2 h-2 ${getProgressColor(complianceData.overall.percentage)}`}
            />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className={`text-2xl font-bold ${getComplianceColor(complianceData.overall.cscsCompliance)}`}>
              {complianceData.overall.cscsCompliance}%
            </div>
            <p className="text-sm text-muted-foreground">CSCS Compliance</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <FileText className="w-8 h-8 text-accent mx-auto mb-2" />
            <div className={`text-2xl font-bold ${getComplianceColor(complianceData.overall.ramsCompliance)}`}>
              {complianceData.overall.ramsCompliance}%
            </div>
            <p className="text-sm text-muted-foreground">RAMS Signed</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
            <div className={`text-2xl font-bold ${getComplianceColor(complianceData.overall.documentCompliance)}`}>
              {complianceData.overall.documentCompliance}%
            </div>
            <p className="text-sm text-muted-foreground">Documents</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance by Work Type */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance by Work Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceData.byWorkType.map((workType, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{workType.type}</span>
                    <span className={`text-sm font-bold ${getComplianceColor(workType.compliance)}`}>
                      {workType.compliance}%
                    </span>
                  </div>
                  <Progress 
                    value={workType.compliance} 
                    className={`h-2 ${getProgressColor(workType.compliance)}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {workType.compliant} of {workType.total} operatives compliant
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Non-Compliant Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
              Compliance Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceData.nonCompliantMembers.map((member) => (
                <div key={member.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{member.name}</p>
                      {getSeverityBadge(member.severity)}
                    </div>
                    <div className="space-y-1">
                      {member.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-center text-xs text-muted-foreground">
                          <AlertTriangle className="w-3 h-3 mr-1 text-destructive" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {complianceData.nonCompliantMembers.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All team members are compliant!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Compliance Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Recent Compliance Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-muted/30 rounded-lg transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.user}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.document || activity.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceTracking;