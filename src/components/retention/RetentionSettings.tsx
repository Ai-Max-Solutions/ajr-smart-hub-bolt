import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Clock, Shield, AlertTriangle, Save, FileText, Users, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RetentionRule {
  id: string;
  dataType: string;
  description: string;
  retentionPeriod: number;
  unit: "months" | "years";
  autoArchive: boolean;
  autoDelete: boolean;
  requiresApproval: boolean;
  legalBasis: string;
}

export default function RetentionSettings() {
  const { toast } = useToast();
  const [editingRule, setEditingRule] = useState<RetentionRule | null>(null);

  // Mock data - replace with actual API calls
  const [retentionRules, setRetentionRules] = useState<RetentionRule[]>([
    {
      id: "1",
      dataType: "RAMS Signatures",
      description: "Risk Assessment & Method Statement sign-offs",
      retentionPeriod: 12,
      unit: "years",
      autoArchive: true,
      autoDelete: false,
      requiresApproval: true,
      legalBasis: "Construction Industry Standards & Insurance"
    },
    {
      id: "2",
      dataType: "Training Records",
      description: "Qualifications, certifications, and competency records",
      retentionPeriod: 2,
      unit: "years",
      autoArchive: true,
      autoDelete: true,
      requiresApproval: false,
      legalBasis: "Employment Records"
    },
    {
      id: "3",
      dataType: "Timesheets",
      description: "Employee timesheet and payroll data",
      retentionPeriod: 6,
      unit: "years",
      autoArchive: true,
      autoDelete: true,
      requiresApproval: false,
      legalBasis: "HMRC Requirements"
    },
    {
      id: "4",
      dataType: "Personal Data",
      description: "Employee contact details, emergency contacts",
      retentionPeriod: 2,
      unit: "years",
      autoArchive: true,
      autoDelete: true,
      requiresApproval: false,
      legalBasis: "GDPR - Employment Necessity"
    },
    {
      id: "5",
      dataType: "Site Notices",
      description: "Safety notices and compliance communications",
      retentionPeriod: 7,
      unit: "years",
      autoArchive: true,
      autoDelete: false,
      requiresApproval: true,
      legalBasis: "Health & Safety Records"
    }
  ]);

  const globalSettings = {
    archiveWarningDays: 90,
    deleteWarningDays: 30,
    autoProcessingEnabled: true,
    requireDPOApproval: true,
    backupRetentionDays: 30
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    setRetentionRules(rules => 
      rules.map(rule => 
        rule.id === editingRule.id ? editingRule : rule
      )
    );

    toast({
      title: "Retention Rule Updated",
      description: `${editingRule.dataType} retention policy has been saved.`
    });

    setEditingRule(null);
  };

  const getStatusBadge = (rule: RetentionRule) => {
    if (!rule.autoDelete && rule.requiresApproval) {
      return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="w-3 h-3" />Manual Only</Badge>;
    }
    if (rule.autoDelete) {
      return <Badge variant="default" className="bg-green-600">Auto-Delete</Badge>;
    }
    return <Badge variant="secondary">Archive Only</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Retention & Deletion Settings</h1>
          <p className="text-muted-foreground">Configure data lifecycle policies and GDPR compliance</p>
        </div>
        <Button className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Retention Rules</TabsTrigger>
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Data Type Retention Rules
              </CardTitle>
              <CardDescription>
                Configure how long different types of data are retained before archiving and deletion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {retentionRules.map((rule) => (
                  <Card key={rule.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{rule.dataType}</h3>
                          {getStatusBadge(rule)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Retention Period</p>
                            <p className="text-muted-foreground">{rule.retentionPeriod} {rule.unit}</p>
                          </div>
                          <div>
                            <p className="font-medium">Auto Actions</p>
                            <p className="text-muted-foreground">
                              Archive: {rule.autoArchive ? "Yes" : "No"} | 
                              Delete: {rule.autoDelete ? "Yes" : "No"}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Legal Basis</p>
                            <p className="text-muted-foreground">{rule.legalBasis}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingRule(rule)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Retention Rule</DialogTitle>
                            <DialogDescription>
                              Configure retention policy for {rule.dataType}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {editingRule && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="period">Retention Period</Label>
                                  <Input
                                    id="period"
                                    type="number"
                                    value={editingRule.retentionPeriod}
                                    onChange={(e) => setEditingRule({
                                      ...editingRule,
                                      retentionPeriod: parseInt(e.target.value)
                                    })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="unit">Unit</Label>
                                  <Select
                                    value={editingRule.unit}
                                    onValueChange={(value: "months" | "years") => 
                                      setEditingRule({...editingRule, unit: value})
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="months">Months</SelectItem>
                                      <SelectItem value="years">Years</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="legal">Legal Basis</Label>
                                <Input
                                  id="legal"
                                  value={editingRule.legalBasis}
                                  onChange={(e) => setEditingRule({
                                    ...editingRule,
                                    legalBasis: e.target.value
                                  })}
                                />
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="auto-archive">Auto Archive</Label>
                                  <Switch
                                    id="auto-archive"
                                    checked={editingRule.autoArchive}
                                    onCheckedChange={(checked) => 
                                      setEditingRule({...editingRule, autoArchive: checked})
                                    }
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="auto-delete">Auto Delete</Label>
                                  <Switch
                                    id="auto-delete"
                                    checked={editingRule.autoDelete}
                                    onCheckedChange={(checked) => 
                                      setEditingRule({...editingRule, autoDelete: checked})
                                    }
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="requires-approval">Requires DPO Approval</Label>
                                  <Switch
                                    id="requires-approval"
                                    checked={editingRule.requiresApproval}
                                    onCheckedChange={(checked) => 
                                      setEditingRule({...editingRule, requiresApproval: checked})
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingRule(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveRule}>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Global Retention Settings
              </CardTitle>
              <CardDescription>
                System-wide configuration for data lifecycle management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="archive-warning">Archive Warning (Days)</Label>
                  <Input
                    id="archive-warning"
                    type="number"
                    defaultValue={globalSettings.archiveWarningDays}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Days before archiving to notify users
                  </p>
                </div>

                <div>
                  <Label htmlFor="delete-warning">Delete Warning (Days)</Label>
                  <Input
                    id="delete-warning"
                    type="number"
                    defaultValue={globalSettings.deleteWarningDays}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Days before deletion to send final warning
                  </p>
                </div>

                <div>
                  <Label htmlFor="backup-retention">Backup Retention (Days)</Label>
                  <Input
                    id="backup-retention"
                    type="number"
                    defaultValue={globalSettings.backupRetentionDays}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    How long to keep system backups
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-processing">Enable Auto Processing</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically archive and delete data based on retention rules
                    </p>
                  </div>
                  <Switch
                    id="auto-processing"
                    defaultChecked={globalSettings.autoProcessingEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dpo-approval">Require DPO Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Data Protection Officer must approve all deletions
                    </p>
                  </div>
                  <Switch
                    id="dpo-approval"
                    defaultChecked={globalSettings.requireDPOApproval}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">98.5%</p>
                    <p className="text-xs text-muted-foreground">Compliance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">127</p>
                    <p className="text-xs text-muted-foreground">Auto-Archived This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">Pending Legal Holds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
              <CardDescription>Current status of data retention compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">GDPR Compliance</p>
                    <p className="text-sm text-muted-foreground">Data subject rights and retention limits</p>
                  </div>
                  <Badge variant="default" className="bg-green-600">Compliant</Badge>
                </div>

                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">HMRC Requirements</p>
                    <p className="text-sm text-muted-foreground">6-year payroll data retention</p>
                  </div>
                  <Badge variant="default" className="bg-green-600">Compliant</Badge>
                </div>

                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Construction Industry Standards</p>
                    <p className="text-sm text-muted-foreground">H&S records and RAMS retention</p>
                  </div>
                  <Badge variant="secondary">Review Required</Badge>
                </div>

                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Insurance Requirements</p>
                    <p className="text-sm text-muted-foreground">12-year project documentation</p>
                  </div>
                  <Badge variant="default" className="bg-green-600">Compliant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}