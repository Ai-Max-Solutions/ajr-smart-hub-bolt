import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  FileText, 
  Search, 
  Download, 
  Filter,
  ChevronDown,
  Eye,
  User,
  Settings,
  Shield,
  AlertTriangle,
  CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: "low" | "medium" | "high";
  status: "success" | "failed" | "warning";
}

// Mock audit data
const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "2025-01-13 09:15:23",
    userId: "admin-1",
    userName: "John Smith",
    action: "user_suspended",
    resource: "user_management",
    details: "Suspended user: Mike Johnson (mike.johnson@ajryan.co.uk)",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    severity: "high",
    status: "success"
  },
  {
    id: "2",
    timestamp: "2025-01-13 08:45:12",
    userId: "pm-1",
    userName: "Emma Wilson",
    action: "project_access_granted",
    resource: "project_management",
    details: "Granted project access: Sarah Connor to Kidbrooke Village",
    ipAddress: "192.168.1.150",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    severity: "medium",
    status: "success"
  },
  {
    id: "3",
    timestamp: "2025-01-13 08:30:45",
    userId: "unknown",
    userName: "Unknown User",
    action: "login_failed",
    resource: "authentication",
    details: "Failed login attempt for: mike.johnson@ajryan.co.uk",
    ipAddress: "203.0.113.42",
    userAgent: "curl/7.68.0",
    severity: "high",
    status: "failed"
  },
  {
    id: "4",
    timestamp: "2025-01-13 07:20:15",
    userId: "admin-1",
    userName: "John Smith",
    action: "bulk_user_export",
    resource: "data_export",
    details: "Exported user list (247 users) to CSV",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    severity: "medium",
    status: "success"
  },
  {
    id: "5",
    timestamp: "2025-01-12 16:45:30",
    userId: "supervisor-1",
    userName: "Sarah Connor",
    action: "document_downloaded",
    resource: "document_management",
    details: "Downloaded RAMS document: Health & Safety Protocol v2.1",
    ipAddress: "192.168.1.75",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
    severity: "low",
    status: "success"
  }
];

const actionTypes = [
  "all",
  "user_created",
  "user_suspended",
  "user_deleted",
  "login_failed",
  "project_access_granted",
  "project_access_revoked",
  "document_downloaded",
  "bulk_user_export",
  "password_reset"
];

const severityLevels = ["all", "low", "medium", "high"];
const statusTypes = ["all", "success", "failed", "warning"];

export const AuditLogsViewer = () => {
  const [auditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Apply filters
  useEffect(() => {
    let filtered = auditLogs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Action filter
    if (filterAction !== "all") {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    // Severity filter
    if (filterSeverity !== "all") {
      filtered = filtered.filter(log => log.severity === filterSeverity);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    // Date filters
    if (dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= dateTo);
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, filterAction, filterSeverity, filterStatus, dateFrom, dateTo]);

  const getSeverityBadge = (severity: AuditLog["severity"]) => {
    switch (severity) {
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

  const getStatusBadge = (status: AuditLog["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">✅ Success</Badge>;
      case "failed":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">❌ Failed</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠️ Warning</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("user")) return <User className="h-4 w-4" />;
    if (action.includes("login")) return <Shield className="h-4 w-4" />;
    if (action.includes("project")) return <Settings className="h-4 w-4" />;
    if (action.includes("document")) return <FileText className="h-4 w-4" />;
    return <Eye className="h-4 w-4" />;
  };

  const handleExportLogs = () => {
    toast.success(`Exporting ${filteredLogs.length} audit logs to CSV`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterAction("all");
    setFilterSeverity("all");
    setFilterStatus("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Filtered from {auditLogs.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLogs.filter(log => log.severity === "high").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Critical security events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLogs.filter(log => log.status === "failed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Unsuccessful attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredLogs.map(log => log.userId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Active in selected period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Security Audit Logs
            </div>
            <Button onClick={handleExportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </CardTitle>
          <CardDescription>
            Complete audit trail of all user actions and system events - immutable and GDPR compliant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs by user, action, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Action type" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      {action === "all" ? "All Actions" : action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map(severity => (
                    <SelectItem key={severity} value={severity}>
                      {severity === "all" ? "All Severity" : severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusTypes.map(status => (
                    <SelectItem key={status} value={status}>
                      {status === "all" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{log.timestamp}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{log.userName}</div>
                          <div className="text-xs text-muted-foreground">{log.userId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm">{log.action.replace(/_/g, " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-sm truncate" title={log.details}>
                        {log.details}
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-sm">{log.ipAddress}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or date range</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};