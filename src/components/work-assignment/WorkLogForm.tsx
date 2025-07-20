import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Save, Camera } from 'lucide-react';
import { sanitizeWorkLogData } from '@/utils/inputSanitization';
import { toast } from 'sonner';
import CelebrationSystem from '../gamification/CelebrationSystem';

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

interface WorkLogFormProps {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    hours: number;
    notes: string;
    voiceTranscript?: string;
    photos?: string[];
  }) => void;
}

export const WorkLogForm: React.FC<WorkLogFormProps> = ({
  assignment,
  open,
  onOpenChange,
  onSubmit
}) => {
  const [hours, setHours] = useState(assignment.estimated_hours);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate and sanitize input data
      const validation = sanitizeWorkLogData({
        plot_id: assignment.plot_id,
        work_category_id: assignment.work_category_id,
        hours,
        notes,
        status: 'completed'
      });

      if (!validation.isValid) {
        validation.errors?.forEach(error => toast.error(error));
        return;
      }

      await onSubmit({
        hours: validation.sanitizedData!.hours,
        notes: validation.sanitizedData!.notes || `Completed ${assignment.work_category.main_category} - ${assignment.work_category.sub_task}`,
        photos: []
      });
      
      // Show celebration if bonus earned
      if (isUnderTime) {
        setShowCelebration(true);
      }
      
      // Reset form
      setNotes('');
      setHours(assignment.estimated_hours);
    } catch (error) {
      console.error('Work log submission error:', error);
      toast.error('Failed to submit work log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isUnderTime = hours < assignment.estimated_hours;
  const timeDifference = assignment.estimated_hours - hours;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Work Completion</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assignment Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{assignment.plot.composite_code}</Badge>
              <span className="text-sm text-muted-foreground">{assignment.plot.name}</span>
            </div>
            <h3 className="font-medium">{assignment.work_category.main_category}</h3>
            <p className="text-sm text-muted-foreground">{assignment.work_category.sub_task}</p>
          </div>

          {/* Hours Input */}
          <div className="space-y-2">
            <Label htmlFor="hours">Hours Worked</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="hours"
                type="number"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                min="0.25"
                step="0.25"
                className="pl-10"
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Estimated: {assignment.estimated_hours}h
              </span>
              {isUnderTime && (
                <span className="text-green-600 font-medium">
                  🎉 {timeDifference.toFixed(1)}h under estimate!
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the work completed..."
              rows={3}
            />
          </div>

          {/* Bonus Indicator */}
          {isUnderTime && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-600">🏆</span>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Bonus Eligible!
                  </p>
                  <p className="text-xs text-green-600">
                    Completed {timeDifference.toFixed(1)} hours under estimate
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || hours <= 0}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Logging Work...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Complete Work ({hours}h)
              </>
            )}
          </Button>
        </form>
      </DialogContent>
      
      <CelebrationSystem
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        type="bonus"
        message={`${timeDifference.toFixed(1)}h under estimate—early finish for family time!`}
        points={Math.round(timeDifference * 10)}
      />
    </Dialog>
  );
};