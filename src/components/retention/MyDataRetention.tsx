import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Calendar, FileText, Shield, Clock, Download, Trash2, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RetentionRecord {
  id: string;
  dataType: string;
  description: string;
  createdAt: string;
  status: "live" | "archived" | "pending_deletion";
  archiveDate: string;
  deleteDate: string;
  retentionPeriod: string;
  legalHold: boolean;
  canRequestDeletion: boolean;
}

export default function MyDataRetention() {
  const { toast } = useToast();
  const [selectedRecord, setSelectedRecord] = useState<RetentionRecord | null>(null);
  const [deletionReason, setDeletionReason] = useState("");

  // Mock data - replace with actual API calls
  const retentionRecords: RetentionRecord[] = [
    {
      id: "1",
      dataType: "CSCS Card",
      description: "Construction Skills Certification",
      createdAt: "2024-01-15",
      status: "live",
      archiveDate: "2026-01-15",
      deleteDate: "2027-01-15",
      retentionPeriod: "3 years",
      legalHold: false,
      canRequestDeletion: true
    },
    {
      id: "2",
      dataType: "RAMS Signatures",
      description: "Plot 2.05 MVHR Installation Sign-offs",
      createdAt: "2024-03-10",
      status: "live",
      archiveDate: "2031-03-10",
      deleteDate: "2036-03-10",
      retentionPeriod: "12 years",
      legalHold: false,
      canRequestDeletion: false
    },
    {
      id: "3",
      dataType: "Training Records",
      description: "Working at Height Certification",
      createdAt: "2023-06-20",
      status: "archived",
      archiveDate: "2024-06-20",
      deleteDate: "2025-06-20",
      retentionPeriod: "2 years",
      legalHold: false,
      canRequestDeletion: false
    },
    {
      id: "4",
      dataType: "Timesheets",
      description: "Kidbrooke Village Block C - 2023",
      createdAt: "2023-01-01",
      status: "live",
      archiveDate: "2029-01-01",
      deleteDate: "2030-01-01",
      retentionPeriod: "6 years (HMRC)",
      legalHold: true,
      canRequestDeletion: false
    }
  ];

  const getStatusBadge = (status: string, legalHold: boolean) => {
    if (legalHold) {
      return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="w-3 h-3" />Legal Hold</Badge>;
    }
    
    switch (status) {
      case "live":
        return <Badge variant="default" className="bg-green-600">Live</Badge>;
      case "archived":
        return <Badge variant="secondary" className="flex items-center gap-1"><Archive className="w-3 h-3" />Archived</Badge>;
      case "pending_deletion":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Pending Deletion</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleRequestDeletion = () => {
    if (!selectedRecord || !deletionReason.trim()) return;

    // API call would go here
    toast({
      title: "Deletion Request Submitted",
      description: "Your request will be reviewed within 30 days."
    });

    setSelectedRecord(null);
    setDeletionReason("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const liveRecords = retentionRecords.filter(r => r.status === "live");
  const archivedRecords = retentionRecords.filter(r => r.status === "archived");
  const pendingRecords = retentionRecords.filter(r => r.status === "pending_deletion");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Data Retention</h1>
          <p className="text-muted-foreground">View how long your data is kept and request deletion where permitted</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{liveRecords.length}</p>
                <p className="text-xs text-muted-foreground">Live Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Archive className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{archivedRecords.length}</p>
                <p className="text-xs text-muted-foreground">Archived</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{pendingRecords.length}</p>
                <p className="text-xs text-muted-foreground">Pending Deletion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{retentionRecords.filter(r => r.legalHold).length}</p>
                <p className="text-xs text-muted-foreground">Legal Holds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tabs */}
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live">Live Data ({liveRecords.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archivedRecords.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Deletion ({pendingRecords.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          {liveRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{record.dataType}</CardTitle>
                    <CardDescription>{record.description}</CardDescription>
                  </div>
                  {getStatusBadge(record.status, record.legalHold)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created
                    </p>
                    <p className="text-muted-foreground">{formatDate(record.createdAt)}</p>
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      Archive Date
                    </p>
                    <p className="text-muted-foreground">
                      {formatDate(record.archiveDate)} 
                      <span className="text-orange-600"> ({getDaysUntil(record.archiveDate)} days)</span>
                    </p>
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Retention Period
                    </p>
                    <p className="text-muted-foreground">{record.retentionPeriod}</p>
                  </div>
                </div>
                
                {record.canRequestDeletion && !record.legalHold && (
                  <div className="mt-4 flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Request Early Deletion
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Early Deletion</DialogTitle>
                          <DialogDescription>
                            Request early deletion of "{record.dataType}" data. This request will be reviewed for legal and contractual compliance.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reason">Reason for deletion request</Label>
                            <Textarea
                              id="reason"
                              placeholder="Please explain why you need this data deleted early..."
                              value={deletionReason}
                              onChange={(e) => setDeletionReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleRequestDeletion}>
                            Submit Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {record.legalHold && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      This data is under legal hold and cannot be deleted at this time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          {archivedRecords.map((record) => (
            <Card key={record.id} className="opacity-75">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{record.dataType}</CardTitle>
                    <CardDescription>{record.description}</CardDescription>
                  </div>
                  {getStatusBadge(record.status, record.legalHold)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Archived On</p>
                    <p className="text-muted-foreground">{formatDate(record.archiveDate)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Delete Date</p>
                    <p className="text-muted-foreground">
                      {formatDate(record.deleteDate)}
                      <span className="text-red-600"> ({getDaysUntil(record.deleteDate)} days)</span>
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-muted-foreground">Read-only archived</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingRecords.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No data pending deletion</p>
              </CardContent>
            </Card>
          ) : (
            pendingRecords.map((record) => (
              <Card key={record.id} className="border-orange-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{record.dataType}</CardTitle>
                      <CardDescription>{record.description}</CardDescription>
                    </div>
                    {getStatusBadge(record.status, record.legalHold)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      This data will be permanently deleted on {formatDate(record.deleteDate)} 
                      ({getDaysUntil(record.deleteDate)} days remaining)
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}