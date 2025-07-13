import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Archive, 
  Calendar, 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  Shield,
  FileText,
  User,
  Trash2
} from "lucide-react";

interface RetentionItem {
  id: string;
  type: "user" | "signature" | "document";
  name: string;
  description: string;
  retentionDate: string;
  status: "pending" | "approved" | "overridden" | "deleted";
  reason?: string;
  requestedBy?: string;
  requestDate?: string;
}

// Mock data
const mockRetentionItems: RetentionItem[] = [
  {
    id: "1",
    type: "user",
    name: "Mike Johnson",
    description: "CSCS card expired, inactive for 12+ months",
    retentionDate: "2025-01-20",
    status: "pending"
  },
  {
    id: "2",
    type: "signature",
    name: "RAMS Signatures - Kidbrooke Phase 1",
    description: "7-year retention period reached",
    retentionDate: "2025-01-25",
    status: "pending"
  },
  {
    id: "3",
    type: "document",
    name: "Training Records - Sarah Connor",
    description: "Employee left company, 7-year retention complete",
    retentionDate: "2025-02-01",
    status: "approved"
  },
  {
    id: "4",
    type: "user",
    name: "David Smith",
    description: "Right-to-Erasure request submitted",
    retentionDate: "2025-01-15",
    status: "overridden",
    reason: "Legal hold due to ongoing HSE investigation",
    requestedBy: "John Admin",
    requestDate: "2025-01-10"
  }
];

export const RetentionManagement = () => {
  const [retentionItems, setRetentionItems] = useState<RetentionItem[]>(mockRetentionItems);
  const [selectedItem, setSelectedItem] = useState<RetentionItem | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  const getStatusBadge = (status: RetentionItem["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">✅ Approved</Badge>;
      case "overridden":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">🛡️ Overridden</Badge>;
      case "deleted":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">🗑️ Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: RetentionItem["type"]) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4" />;
      case "signature":
        return <FileText className="h-4 w-4" />;
      case "document":
        return <Archive className="h-4 w-4" />;
      default:
        return <Archive className="h-4 w-4" />;
    }
  };

  const getDaysUntilRetention = (retentionDate: string) => {
    const today = new Date();
    const retention = new Date(retentionDate);
    const diffTime = retention.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleApproveRetention = (itemId: string) => {
    setRetentionItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, status: "approved" as const }
          : item
      )
    );
    toast.success("Retention approved - item will be deleted as scheduled");
  };

  const handleOverrideRetention = (itemId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the override");
      return;
    }

    setRetentionItems(items =>
      items.map(item =>
        item.id === itemId
          ? { 
              ...item, 
              status: "overridden" as const,
              reason,
              requestedBy: "Admin User",
              requestDate: new Date().toISOString().split('T')[0]
            }
          : item
      )
    );
    setOverrideReason("");
    setSelectedItem(null);
    toast.success("Retention overridden - item will be preserved");
  };

  const pendingItems = retentionItems.filter(item => item.status === "pending");
  const upcomingItems = retentionItems.filter(item => {
    const days = getDaysUntilRetention(item.retentionDate);
    return days <= 30 && days > 0 && item.status === "pending";
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deletions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items awaiting retention approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming (30 days)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items due for retention soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overridden</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {retentionItems.filter(item => item.status === "overridden").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Items with legal hold or override
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Retention Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Data Retention & Archive Management
          </CardTitle>
          <CardDescription>
            Manage GDPR compliance, data retention policies, and right-to-erasure requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Retention Date</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retentionItems.map((item) => {
                  const daysRemaining = getDaysUntilRetention(item.retentionDate);
                  const isOverdue = daysRemaining < 0;
                  const isUrgent = daysRemaining <= 7 && daysRemaining > 0;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span className="capitalize">{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.retentionDate}</TableCell>
                      <TableCell>
                        <div className={`text-sm ${
                          isOverdue ? "text-red-600 font-semibold" :
                          isUrgent ? "text-yellow-600 font-semibold" :
                          "text-muted-foreground"
                        }`}>
                          {isOverdue ? `${Math.abs(daysRemaining)} days overdue` :
                           daysRemaining === 0 ? "Today" :
                           `${daysRemaining} days`}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveRetention(item.id)}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedItem(item)}
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Override
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Override Retention</DialogTitle>
                                    <DialogDescription>
                                      Prevent deletion of "{item.name}" by providing a legal or business justification
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="reason">Reason for Override</Label>
                                      <Textarea
                                        id="reason"
                                        placeholder="e.g., Legal hold due to ongoing investigation, Business requirement for extended retention..."
                                        value={overrideReason}
                                        onChange={(e) => setOverrideReason(e.target.value)}
                                        className="min-h-[100px]"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedItem(null);
                                          setOverrideReason("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={() => handleOverrideRetention(item.id, overrideReason)}
                                      >
                                        Override Retention
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          
                          {item.status === "overridden" && (
                            <Button size="sm" variant="outline" disabled>
                              <Shield className="h-4 w-4 mr-2" />
                              Protected
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Override Reasons */}
          {retentionItems.some(item => item.status === "overridden" && item.reason) && (
            <div className="mt-6">
              <h4 className="font-medium mb-4">Override Details</h4>
              <div className="space-y-3">
                {retentionItems
                  .filter(item => item.status === "overridden" && item.reason)
                  .map(item => (
                    <div key={item.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="destructive" className="bg-red-100 text-red-800">Override Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.reason}</p>
                      {item.requestedBy && item.requestDate && (
                        <p className="text-xs text-muted-foreground">
                          Override by {item.requestedBy} on {item.requestDate}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};