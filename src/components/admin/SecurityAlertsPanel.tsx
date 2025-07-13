import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  Shield, 
  Lock, 
  Eye, 
  Ban, 
  CheckCircle, 
  Clock,
  Activity,
  Download,
  UserX,
  AlertCircle,
  TrendingUp,
  X
} from "lucide-react";

interface SecurityAlert {
  id: string;
  type: "failed_login" | "suspicious_activity" | "bulk_export" | "unusual_access" | "session_anomaly";
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "investigating" | "resolved" | "dismissed";
  timestamp: string;
  userId?: string;
  userName?: string;
  description: string;
  details: string;
  ipAddress?: string;
  affectedResource?: string;
  riskScore: number;
}

// Mock security alerts
const mockSecurityAlerts: SecurityAlert[] = [
  {
    id: "1",
    type: "failed_login",
    severity: "high",
    status: "active",
    timestamp: "2025-01-13 09:45:23",
    userId: "unknown",
    userName: "Unknown User",
    description: "Multiple failed login attempts",
    details: "5 consecutive failed login attempts for mike.johnson@ajryan.co.uk from suspicious IP",
    ipAddress: "203.0.113.42",
    affectedResource: "authentication",
    riskScore: 85
  },
  {
    id: "2",
    type: "bulk_export",
    severity: "medium",
    status: "investigating",
    timestamp: "2025-01-13 08:15:12",
    userId: "admin-1",
    userName: "John Smith",
    description: "Large data export outside business hours",
    details: "Exported 247 user records at 08:15 AM - outside normal business hours",
    ipAddress: "192.168.1.100",
    affectedResource: "user_data",
    riskScore: 65
  },
  {
    id: "3",
    type: "suspicious_activity",
    severity: "critical",
    status: "active",
    timestamp: "2025-01-13 07:30:45",
    userId: "operative-15",
    userName: "David Wilson",
    description: "Unusual access pattern detected",
    details: "User accessed 15+ different projects in 10 minutes - potential credential compromise",
    ipAddress: "198.51.100.23",
    affectedResource: "project_data",
    riskScore: 95
  },
  {
    id: "4",
    type: "session_anomaly",
    severity: "medium",
    status: "resolved",
    timestamp: "2025-01-12 22:15:30",
    userId: "supervisor-3",
    userName: "Sarah Connor",
    description: "Login from new location",
    details: "User logged in from Manchester office for first time",
    ipAddress: "172.16.0.45",
    affectedResource: "user_session",
    riskScore: 45
  },
  {
    id: "5",
    type: "unusual_access",
    severity: "low",
    status: "dismissed",
    timestamp: "2025-01-12 16:20:15",
    userId: "pm-2",
    userName: "Emma Wilson",
    description: "Weekend document access",
    details: "Accessed sensitive RAMS documents on Saturday",
    ipAddress: "192.168.1.150",
    affectedResource: "documents",
    riskScore: 25
  }
];

const alertTypes = [
  { value: "all", label: "All Types" },
  { value: "failed_login", label: "Failed Logins" },
  { value: "suspicious_activity", label: "Suspicious Activity" },
  { value: "bulk_export", label: "Bulk Exports" },
  { value: "unusual_access", label: "Unusual Access" },
  { value: "session_anomaly", label: "Session Anomalies" }
];

