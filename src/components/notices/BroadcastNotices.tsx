import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Send, 
  Users, 
  FileText, 
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface BroadcastNotice {
  id: string;
  type: 'toolbox_talk' | 'safety_alert' | 'general';
  title: string;
  body: string;
  project: string;
  audience: string[];
  signatureRequired: boolean;
  issuedBy: string;
  issuedOn: Date;
  expiryDate?: Date;
  totalRecipients: number;
  readCount: number;
  signedCount: number;
  pendingCount: number;
}

interface Recipient {
  id: string;
  name: string;
  role: string;
  status: 'pending' | 'read' | 'signed';
  readAt?: Date;
  signedAt?: Date;
}

const BroadcastNotices = () => {
  const [notices, setNotices] = useState<BroadcastNotice[]>([
    {
      id: '1',
      type: 'safety_alert',
      title: 'Scaffold Zone Closed - Do Not Enter',
      body: 'The scaffold area on the south side of Block D is temporarily closed due to structural concerns.',
      project: 'Woodberry Down Phase 2',
      audience: ['all'],
      signatureRequired: true,
      issuedBy: 'Jane Doe',
      issuedOn: new Date('2025-07-13T08:00:00'),
      totalRecipients: 24,
      readCount: 18,
      signedCount: 12,
      pendingCount: 6
    },
    {
      id: '2',
      type: 'toolbox_talk',
      title: 'Ladder Safety - Updated Procedures',
      body: 'Updated ladder safety procedures following new HSE guidelines.',
      project: 'Woodberry Down Phase 2',
      audience: ['operatives'],
      signatureRequired: true,
      issuedBy: 'Mark Wilson',
      issuedOn: new Date('2025-07-12T14:30:00'),
      totalRecipients: 18,
      readCount: 16,
      signedCount: 14,
      pendingCount: 2
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<string | null>(null);

  // Mock recipients data
  const recipients: Record<string, Recipient[]> = {
    '1': [
      { id: '1', name: 'John Smith', role: 'Site Operative', status: 'signed', readAt: new Date(), signedAt: new Date() },
      { id: '2', name: 'Mike Johnson', role: 'Site Operative', status: 'read', readAt: new Date() },
      { id: '3', name: 'Sarah Wilson', role: 'Site Operative', status: 'pending' },
    ],
    '2': [
      { id: '1', name: 'John Smith', role: 'Site Operative', status: 'signed', readAt: new Date(), signedAt: new Date() },
      { id: '4', name: 'Dave Brown', role: 'Site Operative', status: 'signed', readAt: new Date(), signedAt: new Date() },
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'success';
      case 'read':
        return 'warning';
      case 'pending':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'safety_alert':
        return 'destructive';
      case 'toolbox_talk':
        return 'accent';
      case 'general':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'safety_alert':
        return 'Safety Alert';
      case 'toolbox_talk':
        return 'Toolbox Talk';
      case 'general':
        return 'Site Notice';
      default:
        return 'Notice';
    }
  };

  const getCompletionPercentage = (notice: BroadcastNotice) => {
    if (!notice.signatureRequired) {
      return (notice.readCount / notice.totalRecipients) * 100;
    }
    return (notice.signedCount / notice.totalRecipients) * 100;
  };

  const CreateNoticeDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogTrigger asChild>
        <Button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Notice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Site Notice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notice-type">Notice Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety_alert">Safety Alert</SelectItem>
                  <SelectItem value="toolbox_talk">Toolbox Talk</SelectItem>
                  <SelectItem value="general">General Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="audience">Audience</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Project Team</SelectItem>
                  <SelectItem value="operatives">Site Operatives Only</SelectItem>
                  <SelectItem value="supervisors">Supervisors Only</SelectItem>
                  <SelectItem value="specific">Specific Roles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input placeholder="Enter notice title" />
          </div>

          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea 
              placeholder="Enter the notice details..."
              className="min-h-[120px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="signature-required" />
            <Label htmlFor="signature-required">Require signature confirmation</Label>
          </div>

          <div>
            <Label htmlFor="expiry">Expiry Date (Optional)</Label>
            <Input type="date" />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-primary">
              <Send className="w-4 h-4 mr-2" />
              Send Notice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Broadcast Notices</h2>
          <p className="text-muted-foreground">Manage site communications and track read status</p>
        </div>
        <CreateNoticeDialog />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notices</SelectItem>
            <SelectItem value="pending">Has Pending</SelectItem>
            <SelectItem value="complete">Fully Complete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {notices.map((notice) => (
          <Card key={notice.id} className="card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={getTypeColor(notice.type) as any}>
                    {getTypeLabel(notice.type)}
                  </Badge>
                  <CardTitle className="text-lg">{notice.title}</CardTitle>
                </div>
                <div className="text-sm text-muted-foreground">
                  {notice.issuedOn.toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  Issued by: {notice.issuedBy} • {notice.totalRecipients} recipients
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{notice.readCount}/{notice.totalRecipients} read</span>
                  </div>
                  {notice.signatureRequired && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{notice.signedCount}/{notice.totalRecipients} signed</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Completion Rate</span>
                    <span>{Math.round(getCompletionPercentage(notice))}%</span>
                  </div>
                  <Progress value={getCompletionPercentage(notice)} className="h-2" />
                </div>

                {/* Notice Body Preview */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notice.body}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedNotice(selectedNotice === notice.id ? null : notice.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Recipients
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Export Log
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit Notice
                    </Button>
                  </div>
                </div>

                {/* Recipients List */}
                {selectedNotice === notice.id && recipients[notice.id] && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-3">Recipients Status</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {recipients[notice.id].map((recipient) => (
                        <div key={recipient.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div>
                            <div className="font-medium text-sm">{recipient.name}</div>
                            <div className="text-xs text-muted-foreground">{recipient.role}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(recipient.status) as any} className="text-xs">
                              {recipient.status.charAt(0).toUpperCase() + recipient.status.slice(1)}
                            </Badge>
                            {recipient.signedAt && (
                              <span className="text-xs text-muted-foreground">
                                {recipient.signedAt.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notices.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notices created yet</p>
            <p className="text-sm text-muted-foreground mt-2">Create your first site notice to keep your team informed</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BroadcastNotices;