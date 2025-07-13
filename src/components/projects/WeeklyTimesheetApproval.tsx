import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Check, 
  X, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Edit3,
  Filter,
  Calendar,
  User,
  Building2,
  Shield,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

// Data interfaces
interface DailyEntry {
  id: string;
  date: string;
  plotId: string;
  plotName: string;
  workType: string;
  isFullDay: boolean;
  fullDayHours: number;
  partialHours?: number;
  pieceworkEntries: {
    id: string;
    workItem: string;
    units: number;
    ratePerUnit: number;
    subtotal: number;
  }[];
  notes?: string;
  complianceStatus: {
    ramsCompleted: boolean;
    cscsValid: boolean;
  };
}

interface WeeklyTimesheet {
  id: string;
  operativeId: string;
  operativeName: string;
  weekEnding: string;
  projectId: string;
  projectName: string;
  status: 'pending' | 'approved' | 'rejected';
  supervisorId?: string;
  supervisorName?: string;
  rejectionReason?: string;
  approvedAt?: string;
  dailyEntries: DailyEntry[];
}

interface TimesheetApprovalProps {
  projectId: string;
}

// Mock data
const mockTimesheets: WeeklyTimesheet[] = [
  {
    id: '1',
    operativeId: 'op1',
    operativeName: 'John Smith',
    weekEnding: '2025-01-19',
    projectId: '1',
    projectName: 'Riverside Development Phase 1',
    status: 'pending',
    dailyEntries: [
      {
        id: 'd1',
        date: '2025-01-13',
        plotId: 'G01',
        plotName: 'Plot G01',
        workType: '1st Fix Pipework',
        isFullDay: true,
        fullDayHours: 7.5,
        pieceworkEntries: [],
        notes: 'Standard installation work',
        complianceStatus: { ramsCompleted: true, cscsValid: true }
      },
      {
        id: 'd2',
        date: '2025-01-14',
        plotId: 'G02',
        plotName: 'Plot G02',
        workType: 'MVHR Install',
        isFullDay: false,
        fullDayHours: 7.5,
        partialHours: 4.5,
        pieceworkEntries: [
          {
            id: 'p1',
            workItem: 'MVHR Unit Install',
            units: 3,
            ratePerUnit: 35,
            subtotal: 105
          }
        ],
        notes: 'Left early for materials delivery',
        complianceStatus: { ramsCompleted: true, cscsValid: true }
      },
      {
        id: 'd3',
        date: '2025-01-15',
        plotId: 'G03',
        plotName: 'Plot G03',
        workType: '1st Fix Pipework',
        isFullDay: true,
        fullDayHours: 7.5,
        pieceworkEntries: [],
        complianceStatus: { ramsCompleted: true, cscsValid: true }
      },
      {
        id: 'd4',
        date: '2025-01-16',
        plotId: 'G04',
        plotName: 'Plot G04',
        workType: 'Mixed Work',
        isFullDay: false,
        fullDayHours: 7.5,
        partialHours: 6,
        pieceworkEntries: [
          {
            id: 'p2',
            workItem: 'Pipe Connections',
            units: 12,
            ratePerUnit: 8,
            subtotal: 96
          }
        ],
        complianceStatus: { ramsCompleted: true, cscsValid: false }
      },
      {
        id: 'd5',
        date: '2025-01-17',
        plotId: 'G05',
        plotName: 'Plot G05',
        workType: '1st Fix Pipework',
        isFullDay: true,
        fullDayHours: 7.5,
        pieceworkEntries: [],
        complianceStatus: { ramsCompleted: true, cscsValid: true }
      }
    ]
  }
];