const severityLevels = [
  { value: "all", label: "All Severity" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" }
];

export const SecurityAlertsPanel = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(mockSecurityAlerts);
  const [filteredAlerts, setFilteredAlerts] = useState<SecurityAlert[]>(mockSecurityAlerts);
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  // Apply filters
  useEffect(() => {
    let filtered = alerts;

    if (filterType !== "all") {
      filtered = filtered.filter(alert => alert.type === filterType);
    }

    if (filterSeverity !== "all") {
      filtered = filtered.filter(alert => alert.severity === filterSeverity);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(alert => alert.status === filterStatus);
    }

    setFilteredAlerts(filtered);
  }, [alerts, filterType, filterSeverity, filterStatus]);

  const getSeverityBadge = (severity: SecurityAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive" className="bg-red-600 text-white">🚨 Critical</Badge>;
      case "high":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">🔴 High</Badge>;
      case "medium":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🟡 Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-green-100 text-green-800">🟢 Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: SecurityAlert["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">🔥 Active</Badge>;
      case "investigating":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">🔍 Investigating</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">✅ Resolved</Badge>;
      case "dismissed":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">❌ Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: SecurityAlert["type"]) => {
    switch (type) {
      case "failed_login":
        return <Lock className="h-4 w-4" />;
      case "suspicious_activity":
        return <AlertTriangle className="h-4 w-4" />;
      case "bulk_export":
        return <Download className="h-4 w-4" />;
      case "unusual_access":
        return <Eye className="h-4 w-4" />;
      case "session_anomaly":
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 90) return "text-red-600 font-bold";
    if (score >= 70) return "text-red-500 font-semibold";
    if (score >= 50) return "text-yellow-600 font-medium";
    return "text-green-600";
  };

  const handleAlertAction = (alertId: string, action: "investigate" | "resolve" | "dismiss" | "force_logout" | "suspend_user") => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    switch (action) {
      case "investigate":
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: "investigating" as const } : a));
        toast.success("Alert marked as investigating");
        break;
      case "resolve":
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: "resolved" as const } : a));
        toast.success("Alert resolved");
        break;
      case "dismiss":
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: "dismissed" as const } : a));
        toast.success("Alert dismissed");
        break;
      case "force_logout":
        toast.success(`Force logout initiated for ${alert.userName || alert.userId}`);
        break;
      case "suspend_user":
        toast.success(`User ${alert.userName || alert.userId} has been suspended`);
        break;
    }
  };

  const activeAlerts = filteredAlerts.filter(alert => alert.status === "active").length;
  const criticalAlerts = filteredAlerts.filter(alert => alert.severity === "critical").length;
  const highRiskAlerts = filteredAlerts.filter(alert => alert.riskScore >= 80).length;

  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Critical security events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{highRiskAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Risk score ≥ 80
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12m</div>
            <p className="text-xs text-muted-foreground">
              To resolution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Alerts & Monitoring
          </CardTitle>
          <CardDescription>
            Real-time security event detection and automated threat response
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Alert type" />
              </SelectTrigger>
              <SelectContent>
                {alertTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Severity level" />
              </SelectTrigger>
              <SelectContent>
                {severityLevels.map(severity => (
                  <SelectItem key={severity.value} value={severity.value}>
                    {severity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alerts Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className={alert.severity === "critical" ? "bg-red-50" : ""}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        {getTypeIcon(alert.type)}
                        <div>
                          <div className="font-medium">{alert.description}</div>
                          <div className="text-sm text-muted-foreground">{alert.details}</div>
                          {alert.ipAddress && (
                            <div className="text-xs text-muted-foreground mt-1">
                              IP: {alert.ipAddress}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.userName ? (
                        <div>
                          <div className="font-medium">{alert.userName}</div>
                          <div className="text-sm text-muted-foreground">{alert.userId}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Unknown</div>
                      )}
                    </TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>
                      <div className={`text-sm ${getRiskScoreColor(alert.riskScore)}`}>
                        {alert.riskScore}/100
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell className="text-sm">{alert.timestamp}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {alert.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAlertAction(alert.id, "investigate")}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Investigate
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Ban className="h-4 w-4 mr-2" />
                                  Actions
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Security Response Actions</DialogTitle>
                                  <DialogDescription>
                                    Choose an immediate response to this security alert
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-4 bg-muted rounded-lg">
                                    <h4 className="font-medium mb-2">{alert.description}</h4>
                                    <p className="text-sm text-muted-foreground">{alert.details}</p>
                                    <div className="mt-2 flex items-center gap-4">
                                      <span className="text-sm">Risk Score: <span className={getRiskScoreColor(alert.riskScore)}>{alert.riskScore}/100</span></span>
                                      {alert.ipAddress && <span className="text-sm">IP: {alert.ipAddress}</span>}
                                    </div>
                                  </div>
                                  
                                  <div className="grid gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleAlertAction(alert.id, "force_logout")}
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Force User Logout
                                    </Button>
                                    
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleAlertAction(alert.id, "suspend_user")}
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      Suspend User Account
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      onClick={() => handleAlertAction(alert.id, "resolve")}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark as Resolved
                                    </Button>
                                    
                                    <Button
                                      variant="ghost"
                                      onClick={() => handleAlertAction(alert.id, "dismiss")}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Dismiss Alert
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        
                        {alert.status === "investigating" && (
                          <Button
                            size="sm"
                            onClick={() => handleAlertAction(alert.id, "resolve")}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No security alerts</h3>
              <p className="text-muted-foreground">All systems secure - no matching alerts found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};