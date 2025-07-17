import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Shield, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ChecklistItem {
  id: string;
  description: string;
  category: 'ppe' | 'environment' | 'equipment' | 'planning';
  completed: boolean;
  required: boolean;
}

interface DailySafetyChecklistProps {
  onComplete?: (checklist: ChecklistItem[]) => void;
}

export const DailySafetyChecklist: React.FC<DailySafetyChecklistProps> = ({ onComplete }) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: '1',
      description: 'Hard hat worn and in good condition',
      category: 'ppe',
      completed: false,
      required: true
    },
    {
      id: '2', 
      description: 'Safety boots worn and appropriate for conditions',
      category: 'ppe',
      completed: false,
      required: true
    },
    {
      id: '3',
      description: 'High-visibility clothing worn',
      category: 'ppe',
      completed: false,
      required: true
    },
    {
      id: '4',
      description: 'Eye protection available and used when required',
      category: 'ppe',
      completed: false,
      required: true
    },
    {
      id: '5',
      description: 'Weather conditions assessed',
      category: 'environment',
      completed: false,
      required: true
    },
    {
      id: '6',
      description: 'Work area inspected for hazards',
      category: 'environment',
      completed: false,
      required: true
    },
    {
      id: '7',
      description: 'Emergency evacuation routes identified',
      category: 'environment',
      completed: false,
      required: true
    },
    {
      id: '8',
      description: 'Tools inspected before use',
      category: 'equipment',
      completed: false,
      required: true
    },
    {
      id: '9',
      description: 'Machinery safety checks completed',
      category: 'equipment',
      completed: false,
      required: false
    },
    {
      id: '10',
      description: 'Work method statement reviewed',
      category: 'planning',
      completed: false,
      required: true
    },
    {
      id: '11',
      description: 'Risk assessment understood',
      category: 'planning',
      completed: false,
      required: true
    },
    {
      id: '12',
      description: 'Communication systems tested',
      category: 'planning',
      completed: false,
      required: false
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const categoryLabels = {
    ppe: 'Personal Protective Equipment',
    environment: 'Environmental Checks',
    equipment: 'Equipment & Tools',
    planning: 'Planning & Documentation'
  };

  const categoryIcons = {
    ppe: Shield,
    environment: AlertTriangle,
    equipment: CheckCircle,
    planning: Clock
  };

  const toggleItem = (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const getCompletionStats = () => {
    const required = checklist.filter(item => item.required);
    const requiredCompleted = required.filter(item => item.completed);
    const optional = checklist.filter(item => !item.required);
    const optionalCompleted = optional.filter(item => item.completed);
    
    return {
      requiredTotal: required.length,
      requiredCompleted: requiredCompleted.length,
      optionalTotal: optional.length,
      optionalCompleted: optionalCompleted.length,
      allRequiredCompleted: requiredCompleted.length === required.length
    };
  };

  const handleSubmit = async () => {
    const stats = getCompletionStats();
    
    if (!stats.allRequiredCompleted) {
      toast.error('Please complete all required safety checks before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // In a real app, this would save to the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsCompleted(true);
      onComplete?.(checklist);
      toast.success('Daily safety checklist completed successfully');
    } catch (error) {
      toast.error('Failed to submit checklist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = getCompletionStats();
  const groupedChecklist = checklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  if (isCompleted) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <CardTitle className="text-success">Safety Checklist Complete</CardTitle>
              <CardDescription>
                Completed today at {format(new Date(), 'h:mm a')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            All required safety checks have been completed. You're good to start work safely.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Daily Safety Checklist
            </CardTitle>
            <CardDescription>
              Complete your daily safety checks before starting work
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {stats.requiredCompleted}/{stats.requiredTotal} Required
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.optionalCompleted}/{stats.optionalTotal} Optional
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedChecklist).map(([category, items]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          const categoryCompleted = items.filter(item => item.completed).length;
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {categoryCompleted}/{items.length}
                </Badge>
              </div>
              
              <div className="space-y-2 ml-6">
                {items.map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label 
                        className={`text-sm cursor-pointer ${
                          item.completed 
                            ? 'line-through text-muted-foreground' 
                            : 'text-foreground'
                        }`}
                        onClick={() => toggleItem(item.id)}
                      >
                        {item.description}
                      </label>
                      {item.required && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <Button 
            onClick={handleSubmit}
            disabled={!stats.allRequiredCompleted || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Complete Safety Checklist
              </>
            )}
          </Button>
          
          {!stats.allRequiredCompleted && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Complete all required items to submit the checklist
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};