const WeeklyTimesheetApproval = ({ projectId }: TimesheetApprovalProps) => {
  const [timesheets, setTimesheets] = useState<WeeklyTimesheet[]>(mockTimesheets);
  const [filterOperative, setFilterOperative] = useState<string>('all');
  const [filterWeek, setFilterWeek] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedTimesheet, setExpandedTimesheet] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter timesheets based on selected filters
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter(timesheet => {
      if (filterOperative !== 'all' && timesheet.operativeId !== filterOperative) return false;
      if (filterWeek !== 'all' && timesheet.weekEnding !== filterWeek) return false;
      if (filterStatus !== 'all' && timesheet.status !== filterStatus) return false;
      return true;
    });
  }, [timesheets, filterOperative, filterWeek, filterStatus]);

  // Calculate weekly totals for a timesheet
  const calculateWeeklyTotals = (timesheet: WeeklyTimesheet) => {
    let totalDays = 0;
    let totalPartialHours = 0;
    let totalPieceworkUnits = 0;
    let totalDayRateGross = 0;
    let totalPieceworkGross = 0;

    timesheet.dailyEntries.forEach(entry => {
      if (entry.isFullDay) {
        totalDays += 1;
        totalDayRateGross += 190; // Assuming £190 day rate
      } else if (entry.partialHours) {
        totalPartialHours += entry.partialHours;
        totalDayRateGross += entry.partialHours * 25; // Assuming £25/hour
      }

      entry.pieceworkEntries.forEach(pw => {
        totalPieceworkUnits += pw.units;
        totalPieceworkGross += pw.subtotal;
      });
    });

    return {
      totalDays,
      totalPartialHours,
      totalPieceworkUnits,
      totalDayRateGross,
      totalPieceworkGross,
      totalGross: totalDayRateGross + totalPieceworkGross
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getComplianceStatus = (entries: DailyEntry[]) => {
    const ramsCompliant = entries.every(e => e.complianceStatus.ramsCompleted);
    const cscsValid = entries.every(e => e.complianceStatus.cscsValid);
    
    if (ramsCompliant && cscsValid) return { status: 'compliant', text: 'All Compliant' };
    if (!ramsCompliant && !cscsValid) return { status: 'non-compliant', text: 'RAMS & CSCS Issues' };
    if (!ramsCompliant) return { status: 'partial', text: 'RAMS Missing' };
    if (!cscsValid) return { status: 'partial', text: 'CSCS Invalid' };
    return { status: 'compliant', text: 'Compliant' };
  };

  const handleApprove = (timesheetId: string) => {
    setTimesheets(prev => prev.map(ts => 
      ts.id === timesheetId 
        ? { ...ts, status: 'approved', approvedAt: new Date().toISOString(), supervisorName: 'Current Supervisor' }
        : ts
    ));
    toast({
      title: "Week Approved",
      description: "Timesheet has been approved successfully",
    });
  };

  const handleReject = (timesheetId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setTimesheets(prev => prev.map(ts => 
      ts.id === timesheetId 
        ? { ...ts, status: 'rejected', rejectionReason: reason, supervisorName: 'Current Supervisor' }
        : ts
    ));
    setRejectionReason('');
    toast({
      title: "Week Rejected",
      description: "Timesheet has been rejected",
      variant: "destructive"
    });
  };

  const uniqueOperatives = Array.from(new Set(timesheets.map(ts => ts.operativeName)));
  const uniqueWeeks = Array.from(new Set(timesheets.map(ts => ts.weekEnding)));

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <CardTitle className="flex items-center text-primary">
                <Calendar className="w-5 h-5 mr-2" />
                Weekly Timesheet Approval
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review and approve operative timesheets for the project
              </p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="operative-filter" className="text-sm">Operative:</Label>
                <Select value={filterOperative} onValueChange={setFilterOperative}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Operatives</SelectItem>
                    {uniqueOperatives.map(op => (
                      <SelectItem key={op} value={op}>{op}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="week-filter" className="text-sm">Week:</Label>
                <Select value={filterWeek} onValueChange={setFilterWeek}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Weeks</SelectItem>
                    {uniqueWeeks.map(week => (
                      <SelectItem key={week} value={week}>{week}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="status-filter" className="text-sm">Status:</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timesheets List */}
      <div className="space-y-4">
        {filteredTimesheets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No timesheets found matching the selected filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredTimesheets.map((timesheet) => {
            const totals = calculateWeeklyTotals(timesheet);
            const compliance = getComplianceStatus(timesheet.dailyEntries);
            const isExpanded = expandedTimesheet === timesheet.id;

            return (
              <Card key={timesheet.id} className="transition-all duration-200 hover:shadow-md">
                <Collapsible 
                  open={isExpanded} 
                  onOpenChange={() => setExpandedTimesheet(isExpanded ? null : timesheet.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          <div>
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-primary">{timesheet.operativeName}</h3>
                              {getStatusBadge(timesheet.status)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                              <span>Week Ending: {new Date(timesheet.weekEnding).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                {timesheet.projectName}
                              </span>
                              <span>•</span>
                              <span className={`flex items-center ${
                                compliance.status === 'compliant' ? 'text-success' : 
                                compliance.status === 'non-compliant' ? 'text-destructive' : 'text-warning'
                              }`}>
                                <Shield className="w-3 h-3 mr-1" />
                                {compliance.text}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          {/* Weekly Totals Summary */}
                          <div className="hidden lg:flex items-center space-x-6 text-sm">
                            <div className="text-center">
                              <p className="font-semibold text-primary">{totals.totalDays}</p>
                              <p className="text-xs text-muted-foreground">Days</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-accent">{totals.totalPartialHours}h</p>
                              <p className="text-xs text-muted-foreground">Partial</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-secondary">{totals.totalPieceworkUnits}</p>
                              <p className="text-xs text-muted-foreground">Units</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-lg text-primary">£{totals.totalGross}</p>
                              <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          {timesheet.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(timesheet.id);
                                }}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject Timesheet</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p>Please provide a reason for rejecting {timesheet.operativeName}'s timesheet:</p>
                                    <Textarea
                                      placeholder="Enter rejection reason..."
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleReject(timesheet.id, rejectionReason)}
                                      >
                                        Reject Timesheet
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <Separator className="mb-6" />
                      
                      {/* Weekly Totals for Mobile */}
                      <div className="lg:hidden mb-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="font-semibold text-primary text-lg">{totals.totalDays}</p>
                            <p className="text-xs text-muted-foreground">Days Worked</p>
                          </div>
                          <div>
                            <p className="font-semibold text-accent text-lg">{totals.totalPartialHours}h</p>
                            <p className="text-xs text-muted-foreground">Partial Hours</p>
                          </div>
                          <div>
                            <p className="font-semibold text-secondary text-lg">{totals.totalPieceworkUnits}</p>
                            <p className="text-xs text-muted-foreground">Piecework Units</p>
                          </div>
                          <div>
                            <p className="font-bold text-primary text-xl">£{totals.totalGross}</p>
                            <p className="text-xs text-muted-foreground">Total Gross</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Daily Breakdown Table */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-primary">Daily Breakdown</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Date</th>
                                <th className="text-left p-2">Plot</th>
                                <th className="text-left p-2">Work Type</th>
                                <th className="text-center p-2">Full Day</th>
                                <th className="text-center p-2">Partial Hours</th>
                                <th className="text-center p-2">Piecework</th>
                                <th className="text-center p-2">Status</th>
                                <th className="text-left p-2">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {timesheet.dailyEntries.map((entry) => (
                                <tr key={entry.id} className="border-b hover:bg-muted/50">
                                  <td className="p-2 font-medium">
                                    {new Date(entry.date).toLocaleDateString()}
                                  </td>
                                  <td className="p-2">{entry.plotName}</td>
                                  <td className="p-2">{entry.workType}</td>
                                  <td className="p-2 text-center">
                                    {entry.isFullDay ? (
                                      <Badge className="bg-success text-success-foreground">
                                        {entry.fullDayHours}h
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-center">
                                    {entry.partialHours ? (
                                      <Badge variant="secondary">{entry.partialHours}h</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-center">
                                    {entry.pieceworkEntries.length > 0 ? (
                                      <div className="space-y-1">
                                        {entry.pieceworkEntries.map((pw) => (
                                          <div key={pw.id} className="text-xs">
                                            <Badge className="bg-accent text-accent-foreground">
                                              {pw.units} units @ £{pw.ratePerUnit}
                                            </Badge>
                                            <p className="text-muted-foreground mt-1">£{pw.subtotal}</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="space-y-1">
                                      {entry.complianceStatus.ramsCompleted ? (
                                        <CheckCircle2 className="w-4 h-4 text-success inline mr-1" />
                                      ) : (
                                        <AlertTriangle className="w-4 h-4 text-destructive inline mr-1" />
                                      )}
                                      <span className="text-xs">RAMS</span>
                                      <br />
                                      {entry.complianceStatus.cscsValid ? (
                                        <CheckCircle2 className="w-4 h-4 text-success inline mr-1" />
                                      ) : (
                                        <AlertTriangle className="w-4 h-4 text-destructive inline mr-1" />
                                      )}
                                      <span className="text-xs">CSCS</span>
                                    </div>
                                  </td>
                                  <td className="p-2 max-w-48">
                                    {entry.notes && (
                                      <p className="text-xs text-muted-foreground truncate" title={entry.notes}>
                                        {entry.notes}
                                      </p>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Approval History */}
                      {(timesheet.status === 'approved' || timesheet.status === 'rejected') && (
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                          <h5 className="font-medium text-sm mb-2">Approval History</h5>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>
                              {timesheet.status === 'approved' ? 'Approved' : 'Rejected'} by {timesheet.supervisorName}
                            </span>
                            {timesheet.approvedAt && (
                              <>
                                <span>•</span>
                                <span>{new Date(timesheet.approvedAt).toLocaleString()}</span>
                              </>
                            )}
                          </div>
                          {timesheet.rejectionReason && (
                            <p className="text-sm text-destructive mt-2">
                              <strong>Reason:</strong> {timesheet.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WeeklyTimesheetApproval;