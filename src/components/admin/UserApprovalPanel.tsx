import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Users, FileText, AlertTriangle } from 'lucide-react';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  onboarding_completed: boolean;
  account_status: string;
  trial_expires_at: string | null;
}

export const UserApprovalPanel = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, created_at, onboarding_completed, account_status, trial_expires_at')
        .eq('onboarding_completed', true)
        .neq('account_status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    setProcessing(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          account_status: 'active'
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Approved",
        description: "User has been granted full access to the dashboard",
      });

      // Remove from pending list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const rejectUser = async (userId: string) => {
    setProcessing(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          account_status: 'inactive'
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Rejected",
        description: "User access has been denied",
      });

      // Remove from pending list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            User Approval Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pending users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Approval Panel
          <Badge variant="secondary" className="ml-auto">
            {pendingUsers.length} Pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">No users pending approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <Card key={user.id} className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={
                          user.account_status === 'trial' 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-amber-100 text-amber-800"
                        }>
                          {user.account_status === 'trial' ? (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Trial Access
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Pending Review
                            </>
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Signed up {new Date(user.created_at).toLocaleDateString()}
                        </span>
                        {user.trial_expires_at && user.account_status === 'trial' && (
                          <span className="text-xs text-orange-600 font-medium">
                            Trial expires {new Date(user.trial_expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectUser(user.id)}
                        disabled={processing === user.id}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveUser(user.id)}
                        disabled={processing === user.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing === user.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
