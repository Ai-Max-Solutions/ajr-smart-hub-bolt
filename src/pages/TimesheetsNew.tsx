import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CelebrationSystem } from '@/components/gamification/CelebrationSystem';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Star, 
  Send,
  TrendingUp,
  Award
} from 'lucide-react';

interface WorkLogEntry {
  id: string;
  hours: number;
  notes: string;
  completed_at: string;
  assignment: {
    plot: { name: string; code: string };
    work_category: { main_category: string; sub_task: string };
    estimated_hours: number;
  };
  user_rate?: number;
  bonus_applied?: boolean;
  bonus_amount?: number;
}

interface TimesheetSummary {
  total_hours: number;
  total_earnings: number;
  bonus_hours: number;
  bonus_earnings: number;
  entries_count: number;
}

const TimesheetsNew = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([]);
  const [summary, setSummary] = useState<TimesheetSummary>({
    total_hours: 0,
    total_earnings: 0,
    bonus_hours: 0,
    bonus_earnings: 0,
    entries_count: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(new Date());

  useEffect(() => {
    if (user?.id) {
      // Get Monday of current week
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      setWeekStart(monday);
      
      loadTimesheetData(monday);
    }
  }, [user]);

  const loadTimesheetData = async (weekStartDate: Date) => {
    try {
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Load completed work logs for the week that haven't been added to timesheet yet
      const { data: logsData, error: logsError } = await supabase
        .from('unit_work_logs')
        .select(`
          id,
          hours,
          notes,
          completed_at,
          assignment:unit_work_assignments!inner(
            estimated_hours,
            plot:plots!inner(name, code),
            work_category:work_categories!inner(main_category, sub_task)
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .gte('completed_at', weekStartDate.toISOString())
        .lte('completed_at', weekEnd.toISOString())
        .is('timesheet_entry_id', null);

      if (logsError) throw logsError;

      // Get user's current hourly rate
      const { data: rateData } = await supabase
        .from('user_job_rates')
        .select('hourly_rate, bonus_rate')
        .eq('user_id', user?.id)
        .is('effective_to', null)
        .order('effective_from', { ascending: false })
        .limit(1);

      const userRate = rateData?.[0]?.hourly_rate || 25; // Default rate
      const bonusRate = rateData?.[0]?.bonus_rate || 5; // Default bonus

      // Process logs with bonus calculations
      const processedLogs = (logsData || []).map(log => {
        const estimatedHours = log.assignment.estimated_hours || 0;
        const actualHours = log.hours;
        const isUnderTime = actualHours < estimatedHours;
        const bonusHours = isUnderTime ? (estimatedHours - actualHours) : 0;
        
        return {
          ...log,
          user_rate: userRate,
          bonus_applied: isUnderTime,
          bonus_amount: bonusHours * bonusRate
        };
      });

      setWorkLogs(processedLogs);

      // Calculate summary
      const totalHours = processedLogs.reduce((sum, log) => sum + log.hours, 0);
      const totalEarnings = processedLogs.reduce((sum, log) => 
        sum + (log.hours * log.user_rate!) + (log.bonus_amount || 0), 0
      );
      const bonusHours = processedLogs.reduce((sum, log) => 
        sum + (log.bonus_applied ? (log.assignment.estimated_hours - log.hours) : 0), 0
      );
      const bonusEarnings = processedLogs.reduce((sum, log) => sum + (log.bonus_amount || 0), 0);

      setSummary({
        total_hours: totalHours,
        total_earnings: totalEarnings,
        bonus_hours: bonusHours,
        bonus_earnings: bonusEarnings,
        entries_count: processedLogs.length
      });

    } catch (error) {
      console.error('Error loading timesheet data:', error);
      toast({
        title: "Error",
        description: "Failed to load timesheet data",
        variant: "destructive"
      });
    }
  };

  const submitTimesheet = async () => {
    setIsSubmitting(true);
    
    try {
      // Create timesheet record
      const { data: timesheetData, error: timesheetError } = await supabase
        .from('timesheets')
        .insert({
          user_id: user?.id,
          project_id: workLogs[0]?.assignment?.plot?.name, // Will need proper project_id
          week_commencing: weekStart.toISOString().split('T')[0],
          status: 'Submitted' as any
        })
        .select()
        .single();

      if (timesheetError) throw timesheetError;

      // Create timesheet entries for each work log
      const entries = workLogs.map(log => ({
        timesheet_id: timesheetData.id,
        plot_id: log.assignment.plot.name, // Will need proper plot_id
        work_category_id: log.assignment.work_category.main_category, // Will need proper work_category_id
        hours: log.hours,
        notes: `${log.notes}${log.bonus_applied ? ` (Bonus: ${(log.assignment.estimated_hours - log.hours).toFixed(1)}h under estimate)` : ''}`
      }));

      const { error: entriesError } = await supabase
        .from('timesheet_entries')
        .insert(entries);

      if (entriesError) throw entriesError;

      // Update work logs to reference timesheet entry
      // Update work logs to reference timesheet (simplified for now)
      const { error: updateError } = await supabase
        .from('unit_work_logs')
        .update({ notes: 'Timesheet submitted' })
        .in('id', workLogs.map(log => log.id));

      if (updateError) throw updateError;

      // Show celebration
      setShowCelebration(true);
      
      toast({
        title: "Timesheet Submitted! 🎉",
        description: `£${summary.total_earnings.toFixed(2)} total earnings${summary.bonus_earnings > 0 ? ` (£${summary.bonus_earnings.toFixed(2)} bonus!)` : ''}`,
      });

      // Clear the form
      setWorkLogs([]);
      setSummary({
        total_hours: 0,
        total_earnings: 0,
        bonus_hours: 0,
        bonus_earnings: 0,
        entries_count: 0
      });

    } catch (error) {
      console.error('Error submitting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to submit timesheet",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weekly Timesheet</h1>
          <p className="text-muted-foreground">
            Week of {weekStart.toLocaleDateString()} - Auto-populated from work logs
          </p>
        </div>
        
        <Button 
          onClick={submitTimesheet}
          disabled={workLogs.length === 0 || isSubmitting}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Submitting...' : 'Submit Timesheet'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{summary.total_hours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">£{summary.total_earnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bonus Hours</p>
                <p className="text-2xl font-bold">{summary.bonus_hours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bonus Earnings</p>
                <p className="text-2xl font-bold">£{summary.bonus_earnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Work Log Entries ({summary.entries_count})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workLogs.length > 0 ? (
            <div className="space-y-4">
              {workLogs.map((log, index) => (
                <div key={log.id}>
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {log.assignment.plot.name} - {log.assignment.work_category.sub_task}
                        </h3>
                        {log.bonus_applied && (
                          <Badge className="bg-yellow-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Bonus!
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {log.assignment.work_category.main_category}
                      </p>
                      
                      {log.notes && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Notes: {log.notes}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Completed: {new Date(log.completed_at).toLocaleDateString()}
                        </span>
                        <span>
                          Est: {log.assignment.estimated_hours}h
                        </span>
                        <span>
                          Actual: {log.hours}h
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="space-y-1">
                        <p className="font-semibold">
                          £{((log.hours * log.user_rate!) + (log.bonus_amount || 0)).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Base: £{(log.hours * log.user_rate!).toFixed(2)}
                        </p>
                        {log.bonus_amount! > 0 && (
                          <p className="text-sm text-yellow-600">
                            Bonus: £{log.bonus_amount!.toFixed(2)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Rate: £{log.user_rate}/hr
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {index < workLogs.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No work logs this week</h3>
              <p className="text-muted-foreground">
                Complete some work assignments to populate your timesheet automatically
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bonus Breakdown */}
      {summary.bonus_earnings > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <Award className="h-5 w-5" />
              Bonus Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{summary.bonus_hours.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Hours Under Estimate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">£{summary.bonus_earnings.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Bonus Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {((summary.bonus_earnings / summary.total_earnings) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">of Total Earnings</p>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                🎯 Keep crushing those estimates for more bonus time with Maxwell! 🐕
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Celebration System */}
      <CelebrationSystem
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        type="achievement"
        message={`Timesheet submitted! £${summary.total_earnings.toFixed(2)} earned this week!`}
      />
    </div>
  );
};

export default TimesheetsNew;