import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Archive, Download, Shield, Clock, AlertTriangle, Users, Filter, Search, FileX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ArchiveLogEntry {
  id: string;
  userId: string;
  userName: string;
  dataType: string;
  action: "archived" | "deleted" | "legal_hold" | "restored";
  timestamp: string;
  reason: string;
  approvedBy?: string;
  recordCount: number;
  dataSize: string;
}

interface PendingAction {
  id: string;
  userId: string;
  userName: string;
  dataType: string;
  action: "archive" | "delete";
  scheduledDate: string;
  recordCount: number;
  canOverride: boolean;
}

export default function DataArchiveLog() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDataType, setFilterDataType] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [selectedPendingAction, setSelectedPendingAction] = useState<PendingAction | null>(null);

  // Mock data - replace with actual API calls
  const archiveLog: ArchiveLogEntry[] = [
    {
      id: "1",
      userId: "user_123",
      userName: "John Smith",
      dataType: "Training Records",
      action: "archived",
      timestamp: "2024-07-10T14:30:00Z",
      reason: "Automatic - Retention period expired",
      recordCount: 5,
      dataSize: "2.3 MB"
    },
    {
      id: "2",
      userId: "user_456",
      userName: "Sarah Wilson",
      dataType: "RAMS Signatures",
      action: "legal_hold",
      timestamp: "2024-07-09T09:15:00Z",
      reason: "Insurance claim - Plot 2.05 incident",
      approvedBy: "DPO Admin",
      recordCount: 12,
      dataSize: "8.7 MB"
    },
    {
      id: "3",
      userId: "user_789",
      userName: "Mike Johnson",
      dataType: "Personal Data",
      action: "deleted",
      timestamp: "2024-07-08T16:45:00Z",
      reason: "GDPR Right to Erasure request",
      approvedBy: "DPO Admin",
      recordCount: 3,
      dataSize: "156 KB"
    },
    {
      id: "4",
      userId: "user_321",
      userName: "Emma Davis",
      dataType: "Timesheets",
      action: "archived",
      timestamp: "2024-07-07T11:20:00Z",
      reason: "Automatic - 6 year retention completed",
      recordCount: 156,
      dataSize: "12.4 MB"
    }
  ];

  const pendingActions: PendingAction[] = [
    {
      id: "1",
      userId: "user_111",
      userName: "David Brown",
      dataType: "Training Records",
      action: "archive",
      scheduledDate: "2024-07-20",
      recordCount: 8,
      canOverride: true
    },
    {
      id: "2",
      userId: "user_222",
      userName: "Lisa Garcia",
      dataType: "CSCS Cards",
      action: "delete",
      scheduledDate: "2024-07-25",
      recordCount: 2,
      canOverride: false
    },
    {
      id: "3",
      userId: "user_333",
      userName: "Tom Anderson",
      dataType: "Site Notices",
      action: "archive",
      scheduledDate: "2024-07-18",
      recordCount: 15,
      canOverride: true
    }
  ];

  const getActionBadge = (action: string) => {
    switch (action) {
      case "archived":
        return <Badge variant="secondary" className="flex items-center gap-1"><Archive className="w-3 h-3" />Archived</Badge>;
      case "deleted":
        return <Badge variant="destructive" className="flex items-center gap-1"><FileX className="w-3 h-3" />Deleted</Badge>;
      case "legal_hold":
        return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="w-3 h-3" />Legal Hold</Badge>;
      case "restored":
        return <Badge variant="default" className="bg-green-600">Restored</Badge>;
      case "archive":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />Archive Pending</Badge>;
      case "delete":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Delete Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleExportLog = () => {
    // API call would go here
    toast({
      title: "Export Started",
      description: "Archive log export will be ready for download shortly."
    });
  };

  const handleOverrideAction = () => {
    if (!selectedPendingAction) return;

    // API call would go here
    toast({
      title: "Action Overridden",
      description: `Scheduled ${selectedPendingAction.action} has been cancelled.`
    });

    setSelectedPendingAction(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLog = archiveLog.filter(entry => {
    const matchesSearch = entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.dataType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDataType = filterDataType === "all" || entry.dataType === filterDataType;
    const matchesAction = filterAction === "all" || entry.action === filterAction;
    
    return matchesSearch && matchesDataType && matchesAction;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Archive Log</h1>
          <p className="text-muted-foreground">Monitor data lifecycle actions and pending operations</p>
        </div>
        <Button onClick={handleExportLog} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Log
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Archive className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{archiveLog.filter(l => l.action === "archived").length}</p>
                <p className="text-xs text-muted-foreground">Archived This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileX className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{archiveLog.filter(l => l.action === "deleted").length}</p>
                <p className="text-xs text-muted-foreground">Deleted This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{archiveLog.filter(l => l.action === "legal_hold").length}</p>
                <p className="text-xs text-muted-foreground">Legal Holds Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingActions.length}</p>
                <p className="text-xs text-muted-foreground">Pending Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="log">Archive Log</TabsTrigger>
          <TabsTrigger value="pending">Pending Actions ({pendingActions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Data Lifecycle History
              </CardTitle>
              <CardDescription>
                Complete audit trail of all archive, deletion, and legal hold actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by user or data type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="data-type">Data Type</Label>
                  <Select value={filterDataType} onValueChange={setFilterDataType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Training Records">Training Records</SelectItem>
                      <SelectItem value="RAMS Signatures">RAMS Signatures</SelectItem>
                      <SelectItem value="Personal Data">Personal Data</SelectItem>
                      <SelectItem value="Timesheets">Timesheets</SelectItem>
                      <SelectItem value="Site Notices">Site Notices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="action">Action</Label>
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                      <SelectItem value="deleted">Deleted</SelectItem>
                      <SelectItem value="legal_hold">Legal Hold</SelectItem>
                      <SelectItem value="restored">Restored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Log Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Data Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Approved By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLog.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.userName}</TableCell>
                        <TableCell>{entry.dataType}</TableCell>
                        <TableCell>{getActionBadge(entry.action)}</TableCell>
                        <TableCell>{formatDate(entry.timestamp)}</TableCell>
                        <TableCell>{entry.recordCount}</TableCell>
                        <TableCell>{entry.dataSize}</TableCell>
                        <TableCell className="max-w-xs truncate" title={entry.reason}>
                          {entry.reason}
                        </TableCell>
                        <TableCell>{entry.approvedBy || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Lifecycle Actions
              </CardTitle>
              <CardDescription>
                Scheduled archive and deletion operations awaiting processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActions.map((action) => (
                  <Card key={action.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{action.userName}</h3>
                          {getActionBadge(action.action)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Data Type</p>
                            <p className="text-muted-foreground">{action.dataType}</p>
                          </div>
                          <div>
                            <p className="font-medium">Scheduled Date</p>
                            <p className="text-muted-foreground">{formatDate(action.scheduledDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium">Record Count</p>
                            <p className="text-muted-foreground">{action.recordCount} records</p>
                          </div>
                          <div>
                            <p className="font-medium">Status</p>
                            <p className="text-muted-foreground">
                              {action.canOverride ? "Can Override" : "System Locked"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {action.canOverride && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedPendingAction(action)}
                            >
                              Override
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Override Scheduled Action</DialogTitle>
                              <DialogDescription>
                                Cancel the scheduled {action.action} for {action.userName}'s {action.dataType} data.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                This will prevent the automatic {action.action} scheduled for {formatDate(action.scheduledDate)}. 
                                You may need to manually reschedule or apply a legal hold.
                              </p>
                            </div>
                            
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedPendingAction(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleOverrideAction} variant="destructive">
                                Override Action
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </Card>
                ))}

                {pendingActions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending actions scheduled
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}