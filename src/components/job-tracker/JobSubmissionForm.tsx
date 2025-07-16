import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays, Clock, Upload, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobAssignment {
  id: string;
  project_id: string;
  plot_id: string;
  job_type_id: string;
  project_name: string;
  plot_number: string;
  job_type_name: string;
  work_category_name: string;
  status: string;
  pricing_model: string;
  default_unit_price: number;
  unit_type: string;
}

interface JobSubmissionFormProps {
  jobAssignments: JobAssignment[];
  onJobSubmitted: () => void;
}

export const JobSubmissionForm: React.FC<JobSubmissionFormProps> = ({
  jobAssignments,
  onJobSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [quantityCompleted, setQuantityCompleted] = useState<number>(1);
  const [agreedRate, setAgreedRate] = useState<number>(0);
  const [workDescription, setWorkDescription] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [issuesEncountered, setIssuesEncountered] = useState('');
  const [safetyChecksCompleted, setSafetyChecksCompleted] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const assignment = jobAssignments.find(a => a.id === selectedAssignment);

  useEffect(() => {
    if (assignment) {
      setAgreedRate(assignment.default_unit_price);
    }
  }, [assignment]);

  const calculateHoursWorked = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const calculateTotal = () => {
    if (!assignment) return 0;
    if (assignment.pricing_model === 'day_rate') {
      return agreedRate;
    }
    return quantityCompleted * agreedRate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment || !user?.id) return;

    setSubmitting(true);
    try {
      // Get user's name from users table
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!userData?.name) {
        toast({
          title: "User Profile Error",
          description: "Could not find your user profile. Please contact admin.",
          variant: "destructive",
        });
        return;
      }

      // Check if RAMS is required and signed
      // This would be enhanced with actual RAMS checking logic
      
      const hoursWorked = calculateHoursWorked();
      
      const jobData = {
        project_id: assignment.project_id,
        plot_id: assignment.plot_id,
        job_type_id: assignment.job_type_id,
        assigned_user_id: userData.name,
        work_date: workDate,
        start_time: startTime || null,
        end_time: endTime || null,
        hours_worked: hoursWorked > 0 ? hoursWorked : null,
        quantity_completed: quantityCompleted,
        unit_type: assignment.unit_type,
        agreed_rate: agreedRate,
        rate_type: assignment.pricing_model,
        work_description: workDescription,
        materials_used: materialsUsed ? JSON.parse(`{"materials": "${materialsUsed}"}`) : null,
        issues_encountered: issuesEncountered || null,
        photos: photos.length > 0 ? photos : null,
        safety_checks_completed: safetyChecksCompleted,
        status: 'pending'
      };

      // Mock job submission - replace with actual table when available
      console.log('Mock job submission:', jobData);
      const error = null; // Simulate success

      if (error) {
        if (error.message.includes('Work already completed')) {
          toast({
            title: "Duplicate Work Detected",
            description: error.message,
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        // Reset form
        setSelectedAssignment('');
        setWorkDescription('');
        setMaterialsUsed('');
        setIssuesEncountered('');
        setQuantityCompleted(1);
        setSafetyChecksCompleted(false);
        setPhotos([]);
        
        onJobSubmitted();
      }
    } catch (error) {
      console.error('Error submitting job:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit work. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const availableAssignments = jobAssignments.filter(a => 
    ['available', 'claimed'].includes(a.status)
  );

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Submit Work Completion</h2>
          <p className="text-muted-foreground">
            Record completed work for approval and payment processing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Selection */}
          <div className="space-y-2">
            <Label htmlFor="assignment">Select Job Assignment</Label>
            <Select value={selectedAssignment} onValueChange={setSelectedAssignment} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job to submit work for..." />
              </SelectTrigger>
              <SelectContent>
                {availableAssignments.map(assignment => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    {assignment.project_name} - {assignment.plot_number} - {assignment.job_type_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {assignment && (
            <>
              {/* Job Details Display */}
              <Card className="p-4 bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Work Category</p>
                    <p className="text-sm text-muted-foreground">{assignment.work_category_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pricing Model</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.pricing_model === 'day_rate' ? 'Day Rate' : 
                       `£${assignment.default_unit_price}/${assignment.unit_type}`}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Work Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workDate">Work Date</Label>
                  <Input
                    id="workDate"
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Quantity and Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Quantity Completed {assignment.unit_type && `(${assignment.unit_type}s)`}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.1"
                    value={quantityCompleted}
                    onChange={(e) => setQuantityCompleted(parseFloat(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Agreed Rate (£)</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={agreedRate}
                    onChange={(e) => setAgreedRate(parseFloat(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Calculated Total</Label>
                  <div className="h-10 flex items-center px-3 border rounded-md bg-muted">
                    £{calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Work Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Work Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the work completed in detail..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  required
                  className="min-h-20"
                />
              </div>

              {/* Materials Used */}
              <div className="space-y-2">
                <Label htmlFor="materials">Materials Used</Label>
                <Textarea
                  id="materials"
                  placeholder="List any materials used (optional)..."
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  className="min-h-16"
                />
              </div>

              {/* Issues Encountered */}
              <div className="space-y-2">
                <Label htmlFor="issues">Issues Encountered</Label>
                <Textarea
                  id="issues"
                  placeholder="Describe any issues or challenges (optional)..."
                  value={issuesEncountered}
                  onChange={(e) => setIssuesEncountered(e.target.value)}
                  className="min-h-16"
                />
              </div>

              {/* Safety Checks */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="safety"
                  checked={safetyChecksCompleted}
                  onCheckedChange={(checked) => setSafetyChecksCompleted(!!checked)}
                />
                <Label htmlFor="safety" className="text-sm">
                  I confirm all required safety checks have been completed
                </Label>
              </div>

              {/* Hours Summary */}
              {startTime && endTime && (
                <div className="p-3 bg-info/10 rounded-lg border border-info/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-info" />
                    <span>Total Hours: {calculateHoursWorked().toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting || !workDescription.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {submitting ? 'Submitting...' : 'Submit Work for Approval'}
                </Button>
              </div>
            </>
          )}
        </form>

        {availableAssignments.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Available Jobs</h3>
            <p className="text-muted-foreground">
              All your assigned jobs are either completed or locked. Contact your supervisor for new assignments.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};