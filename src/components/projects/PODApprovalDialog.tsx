import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Camera,
  Calendar,
  User,
  Package
} from 'lucide-react';
import { format } from 'date-fns';

interface PODRecord {
  id: string;
  pod_type: string;
  supplier_name: string;
  description: string;
  status: string;
  created_at: string;
  pod_photo_url?: string;
  signed_by_name?: string;
  damage_notes?: string;
  approved_at?: string;
}

interface PODApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pod: PODRecord;
  onApprovalUpdate: () => void;
}

const PODApprovalDialog = ({ open, onOpenChange, pod, onApprovalUpdate }: PODApprovalDialogProps) => {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [action, setAction] = useState<'approved' | 'flagged' | 'rejected' | null>(null);

  const handleApproval = async (approvalAction: 'approved' | 'flagged' | 'rejected') => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Update POD status
      const { error: updateError } = await supabase
        .from('pod_register')
        .update({
          status: approvalAction,
          approved_at: approvalAction === 'approved' ? new Date().toISOString() : null,
          approved_by: approvalAction === 'approved' ? profile.id : null
        })
        .eq('id', pod.id);

      if (updateError) throw updateError;

      // Add approval record
      const { error: approvalError } = await supabase
        .from('pod_approvals')
        .insert({
          pod_id: pod.id,
          approver_id: profile.id,
          action: approvalAction,
          comments: comments || null
        });

      if (approvalError) throw approvalError;

      toast({
        title: "POD Updated",
        description: `POD has been ${approvalAction}`,
      });

      onApprovalUpdate();
    } catch (error) {
      console.error('Error updating POD:', error);
      toast({
        title: "Error",
        description: "Failed to update POD status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'default',
      flagged: 'destructive',
      pending: 'secondary',
      rejected: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatPodType = (type: string) => {
    return type.replace('_', ' ').toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Review POD</span>
            {getStatusBadge(pod.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* POD Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">POD Type</Label>
                  <p className="font-medium">{formatPodType(pod.pod_type)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                  <p className="font-medium">{pod.supplier_name}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-1">{pod.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p className="text-sm">{format(new Date(pod.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>

                {pod.signed_by_name && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Signed By</Label>
                      <p className="text-sm">{pod.signed_by_name}</p>
                    </div>
                  </div>
                )}
              </div>

              {pod.damage_notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Damage/Issues</Label>
                  <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{pod.damage_notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* POD Photo */}
          {pod.pod_photo_url && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-medium">POD Photo</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(pod.pod_photo_url, '_blank')}
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    View Full Size
                  </Button>
                </div>
                <img
                  src={pod.pod_photo_url}
                  alt="POD Photo"
                  className="w-full max-h-64 object-contain rounded-md border"
                />
              </CardContent>
            </Card>
          )}

          {/* Approval Actions */}
          {pod.status === 'pending' && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <Label className="font-medium">Review Action</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add any comments about this POD..."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleApproval('approved')}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  
                  <Button
                    onClick={() => handleApproval('flagged')}
                    disabled={loading}
                    variant="destructive"
                    className="flex-1"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Flag Issue
                  </Button>
                  
                  <Button
                    onClick={() => handleApproval('rejected')}
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Close Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PODApprovalDialog;