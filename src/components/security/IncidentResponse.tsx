import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  Shield, 
  Phone, 
  Mail, 
  Clock, 
  FileText,
  Lock,
  Users,
  Bell
} from 'lucide-react';
import { AuditLogService, SecurityMonitoringService } from '@/lib/security';

interface SecurityIncident {
  id: string;
  type: 'breach' | 'suspicious_activity' | 'failed_login' | 'unauthorized_access' | 'data_leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  title: string;
  description: string;
  detectedAt: Date;
  assignedTo?: string;
  affectedUsers?: string[];
  containmentActions?: string[];
  resolutionNotes?: string;
}

interface IncidentResponseProps {
  userRole: 'admin' | 'dpo' | 'security_officer';
}

const IncidentResponse: React.FC<IncidentResponseProps> = ({ userRole }) => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newIncidentForm, setNewIncidentForm] = useState({
    type: 'suspicious_activity' as SecurityIncident['type'],
    severity: 'medium' as SecurityIncident['severity'],
    title: '',
    description: ''
  });

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockIncidents: SecurityIncident[] = [
        {
          id: '1',
          type: 'suspicious_activity',
          severity: 'medium',
          status: 'investigating',
          title: 'Multiple Failed Login Attempts',
          description: 'User attempt to login with multiple different passwords in short timeframe',
          detectedAt: new Date('2024-01-10T14:30:00'),
          assignedTo: 'security@ajryan.co.uk',
          affectedUsers: ['user123'],
          containmentActions: ['Account temporarily locked', 'User notified via secure channel']
        },
        {
          id: '2',
          type: 'data_leak',
          severity: 'high',
          status: 'contained',
          title: 'Potential Data Export Anomaly',
          description: 'Large volume of data exported outside normal working hours',
          detectedAt: new Date('2024-01-08T02:15:00'),
          assignedTo: 'dpo@ajryan.co.uk',
          affectedUsers: ['admin456'],
          containmentActions: ['Export privileges suspended', 'Data export reviewed', 'No sensitive data confirmed leaked'],
          resolutionNotes: 'False positive - legitimate admin maintenance task'
        }
      ];

      setIncidents(mockIncidents);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createIncident = async () => {
    if (!newIncidentForm.title || !newIncidentForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    const newIncident: SecurityIncident = {
      id: crypto.randomUUID(),
      ...newIncidentForm,
      status: 'open',
      detectedAt: new Date(),
      assignedTo: userRole === 'dpo' ? 'dpo@ajryan.co.uk' : 'security@ajryan.co.uk'
    };

    setIncidents(prev => [newIncident, ...prev]);

    // Log the incident creation
    await AuditLogService.log({
      userId: 'current-user',
      action: 'override',
      resource: 'security_incident',
      resourceId: newIncident.id,
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      success: true,
      details: { action: 'incident_created', severity: newIncident.severity }
    });

    // Reset form
    setNewIncidentForm({
      type: 'suspicious_activity',
      severity: 'medium',
      title: '',
      description: ''
    });

    alert('Incident created successfully');
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: SecurityIncident['status']) => {
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: newStatus }
          : incident
      )
    );

    await AuditLogService.log({
      userId: 'current-user',
      action: 'override',
      resource: 'security_incident',
      resourceId: incidentId,
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      success: true,
      details: { action: 'status_updated', newStatus }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'secondary';
      case 'medium':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'critical':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'investigating':
        return 'destructive';
      case 'contained':
        return 'secondary';
      case 'resolved':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'breach':
        return <AlertTriangle className="h-4 w-4" />;
      case 'suspicious_activity':
        return <Shield className="h-4 w-4" />;
      case 'failed_login':
        return <Lock className="h-4 w-4" />;
      case 'unauthorized_access':
        return <Users className="h-4 w-4" />;
      case 'data_leak':
        return <FileText className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading incident response dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Emergency Contacts */}
      <Alert className="border-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Emergency Response</p>
              <p className="text-sm">For critical security incidents, contact immediately:</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                +44 (0) 20 7xxx xxxx
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                security@ajryan.co.uk
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {incidents.filter(i => i.status === 'open').length}
            </div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investigating</CardTitle>
            <Shield className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {incidents.filter(i => i.status === 'investigating').length}
            </div>
            <p className="text-xs text-muted-foreground">Under investigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents.filter(i => 
                i.status === 'resolved' && 
                i.detectedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">In last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <Bell className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents.filter(i => i.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">Require DPO notification</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incidents">Active Incidents</TabsTrigger>
          <TabsTrigger value="create">Create Incident</TabsTrigger>
          <TabsTrigger value="procedures">Response Procedures</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>
                Current and recent security incidents requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(incident.type)}
                        <div>
                          <p className="font-medium">{incident.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {incident.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Detected</p>
                        <p className="text-muted-foreground">
                          {incident.detectedAt.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Assigned To</p>
                        <p className="text-muted-foreground">
                          {incident.assignedTo || 'Unassigned'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Affected Users</p>
                        <p className="text-muted-foreground">
                          {incident.affectedUsers?.length || 0} users
                        </p>
                      </div>
                    </div>

                    {incident.containmentActions && incident.containmentActions.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-sm mb-1">Containment Actions:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {incident.containmentActions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      {incident.status === 'open' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateIncidentStatus(incident.id, 'investigating')}
                        >
                          Start Investigation
                        </Button>
                      )}
                      {incident.status === 'investigating' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateIncidentStatus(incident.id, 'contained')}
                        >
                          Mark Contained
                        </Button>
                      )}
                      {incident.status === 'contained' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Security Incident</CardTitle>
              <CardDescription>
                Report a new security incident or suspicious activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incident-type">Incident Type</Label>
                  <select 
                    id="incident-type"
                    className="w-full p-2 border rounded-md"
                    value={newIncidentForm.type}
                    onChange={(e) => setNewIncidentForm(prev => ({ 
                      ...prev, 
                      type: e.target.value as SecurityIncident['type'] 
                    }))}
                  >
                    <option value="suspicious_activity">Suspicious Activity</option>
                    <option value="failed_login">Failed Login</option>
                    <option value="unauthorized_access">Unauthorized Access</option>
                    <option value="data_leak">Data Leak</option>
                    <option value="breach">Security Breach</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="incident-severity">Severity</Label>
                  <select 
                    id="incident-severity"
                    className="w-full p-2 border rounded-md"
                    value={newIncidentForm.severity}
                    onChange={(e) => setNewIncidentForm(prev => ({ 
                      ...prev, 
                      severity: e.target.value as SecurityIncident['severity'] 
                    }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="incident-title">Incident Title</Label>
                <Input
                  id="incident-title"
                  value={newIncidentForm.title}
                  onChange={(e) => setNewIncidentForm(prev => ({ 
                    ...prev, 
                    title: e.target.value 
                  }))}
                  placeholder="Brief description of the incident"
                />
              </div>

              <div>
                <Label htmlFor="incident-description">Description</Label>
                <Textarea
                  id="incident-description"
                  value={newIncidentForm.description}
                  onChange={(e) => setNewIncidentForm(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  placeholder="Detailed description of what happened, when, and any observed impact"
                  rows={4}
                />
              </div>

              <Button onClick={createIncident} className="w-full">
                Create Incident
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procedures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Response Procedures</CardTitle>
              <CardDescription>
                Standard operating procedures for security incident response
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">1. Immediate Response (0-15 minutes)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Assess the severity and scope of the incident</li>
                  <li>Contain the threat if possible (lock accounts, disable access)</li>
                  <li>Notify the security team and DPO for high/critical incidents</li>
                  <li>Document all actions taken</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">2. Investigation (15 minutes - 4 hours)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Gather evidence and audit logs</li>
                  <li>Identify affected systems and users</li>
                  <li>Determine the root cause</li>
                  <li>Assess data impact and potential breach requirements</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">3. Containment & Recovery (4-24 hours)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Implement long-term containment measures</li>
                  <li>Remove malicious presence</li>
                  <li>Restore affected systems from clean backups</li>
                  <li>Strengthen defenses to prevent recurrence</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">4. Notification & Reporting</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Notify affected users and stakeholders</li>
                  <li>Report to ICO if GDPR breach threshold met (within 72 hours)</li>
                  <li>Coordinate with legal and insurance as needed</li>
                  <li>Prepare public communications if required</li>
                </ul>
              </div>

              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  <strong>Emergency Contacts:</strong><br />
                  Security Team: security@ajryan.co.uk | +44 (0) 20 7xxx xxxx<br />
                  DPO: dpo@ajryan.co.uk | +44 (0) 20 7xxx xxxx<br />
                  Legal: legal@ajryan.co.uk
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncidentResponse;