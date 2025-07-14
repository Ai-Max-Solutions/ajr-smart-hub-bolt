import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  DollarSign, 
  X, 
  Download, 
  Phone, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Calendar,
  Building2,
  MapPin
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Types for payslip data
interface PayslipRecord {
  id: string;
  weekEnding: string;
  projects: string[];
  daysWorked: number;
  dayRate: number;
  partialHours: number;
  hourlyRate: number;
  pieceworkUnits: number;
  pieceworkRate: number;
  grossTotal: number;
  status: 'pending' | 'approved' | 'exported' | 'paid' | 'rejected';
  rejectionReason?: string;
  plotsWorked: string[];
  pieceworkItems: Array<{ description: string; units: number; rate: number }>;
  notes?: string;
  approvedBy?: string;
  approvalDate?: string;
  exportId?: string;
}

interface YearToDateSummary {
  totalDaysWorked: number;
  totalGross: number;
  pieceworkTotal: number;
}

const MyPayslips = () => {
  const { toast } = useToast();
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // Mock data - in real app this would come from API
  const mockPayslips: PayslipRecord[] = [
    {
      id: '1',
      weekEnding: '21 July 2025',
      projects: ['Woodberry Down Phase 2 Block D'],
      daysWorked: 5,
      dayRate: 180,
      partialHours: 2.5,
      hourlyRate: 22,
      pieceworkUnits: 18,
      pieceworkRate: 35,
      grossTotal: 1585,
      status: 'paid',
      plotsWorked: ['Level 1 – Plot 1.02', 'Level 1 – Plot 1.03'],
      pieceworkItems: [
        { description: 'MVHR Install', units: 8, rate: 35 },
        { description: '1st Fix Pipework', units: 10, rate: 35 }
      ],
      notes: 'Left early Friday, 2.5 partial hours',
      approvedBy: 'Jane Doe',
      approvalDate: '22 Jul 2025',
      exportId: 'PAYEXPORT-0021'
    },
    {
      id: '2',
      weekEnding: '14 July 2025',
      projects: ['Woodberry Down Phase 2 Block D'],
      daysWorked: 5,
      dayRate: 180,
      partialHours: 0,
      hourlyRate: 22,
      pieceworkUnits: 15,
      pieceworkRate: 35,
      grossTotal: 1425,
      status: 'exported',
      plotsWorked: ['Level 2 – Plot 2.05', 'Level 2 – Plot 2.06'],
      pieceworkItems: [
        { description: 'MVHR Install', units: 15, rate: 35 }
      ],
      approvedBy: 'Jane Doe',
      approvalDate: '15 Jul 2025',
      exportId: 'PAYEXPORT-0020'
    },
    {
      id: '3',
      weekEnding: '7 July 2025',
      projects: ['Kidbrooke Village Block C'],
      daysWorked: 4,
      dayRate: 180,
      partialHours: 0,
      hourlyRate: 22,
      pieceworkUnits: 0,
      pieceworkRate: 0,
      grossTotal: 720,
      status: 'approved',
      plotsWorked: ['Level 3 – Plot 3.01'],
      pieceworkItems: [],
      approvedBy: 'Mark Williams',
      approvalDate: '8 Jul 2025'
    }
  ];

  const ytdSummary: YearToDateSummary = {
    totalDaysWorked: 118,
    totalGross: 26420,
    pieceworkTotal: 5400
  };

  const getStatusIcon = (status: PayslipRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'exported':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'rejected':
        return <X className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: PayslipRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning">Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-success border-success">Approved</Badge>;
      case 'exported':
        return <Badge variant="outline" className="text-success border-success">Exported</Badge>;
      case 'paid':
        return <Badge className="bg-success text-success-foreground">✅ Paid</Badge>;
      case 'rejected':
        return <Badge variant="destructive">❌ Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleDownloadPayslip = (payslip: PayslipRecord) => {
    toast({
      title: "Payslip Downloaded!",
      description: `Week ending ${payslip.weekEnding} saved to downloads`,
    });
  };

  const handleContactSupervisor = () => {
    toast({
      title: "Contacting Supervisor",
      description: "Opening contact form...",
    });
  };

  const handleRaiseDispute = (payslip: PayslipRecord) => {
    toast({
      title: "Dispute Form",
      description: `Pre-filling dispute for week ending ${payslip.weekEnding}`,
    });
  };

  const toggleExpanded = (weekId: string) => {
    setExpandedWeek(expandedWeek === weekId ? null : weekId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aj-navy-deep to-aj-navy-light p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">My Payslips</CardTitle>
                <p className="text-primary-foreground/80">
                  Your weekly earnings breakdown with real-time status
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-accent" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Year to Date Summary */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Year to Date Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{ytdSummary.totalDaysWorked}</div>
                <div className="text-sm text-muted-foreground">Total Days Worked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">£{ytdSummary.totalGross.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Gross</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">£{ytdSummary.pieceworkTotal.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Piecework Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Payslips */}
      <div className="max-w-4xl mx-auto space-y-4">
        {mockPayslips.map((payslip) => {
          const isExpanded = expandedWeek === payslip.id;
          
          return (
            <Card key={payslip.id} className="card-hover">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleExpanded(payslip.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      {getStatusIcon(payslip.status)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">Week Ending {payslip.weekEnding}</CardTitle>
                      <p className="text-muted-foreground">{payslip.projects.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">£{payslip.grossTotal.toLocaleString()}</div>
                      {getStatusBadge(payslip.status)}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                {/* Quick Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {payslip.daysWorked > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">{payslip.daysWorked} days</span>
                      <span className="text-muted-foreground"> @ £{payslip.dayRate}/day</span>
                    </div>
                  )}
                  {payslip.partialHours > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">{payslip.partialHours}h</span>
                      <span className="text-muted-foreground"> @ £{payslip.hourlyRate}/hr</span>
                    </div>
                  )}
                  {payslip.pieceworkUnits > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">{payslip.pieceworkUnits} units</span>
                      <span className="text-muted-foreground"> @ £{payslip.pieceworkRate}/unit</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <Separator className="mb-6" />
                  
                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Work Details */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Work Details
                      </h4>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Plots Worked:</span>
                          <div className="text-muted-foreground">
                            {payslip.plotsWorked.join(', ')}
                          </div>
                        </div>
                        
                        {payslip.pieceworkItems.length > 0 && (
                          <div>
                            <span className="font-medium">Piecework Items:</span>
                            <div className="text-muted-foreground">
                              {payslip.pieceworkItems.map((item, idx) => (
                                <div key={idx}>
                                  {item.description}: {item.units} units × £{item.rate}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {payslip.notes && (
                          <div>
                            <span className="font-medium">Notes:</span>
                            <div className="text-muted-foreground">{payslip.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Approval & Export Info */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        Approval Info
                      </h4>
                      
                      <div className="space-y-2 text-sm">
                        {payslip.approvedBy && (
                          <div>
                            <span className="font-medium">Approved By:</span>
                            <div className="text-muted-foreground">{payslip.approvedBy}</div>
                          </div>
                        )}
                        
                        {payslip.approvalDate && (
                          <div>
                            <span className="font-medium">Approval Date:</span>
                            <div className="text-muted-foreground">{payslip.approvalDate}</div>
                          </div>
                        )}
                        
                        {payslip.exportId && (
                          <div>
                            <span className="font-medium">Export ID:</span>
                            <div className="text-muted-foreground font-mono">{payslip.exportId}</div>
                          </div>
                        )}

                        {payslip.status === 'rejected' && payslip.rejectionReason && (
                          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                            <div className="flex items-center gap-2 text-destructive font-medium">
                              <AlertTriangle className="w-4 h-4" />
                              Rejection Reason
                            </div>
                            <div className="text-destructive text-sm mt-1">
                              {payslip.rejectionReason}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <Separator className="my-6" />
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={() => handleDownloadPayslip(payslip)}
                      className="btn-accent"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Payslip
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleContactSupervisor}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Supervisor
                    </Button>
                    
                    {payslip.status === 'rejected' && (
                      <Button 
                        variant="destructive"
                        onClick={() => handleRaiseDispute(payslip)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Raise Dispute
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="max-w-4xl mx-auto mt-8">
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              If you spot an error in your payslip, please raise a dispute before payday.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyPayslips;