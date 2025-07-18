
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Search, 
  Download, 
  RefreshCw,
  User,
  Settings,
  Shield,
  Database,
  AlertTriangle,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ip_address: string;
  status: 'success' | 'warning' | 'error';
  details: string;
}

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const actionTypes = ["login", "logout", "create", "update", "delete", "export", "admin_access"];
  const statusTypes = ["success", "warning", "error"];

  // Mock data - in production, this would come from your audit system
  const mockLogs: AuditLog[] = [
    {
      id: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      user: "admin@ajryan.co.uk",
      action: "login",
      resource: "admin_dashboard",
      ip_address: "192.168.1.100",
      status: "success",
      details: "Admin logged in from site office"
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      user: "john.smith@ajryan.co.uk",
      action: "update",
      resource: "user_profile",
      ip_address: "10.0.0.45",
      status: "success",
      details: "Updated CSCS card information"
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      user: "system",
      action: "delete",
      resource: "expired_sessions",
      ip_address: "internal",
      status: "success",
      details: "Automated cleanup of expired user sessions"
    },
    {
      id: "4",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      user: "suspicious.user@example.com",
      action: "login",
      resource: "admin_dashboard",
      ip_address: "203.0.113.0",
      status: "error",
      details: "Failed login attempt - blocked by security"
    },
    {
      id: "5",
      timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      user: "pm@ajryan.co.uk",
      action: "export",
      resource: "timesheet_data",
      ip_address: "192.168.1.50",
      status: "warning",
      details: "Large data export - flagged for review"
    }
  ];

  useEffect(() => {
    setLogs(mockLogs);
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    toast.success("Checking the logbook - all entries flowing in!");
    
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add a new mock log entry
    const newLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: "system",
      action: "refresh",
      resource: "audit_logs",
      ip_address: "internal",
      status: "success",
      details: "Audit logs refreshed by admin"
    };
    
    setLogs([newLog, ...logs]);
    setLoading(false);
    toast.success("Logbook updated - no leaks found! 📋");
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    const matchesStatus = selectedStatus === "all" || log.status === selectedStatus;
    return matchesSearch && matchesAction && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <Shield className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout': return <User className="w-4 h-4" />;
      case 'create':
      case 'update':
      case 'delete': return <Database className="w-4 h-4" />;
      case 'admin_access': return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent" />
            The Plumber's Logbook - What's Been Flowing?
          </h2>
          <p className="text-muted-foreground">
            Track every drip, drop, and flood in your system - no surprises here!
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking...' : 'Refresh Logs'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Logbook
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <FileText className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter(log => log.status === 'success').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {logs.filter(log => log.status === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {logs.filter(log => log.status === 'error').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search logs by user, action, or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusTypes.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Activity Log ({filteredLogs.length} entries)</CardTitle>
          <CardDescription>
            {filteredLogs.length === 0 && searchQuery 
              ? "No matching entries - try different search terms!" 
              : "Real-time system activity - every drop accounted for"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No logs match your search!" : "All quiet - no bursts today! 🔧"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{log.user}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="capitalize">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {log.resource}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <Badge variant={getStatusVariant(log.status)}>
                            {log.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{log.ip_address}</code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.details}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogs;
