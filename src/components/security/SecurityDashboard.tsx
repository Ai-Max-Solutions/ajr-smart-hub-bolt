import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Key, 
  FileText, 
  Download,
  Eye,
  Clock,
  Database,
  Users
} from 'lucide-react';
import { 
  AuditLogService, 
  SecurityMonitoringService, 
  type SecurityAuditLog 
} from '@/lib/security';

interface SecurityDashboardProps {
  userRole: 'admin' | 'dpo';
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ userRole }) => {
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      const logs = await AuditLogService.getLogs();
      setAuditLogs(logs.slice(0, 50)); // Latest 50 logs

      // Check for security alerts
      const alerts = await checkSecurityAlerts();
      setSecurityAlerts(alerts);
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSecurityAlerts = async (): Promise<any[]> => {
    const alerts = [];
    
    // Check for suspicious activity
    const recentLogs = await AuditLogService.getLogs({
      dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    const failedLogins = recentLogs.filter(log => log.action === 'failed_login');
    if (failedLogins.length > 10) {
      alerts.push({
        type: 'warning',
        title: 'Multiple Failed Login Attempts',
        description: `${failedLogins.length} failed login attempts in the last 24 hours`,
        action: 'Review login attempts'
      });
    }

    const bulkExports = recentLogs.filter(log => log.action === 'export');
    if (bulkExports.length > 5) {
      alerts.push({
        type: 'info',
        title: 'High Export Activity',
        description: `${bulkExports.length} data exports in the last 24 hours`,
        action: 'Review export logs'
      });
    }

    return alerts;
  };

  const exportAuditLogs = async () => {
    const logs = await AuditLogService.getLogs();
    const csvContent = [
      'Timestamp,User ID,Action,Resource,IP Address,Success,Details',
      ...logs.map(log => 
        `${log.timestamp.toISOString()},${log.userId},${log.action},${log.resource},${log.ipAddress},${log.success},${JSON.stringify(log.details || {})}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // Log the export action
    await AuditLogService.log({
      userId: 'current-user', // Replace with actual user ID
      action: 'export',
      resource: 'audit_logs',
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      success: true,
      details: { exportType: 'csv', recordCount: logs.length }
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <Key className="h-4 w-4" />;
      case 'export':
        return <Download className="h-4 w-4" />;
      case 'access':
        return <Eye className="h-4 w-4" />;
      case 'failed_login':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return 'destructive';
    switch (action) {
      case 'login':
        return 'secondary';
      case 'export':
        return 'destructive';
      case 'access':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Security Alerts
          </h3>
          {securityAlerts.map((alert, index) => (
            <Alert key={index} className={alert.type === 'warning' ? 'border-warning' : 'border-info'}>
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {alert.action}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Within normal range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Exports (24h)</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">2 pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encrypted Records</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground">All sensitive data</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="audit-logs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="data-access">Data Access</TabsTrigger>
          <TabsTrigger value="encryption">Encryption</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Security Audit Logs</CardTitle>
                  <CardDescription>
                    Complete log of all security-related activities
                  </CardDescription>
                </div>
                <Button onClick={exportAuditLogs} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getActionIcon(log.action)}
                      <div>
                        <p className="font-medium">{log.action.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.resource} • User: {log.userId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionColor(log.action, log.success)}>
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {log.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Access Control</CardTitle>
              <CardDescription>
                Role-based permissions and access patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Operative Access</h4>
                    <p className="text-sm text-muted-foreground mb-2">Own data only</p>
                    <Badge variant="secondary">24 active users</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Supervisor Access</h4>
                    <p className="text-sm text-muted-foreground mb-2">Team data only</p>
                    <Badge variant="secondary">8 active users</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Admin Access</h4>
                    <p className="text-sm text-muted-foreground mb-2">Full system access</p>
                    <Badge variant="secondary">3 active users</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encryption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encryption Status</CardTitle>
              <CardDescription>
                Data encryption and security measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Personal Data</p>
                    <p className="text-sm text-muted-foreground">AES-256 encryption</p>
                  </div>
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Encrypted
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">RAMS Documents</p>
                    <p className="text-sm text-muted-foreground">AES-256 encryption</p>
                  </div>
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Encrypted
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Signatures</p>
                    <p className="text-sm text-muted-foreground">AES-256 encryption</p>
                  </div>
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Encrypted
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>
                GDPR, ISO 27001, and industry compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">GDPR Compliance</h4>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Data retention, subject rights, and processing compliance
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">ISO 27001</h4>
                      <Badge variant="secondary">Compliant</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Information security management system
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;