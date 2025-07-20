import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Mic, Clock, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { WorkLogForm } from '@/components/work-assignment/WorkLogForm';
import { QRScanner } from '@/components/work-assignment/QRScanner';
import { VoiceLogger } from '@/components/work-assignment/VoiceLogger';

interface Assignment {
  id: string;
  plot_id: string;
  work_category_id: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'disputed';
  estimated_hours: number;
  due_date: string;
  plot: {
    composite_code: string;
    name: string;
  };
  work_category: {
    main_category: string;
    sub_task: string;
  };
}

interface WorkLog {
  id: string;
  assignment_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  hours: number;
  notes: string;
  created_at: string;
  plot: {
    composite_code: string;
  };
  work_category: {
    main_category: string;
    sub_task: string;
  };
}

export const MyWork: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showVoiceLogger, setShowVoiceLogger] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadMyWork();
    }
  }, [user]);

  const loadMyWork = async () => {
    try {
      setLoading(true);

      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('unit_work_assignments')
        .select(`
          *,
          plot:plots(composite_code, name),
          work_category:work_categories(main_category, sub_task)
        `)
        .eq('assigned_user_id', user?.id)
        .order('due_date', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Load work logs
      const { data: workLogsData, error: workLogsError } = await supabase
        .from('unit_work_logs')
        .select(`
          *,
          plot:plots(composite_code),
          work_category:work_categories(main_category, sub_task)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (workLogsError) throw workLogsError;

      setAssignments(assignmentsData || []);
      setWorkLogs(workLogsData || []);

    } catch (error) {
      console.error('Error loading work data:', error);
      toast({
        title: "Error",
        description: "Failed to load work assignments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };

  const handleQRScan = (plotId: string) => {
    const assignment = assignments.find(a => a.plot_id === plotId);
    if (assignment) {
      setSelectedAssignment(assignment);
      setShowQRScanner(false);
      toast({
        title: "Plot Found",
        description: `Loaded work for ${assignment.plot.composite_code}`,
      });
    } else {
      toast({
        title: "No Work Assigned",
        description: "You don't have any work assigned to this plot",
        variant: "destructive"
      });
    }
  };

  const handleWorkLogSubmit = async (data: {
    hours: number;
    notes: string;
    voiceTranscript?: string;
    photos?: string[];
  }) => {
    if (!selectedAssignment) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('unit_work_logs')
        .insert({
          assignment_id: selectedAssignment.id,
          user_id: user?.id,
          plot_id: selectedAssignment.plot_id,
          work_category_id: selectedAssignment.work_category_id,
          status: 'completed',
          hours: data.hours,
          notes: data.notes,
          voice_transcript: data.voiceTranscript,
          completion_photos: data.photos || [],
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Show celebration
      toast({
        title: "🎉 Job Completed!",
        description: `Great work on ${selectedAssignment.plot.composite_code}! ${
          data.hours < selectedAssignment.estimated_hours 
            ? 'Bonus unlocked for early completion!' 
            : 'Time logged successfully.'
        }`,
      });

      setSelectedAssignment(null);
      await loadMyWork();

    } catch (error) {
      console.error('Error logging work:', error);
      toast({
        title: "Error",
        description: "Failed to log work completion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'assigned': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'assigned': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLevel = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'overdue';
    if (days <= 1) return 'urgent';
    if (days <= 3) return 'high';
    return 'normal';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'border-red-500 bg-red-50';
      case 'urgent': return 'border-orange-500 bg-orange-50';
      case 'high': return 'border-yellow-500 bg-yellow-50';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your work...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Work</h1>
          <p className="text-muted-foreground">Log your completed work and track progress</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowQRScanner(true)}
            className="gap-2"
          >
            <QrCode className="h-4 w-4" />
            QR Scan
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowVoiceLogger(true)}
            className="gap-2"
          >
            <Mic className="h-4 w-4" />
            Voice Log
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter(a => a.status === 'assigned').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter(a => a.status === 'in_progress').length}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter(a => a.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {assignments.reduce((sum, a) => sum + (a.estimated_hours || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Assignments */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Current Assignments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assignment) => {
            const priority = getPriorityLevel(assignment.due_date);
            return (
              <Card 
                key={assignment.id} 
                className={`transition-all hover:shadow-lg ${getPriorityColor(priority)}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{assignment.plot.composite_code}</CardTitle>
                      <p className="text-sm text-muted-foreground">{assignment.plot.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.status)}
                      <Badge className={`text-white ${getStatusColor(assignment.status)}`}>
                        {assignment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">{assignment.work_category.main_category}</h4>
                    <p className="text-sm text-muted-foreground">{assignment.work_category.sub_task}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span>Est. {assignment.estimated_hours}h</span>
                    {assignment.due_date && (
                      <span className={priority === 'overdue' ? 'text-red-600 font-medium' : ''}>
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleStartWork(assignment)}
                    disabled={assignment.status === 'completed'}
                    className="w-full"
                    variant={assignment.status === 'completed' ? 'secondary' : 'default'}
                  >
                    {assignment.status === 'completed' ? 'Completed' : 'Log Work'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {assignments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No work assignments found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact your project manager if you expect to have work assigned.
            </p>
          </div>
        )}
      </div>

      {/* Recent Work Logs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Work Logs</h2>
        <div className="space-y-3">
          {workLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="secondary">{log.plot.composite_code}</Badge>
                      <span className="font-medium">{log.work_category.main_category}</span>
                      <Badge className={`text-white ${getStatusColor(log.status)}`}>
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.notes}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{log.hours}h</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {workLogs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No work logs yet.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <QRScanner
        open={showQRScanner}
        onOpenChange={setShowQRScanner}
        onScanSuccess={handleQRScan}
      />

      <VoiceLogger
        open={showVoiceLogger}
        onOpenChange={setShowVoiceLogger}
        assignments={assignments}
        onSubmit={handleWorkLogSubmit}
      />

      {selectedAssignment && (
        <WorkLogForm
          assignment={selectedAssignment}
          open={!!selectedAssignment}
          onOpenChange={() => setSelectedAssignment(null)}
          onSubmit={handleWorkLogSubmit}
        />
      )}
    </div>
  );
};