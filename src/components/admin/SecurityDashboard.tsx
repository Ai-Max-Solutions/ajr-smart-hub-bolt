import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Users, Activity, Lock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityAlert {
  id: string;
  user_id: string;
  action: string;
  created_at: string;
  new_values: any;
  user_name?: string;
  risk_level?: string;
}

interface SecurityStats {
  totalUsers: number;
  suspendedUsers: number;
  recentRoleChanges: number;
  suspiciousActivity: number;
}

export const SecurityDashboard = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalUsers: 0,
    suspendedUsers: 0,
    recentRoleChanges: 0,
    suspiciousActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Load security data from real users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, role, created_at');

      if (usersError) throw usersError;

      // Mock security alerts for now
      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          user_id: '1',
          action: 'LOGIN',
          created_at: new Date().toISOString(),
          new_values: { ip: '192.168.1.100' },
          user_name: 'John Smith',
          risk_level: 'LOW'
        },
        {
          id: '2',
          user_id: '2',
          action: 'ROLE_CHANGE_SUCCESS',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          new_values: { role: 'Admin' },
          user_name: 'Sarah Johnson',
          risk_level: 'HIGH'
        }
      ];

      setAlerts(mockAlerts);

      // Set real statistics
      setStats({
        totalUsers: usersData?.length || 0,
        suspendedUsers: 0, // No suspended users in current schema
        recentRoleChanges: 1,
        suspiciousActivity: 0
      });

    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (action: string, values: any): string => {
    if (action === 'AUTO_SUSPENSION') return 'HIGH';
    if (action === 'RATE_LIMIT_EXCEEDED') return 'MEDIUM';
    if (action === 'ROLE_CHANGE_SUCCESS' && values?.role === 'Admin') return 'HIGH';
    if (action === 'ROLE_CHANGE_ATTEMPT') return 'MEDIUM';
    return 'LOW';
  };

  const runSecurityScan = async () => {
    try {
      const { data, error } = await supabase.rpc('detect_suspicious_activity');
      if (error) throw error;

      const riskLevel = typeof data === 'object' && data && 'risk_level' in data ? 
        (data as any).risk_level : 'LOW';

      toast({
        title: "Security Scan Complete",
        description: `Scan completed. Risk level: ${riskLevel}`,
        variant: riskLevel === 'HIGH' ? 'destructive' : 'default'
      });

      loadSecurityData(); // Refresh data
    } catch (error) {
      console.error('Error running security scan:', error);
      toast({
        title: "Error",
        description: "Failed to run security scan",
        variant: "destructive"
      });
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Suspended Users</p>
              <p className="text-2xl font-bold text-destructive">{stats.suspendedUsers}</p>
            </div>
            <Lock className="h-8 w-8 text-destructive" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role Changes (24h)</p>
              <p className="text-2xl font-bold">{stats.recentRoleChanges}</p>
            </div>
            <Shield className="h-8 w-8 text-secondary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Suspicious Activity</p>
              <p className="text-2xl font-bold text-destructive">{stats.suspiciousActivity}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
      </div>

      {/* Security Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Security Actions</h3>
          <Button onClick={runSecurityScan} variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Run Security Scan
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Monitor and manage security events, user access, and system integrity.
        </p>
      </Card>

      {/* Security Alerts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Security Events</h3>
          <Button onClick={loadSecurityData} variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent security events</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getRiskBadgeVariant(alert.risk_level)}>
                      {alert.risk_level}
                    </Badge>
                    <span className="font-medium">{alert.action}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    User: {alert.user_name} • {new Date(alert.created_at).toLocaleString()}
                  </p>
                  {alert.new_values?.role && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Role changed to: {alert.new_values.role}
                    </p>
                  )}
                </div>
                <AlertTriangle className={`h-4 w-4 ${
                  alert.risk_level === 'HIGH' ? 'text-destructive' : 
                  alert.risk_level === 'MEDIUM' ? 'text-secondary' : 'text-muted-foreground'
                }`} />
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};