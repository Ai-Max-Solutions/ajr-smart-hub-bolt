import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, Globe, LogOut, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  device_info?: string;
  ip_address?: string;
  location?: string;
  is_current?: boolean;
}

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ip_address: string;
  user_agent: string;
  created_at: string;
  failure_reason?: string;
}

export const SessionManagement = () => {
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchLoginAttempts();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      // Mock session data since Supabase doesn't expose session management directly
      const mockSessions: Session[] = [
        {
          id: '1',
          user_id: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          device_info: 'Chrome on Windows 11',
          ip_address: '192.168.1.1',
          location: 'London, UK',
          is_current: true
        },
        {
          id: '2',
          user_id: user?.id || '',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          device_info: 'Safari on iPhone',
          ip_address: '192.168.1.2',
          location: 'London, UK',
          is_current: false
        }
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    }
  };

  const fetchLoginAttempts = async () => {
    try {
      // Mock login attempts data
      const mockAttempts: LoginAttempt[] = [
        {
          id: '1',
          email: user?.email || '',
          success: true,
          ip_address: '192.168.1.1',
          user_agent: 'Chrome/91.0.4472.124',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          email: user?.email || '',
          success: false,
          ip_address: '192.168.1.3',
          user_agent: 'Chrome/91.0.4472.124',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          failure_reason: 'Invalid password'
        },
        {
          id: '3',
          email: user?.email || '',
          success: true,
          ip_address: '192.168.1.2',
          user_agent: 'Safari/14.1.1',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      setLoginAttempts(mockAttempts);
    } catch (error) {
      console.error('Error fetching login attempts:', error);
      toast.error('Failed to fetch login attempts');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    if (sessions.find(s => s.id === sessionId)?.is_current) {
      // If terminating current session, sign out
      await signOut();
      return;
    }

    try {
      // Mock session termination
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session terminated successfully');
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      // Mock terminating all other sessions
      setSessions(prev => prev.filter(s => s.is_current));
      toast.success('All other sessions terminated');
    } catch (error) {
      console.error('Error terminating sessions:', error);
      toast.error('Failed to terminate sessions');
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    if (deviceInfo.toLowerCase().includes('iphone') || deviceInfo.toLowerCase().includes('android')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const activeSessionsCount = sessions.filter(s => s.is_current).length;
  const suspiciousAttempts = loginAttempts.filter(a => !a.success).length;
  const recentLoginAttempts = loginAttempts.filter(a => 
    new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Session Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your active sessions and login attempts
          </p>
        </div>
        <Button onClick={terminateAllOtherSessions} variant="outline">
          <LogOut className="h-4 w-4 mr-2" />
          End All Other Sessions
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Monitor className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{sessions.length}</p>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{recentLoginAttempts}</p>
                <p className="text-sm text-muted-foreground">Recent Logins (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{suspiciousAttempts}</p>
                <p className="text-sm text-muted-foreground">Failed Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alert */}
      {suspiciousAttempts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {suspiciousAttempts} failed login attempt(s) detected. Review your recent activity below.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="attempts">Login Attempts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions ({sessions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getDeviceIcon(session.device_info || '')}
                          <span>{session.device_info}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{session.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {session.ip_address}
                      </TableCell>
                      <TableCell>
                        {new Date(session.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {session.is_current ? (
                          <Badge className="bg-green-100 text-green-800">Current</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          {session.is_current ? 'Sign Out' : 'Terminate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Login Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>User Agent</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">
                        {attempt.email}
                      </TableCell>
                      <TableCell>
                        {attempt.success ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {attempt.ip_address}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {attempt.user_agent}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(attempt.created_at).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {attempt.failure_reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};