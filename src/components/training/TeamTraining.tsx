import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCircle, Clock, Users, Plus, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  trainingStatus: {
    approved: number;
    pending: number;
    expired: number;
    dueSoon: number;
  };
}

interface TrainingSession {
  id: string;
  title: string;
  type: 'Toolbox Talk' | 'Induction' | 'Refresher';
  date: Date;
  attendees: string[];
  conductor: string;
  status: 'completed' | 'pending-approval';
}

interface PendingApproval {
  id: string;
  operativeName: string;
  trainingTitle: string;
  submittedDate: Date;
  evidence: string;
  notes?: string;
}

const TeamTraining = () => {
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Smith',
      role: 'Site Operative',
      trainingStatus: { approved: 8, pending: 1, expired: 0, dueSoon: 2 }
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      role: 'Senior Operative',
      trainingStatus: { approved: 12, pending: 0, expired: 1, dueSoon: 1 }
    },
    {
      id: '3',
      name: 'Mike Johnson',
      role: 'Site Operative',
      trainingStatus: { approved: 6, pending: 2, expired: 0, dueSoon: 3 }
    },
    {
      id: '4',
      name: 'Emma Davis',
      role: 'Apprentice',
      trainingStatus: { approved: 4, pending: 3, expired: 0, dueSoon: 1 }
    }
  ]);

  const [sessions, setSessions] = useState<TrainingSession[]>([
    {
      id: '1',
      title: 'Weekly Safety Briefing',
      type: 'Toolbox Talk',
      date: new Date('2024-12-10'),
      attendees: ['1', '2', '3'],
      conductor: 'Mark Thompson',
      status: 'completed'
    },
    {
      id: '2',
      title: 'Ladder Safety Refresher',
      type: 'Toolbox Talk',
      date: new Date('2024-12-08'),
      attendees: ['1', '4'],
      conductor: 'Sarah Wilson',
      status: 'pending-approval'
    }
  ]);

  const [pendingApprovals] = useState<PendingApproval[]>([
    {
      id: '1',
      operativeName: 'John Smith',
      trainingTitle: 'Confined Space Entry Refresher',
      submittedDate: new Date('2024-12-09'),
      evidence: 'external-training-cert-20241209.pdf',
      notes: 'Completed at external training center'
    },
    {
      id: '2',
      operativeName: 'Mike Johnson',
      trainingTitle: 'First Aid Refresher',
      submittedDate: new Date('2024-12-08'),
      evidence: 'first-aid-certificate.pdf'
    }
  ]);

  const [newSessionDialog, setNewSessionDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newSession, setNewSession] = useState({
    title: '',
    type: 'Toolbox Talk' as const,
    date: '',
    selectedAttendees: [] as string[],
    notes: ''
  });

  const getStatusColor = (status: 'approved' | 'pending' | 'expired' | 'dueSoon') => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'pending': return 'text-amber-600';
      case 'expired': return 'text-red-600';
      case 'dueSoon': return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  const getCompliancePercentage = (member: TeamMember) => {
    const total = Object.values(member.trainingStatus).reduce((sum, count) => sum + count, 0);
    return total > 0 ? Math.round((member.trainingStatus.approved / total) * 100) : 0;
  };

  const getOverallTeamCompliance = () => {
    const totalApproved = teamMembers.reduce((sum, member) => sum + member.trainingStatus.approved, 0);
    const totalItems = teamMembers.reduce((sum, member) => 
      sum + Object.values(member.trainingStatus).reduce((memberSum, count) => memberSum + count, 0), 0);
    return totalItems > 0 ? Math.round((totalApproved / totalItems) * 100) : 0;
  };

  const filteredMembers = teamMembers.filter(member => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'compliant') return member.trainingStatus.expired === 0 && member.trainingStatus.dueSoon === 0;
    if (filterStatus === 'issues') return member.trainingStatus.expired > 0 || member.trainingStatus.dueSoon > 0;
    return true;
  });

  const handleLogSession = () => {
    const session: TrainingSession = {
      id: Date.now().toString(),
      title: newSession.title,
      type: newSession.type,
      date: new Date(newSession.date),
      attendees: newSession.selectedAttendees,
      conductor: 'Current User', // Would be actual logged-in user
      status: 'completed'
    };

    setSessions(prev => [session, ...prev]);
    setNewSessionDialog(false);
    setNewSession({
      title: '',
      type: 'Toolbox Talk',
      date: '',
      selectedAttendees: [],
      notes: ''
    });

    toast({
      title: "Training Session Logged",
      description: `${newSession.title} recorded for ${newSession.selectedAttendees.length} attendees`
    });
  };

  const handleApproval = (id: string, approved: boolean) => {
    toast({
      title: approved ? "Training Approved" : "Training Rejected",
      description: approved ? "Evidence has been approved and recorded" : "Operative has been notified to resubmit"
    });
  };

  const toggleAttendee = (memberId: string) => {
    setNewSession(prev => ({
      ...prev,
      selectedAttendees: prev.selectedAttendees.includes(memberId)
        ? prev.selectedAttendees.filter(id => id !== memberId)
        : [...prev.selectedAttendees, memberId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Training</h1>
          <p className="text-muted-foreground">Monitor and manage team training compliance</p>
        </div>
        
        <Dialog open={newSessionDialog} onOpenChange={setNewSessionDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log Training Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Training Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session-title">Training Title</Label>
                  <Input
                    id="session-title"
                    value={newSession.title}
                    onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Weekly Safety Briefing"
                  />
                </div>
                <div>
                  <Label htmlFor="session-type">Type</Label>
                  <Select value={newSession.type} onValueChange={(value: any) => setNewSession(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Toolbox Talk">Toolbox Talk</SelectItem>
                      <SelectItem value="Induction">Induction</SelectItem>
                      <SelectItem value="Refresher">Refresher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="session-date">Date & Time</Label>
                <Input
                  id="session-date"
                  type="datetime-local"
                  value={newSession.date}
                  onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Attendees</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attendee-${member.id}`}
                        checked={newSession.selectedAttendees.includes(member.id)}
                        onCheckedChange={() => toggleAttendee(member.id)}
                      />
                      <label htmlFor={`attendee-${member.id}`} className="text-sm font-medium cursor-pointer">
                        {member.name} - {member.role}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="session-notes">Notes (Optional)</Label>
                <Textarea
                  id="session-notes"
                  value={newSession.notes}
                  onChange={(e) => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the training session..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleLogSession} disabled={!newSession.title || !newSession.date || newSession.selectedAttendees.length === 0}>
                  Log Session
                </Button>
                <Button variant="outline" onClick={() => setNewSessionDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">{getOverallTeamCompliance()}%</div>
              <div className="text-sm text-muted-foreground">Overall Compliance</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {teamMembers.reduce((sum, m) => sum + m.trainingStatus.approved, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Approved Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {teamMembers.reduce((sum, m) => sum + m.trainingStatus.pending, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Pending Approval</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {teamMembers.reduce((sum, m) => sum + m.trainingStatus.expired, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="team-status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team-status">Team Status</TabsTrigger>
          <TabsTrigger value="pending-approvals">
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-800">{pendingApprovals.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent-sessions">Recent Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="team-status">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  <SelectItem value="compliant">Fully Compliant</SelectItem>
                  <SelectItem value="issues">Has Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredMembers.map(member => (
                <Card key={member.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">{getCompliancePercentage(member)}%</div>
                        <div className="text-sm text-muted-foreground">Compliant</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <div className={`text-lg font-semibold ${getStatusColor('approved')}`}>
                          {member.trainingStatus.approved}
                        </div>
                        <div className="text-xs text-muted-foreground">Approved</div>
                      </div>
                      <div>
                        <div className={`text-lg font-semibold ${getStatusColor('pending')}`}>
                          {member.trainingStatus.pending}
                        </div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                      <div>
                        <div className={`text-lg font-semibold ${getStatusColor('dueSoon')}`}>
                          {member.trainingStatus.dueSoon}
                        </div>
                        <div className="text-xs text-muted-foreground">Due Soon</div>
                      </div>
                      <div>
                        <div className={`text-lg font-semibold ${getStatusColor('expired')}`}>
                          {member.trainingStatus.expired}
                        </div>
                        <div className="text-xs text-muted-foreground">Expired</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending-approvals">
          <div className="space-y-4">
            {pendingApprovals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </CardContent>
              </Card>
            ) : (
              pendingApprovals.map(approval => (
                <Card key={approval.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{approval.operativeName}</h3>
                        <p className="text-sm text-muted-foreground">{approval.trainingTitle}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted: {approval.submittedDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleApproval(approval.id, false)}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproval(approval.id, true)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Evidence: </span>
                        <span className="text-sm text-muted-foreground">{approval.evidence}</span>
                      </div>
                      {approval.notes && (
                        <div>
                          <span className="text-sm font-medium">Notes: </span>
                          <span className="text-sm text-muted-foreground">{approval.notes}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="recent-sessions">
          <div className="space-y-4">
            {sessions.map(session => (
              <Card key={session.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.type} • {session.date.toLocaleDateString()} • Conducted by {session.conductor}
                      </p>
                    </div>
                    <Badge className={session.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                      {session.status === 'completed' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Completed</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" />Pending</>
                      )}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Attendees ({session.attendees.length}):</p>
                    <p className="text-sm text-muted-foreground">
                      {session.attendees.map(id => 
                        teamMembers.find(m => m.id === id)?.name
                      ).join(', ')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamTraining;