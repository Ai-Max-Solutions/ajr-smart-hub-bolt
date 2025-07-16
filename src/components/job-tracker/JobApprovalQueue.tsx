import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PendingJob {
  id: string;
  project_name: string;
  plot_number: string;
  job_type_name: string;
  work_category_name: string;
  assigned_user_name: string;
  work_date: string;
  work_description: string;
  quantity_completed: number;
  unit_type: string;
  agreed_rate: number;
  rate_type: string;
  calculated_total: number;
  override_total?: number;
  hours_worked?: number;
  materials_used?: any;
  issues_encountered?: string;
  safety_checks_completed: boolean;
  photos?: string[];
  submitted_at: string;
}

interface JobApprovalQueueProps {
  selectedProject: string;
  onJobApproved: () => void;
}

export const JobApprovalQueue: React.FC<JobApprovalQueueProps> = ({
  selectedProject,
  onJobApproved
}) => {
  const { toast } = useToast();
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<PendingJob | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [overrideAmount, setOverrideAmount] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    fetchPendingJobs();
  }, [selectedProject]);

  const fetchPendingJobs = async () => {
    try {
      setLoading(true);
      
      // Mock job data
      const mockJobs = [
        {
          id: '1',
          project_name: 'Construction Project A',
          plot_number: 'Plot 001',
          job_type_name: 'Foundation Work',
          work_category_name: 'Excavation',
          assigned_user_name: 'John Smith',
          work_date: new Date().toISOString().split('T')[0],
          work_description: 'Foundation excavation for main building',
          quantity_completed: 25.5,
          unit_type: 'm³',
          agreed_rate: 45.0,
          rate_type: 'per_unit',
          calculated_total: 1147.5,
          override_total: null,
          hours_worked: 8,
          materials_used: 'Excavation equipment, safety gear',
          issues_encountered: 'Minor soil compaction issue resolved',
          safety_checks_completed: true,
          photos: ['foundation_1.jpg', 'foundation_2.jpg'],
          submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          project_name: 'Construction Project B', 
          plot_number: 'Plot 002',
          job_type_name: 'Concrete Work',
          work_category_name: 'Pouring',
          assigned_user_name: 'Jane Doe',
          work_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          work_description: 'Concrete pouring for ground floor slab',
          quantity_completed: 15.0,
          unit_type: 'm³',
          agreed_rate: 85.0,
          rate_type: 'per_unit',
          calculated_total: 1275.0,
          override_total: null,
          hours_worked: 6,
          materials_used: 'Concrete mix, reinforcement bars',
          issues_encountered: 'Weather delay of 1 hour',
          safety_checks_completed: true,
          photos: ['concrete_1.jpg'],
          submitted_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
        }
      ];

      // Filter by selected project if any
      const filteredJobs = selectedProject 
        ? mockJobs.filter(job => job.project_name.includes(selectedProject))
        : mockJobs;

      setPendingJobs(filteredJobs);
    } catch (error) {
      console.error('Error fetching pending jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load pending jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (jobId: string) => {
    try {
      const updateData: any = {
        status: 'approved',
        approved_at: new Date().toISOString()
      };

      // Add override pricing if specified
      if (overrideAmount !== null && overrideReason) {
        updateData.override_total = overrideAmount;
        updateData.override_reason = overrideReason;
        updateData.override_at = new Date().toISOString();
      }

      // Mock approval - in a real app this would update the database
      console.log('Would approve job:', jobId, 'with data:', updateData);

      toast({
        title: "Job Approved",
        description: "Work has been approved successfully",
      });

      fetchPendingJobs();
      onJobApproved();
      setSelectedJob(null);
      setOverrideAmount(null);
      setOverrideReason('');
    } catch (error) {
      console.error('Error approving job:', error);
      toast({
        title: "Error",
        description: "Failed to approve job",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (jobId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mock rejection - in a real app this would update the database
      console.log('Would reject job:', jobId, 'with reason:', rejectionReason);

      toast({
        title: "Job Rejected",
        description: "Work has been rejected and user will be notified",
      });

      fetchPendingJobs();
      setSelectedJob(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting job:', error);
      toast({
        title: "Error",
        description: "Failed to reject job",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-2" />
          <p>Loading pending jobs...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Job Approval Queue</h2>
        <p className="text-muted-foreground">
          Review and approve submitted work for payment processing
        </p>
      </div>

      {pendingJobs.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
          <h3 className="font-semibold mb-2">No Pending Approvals</h3>
          <p className="text-muted-foreground">
            All submitted work has been reviewed. Great job keeping up!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingJobs.map(job => (
            <Card key={job.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{job.job_type_name}</h3>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                    {!job.safety_checks_completed && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Safety
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Project & Plot</p>
                      <p className="font-medium">{job.project_name} - {job.plot_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Worker</p>
                      <p className="font-medium">{job.assigned_user_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Work Date</p>
                      <p className="font-medium">{new Date(job.work_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">
                        {job.quantity_completed} {job.unit_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rate</p>
                      <p className="font-medium">£{job.agreed_rate.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium text-accent">
                        £{(job.override_total || job.calculated_total).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">Work Description</p>
                    <p className="text-sm">{job.work_description}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedJob(job)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Review Work Submission</DialogTitle>
                        <DialogDescription>
                          Review the details and approve or reject this work submission
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedJob && (
                        <div className="space-y-4">
                          {/* Job Details */}
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Job Type</p>
                              <p className="text-sm">{selectedJob.job_type_name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Category</p>
                              <p className="text-sm">{selectedJob.work_category_name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Worker</p>
                              <p className="text-sm">{selectedJob.assigned_user_name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Date</p>
                              <p className="text-sm">{new Date(selectedJob.work_date).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {/* Work Description */}
                          <div>
                            <p className="text-sm font-medium mb-2">Work Description</p>
                            <p className="text-sm p-3 bg-muted/20 rounded-lg">{selectedJob.work_description}</p>
                          </div>

                          {/* Pricing Details */}
                          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Quantity</p>
                              <p className="text-sm">{selectedJob.quantity_completed} {selectedJob.unit_type}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Rate</p>
                              <p className="text-sm">£{selectedJob.agreed_rate.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Total</p>
                              <p className="text-sm font-semibold">£{selectedJob.calculated_total.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Additional Details */}
                          {selectedJob.materials_used && (
                            <div>
                              <p className="text-sm font-medium mb-2">Materials Used</p>
                              <p className="text-sm p-3 bg-muted/20 rounded-lg">
                                {typeof selectedJob.materials_used === 'object' 
                                  ? selectedJob.materials_used.materials 
                                  : selectedJob.materials_used}
                              </p>
                            </div>
                          )}

                          {selectedJob.issues_encountered && (
                            <div>
                              <p className="text-sm font-medium mb-2">Issues Encountered</p>
                              <p className="text-sm p-3 bg-muted/20 rounded-lg">{selectedJob.issues_encountered}</p>
                            </div>
                          )}

                          {/* Safety Status */}
                          <div className="flex items-center gap-2">
                            {selectedJob.safety_checks_completed ? (
                              <Badge className="bg-success/10 text-success border-success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Safety Checks Completed
                              </Badge>
                            ) : (
                              <Badge className="bg-destructive/10 text-destructive border-destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Safety Checks Not Confirmed
                              </Badge>
                            )}
                          </div>

                          {/* Override Pricing */}
                          <div className="space-y-3 p-4 border rounded-lg">
                            <p className="text-sm font-medium">Override Pricing (Optional)</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-muted-foreground">Override Amount (£)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full p-2 border rounded text-sm"
                                  value={overrideAmount || ''}
                                  onChange={(e) => setOverrideAmount(e.target.value ? parseFloat(e.target.value) : null)}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Reason</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border rounded text-sm"
                                  value={overrideReason}
                                  onChange={(e) => setOverrideReason(e.target.value)}
                                  placeholder="Reason for override..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Rejection Reason */}
                          <div>
                            <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                            <Textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Provide reason for rejection..."
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                      
                      <DialogFooter>
                        <Button
                          variant="destructive"
                          onClick={() => selectedJob && handleReject(selectedJob.id)}
                          disabled={!rejectionReason.trim()}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => selectedJob && handleApprove(selectedJob.id)}
                          className="bg-success hover:bg-success/90"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};