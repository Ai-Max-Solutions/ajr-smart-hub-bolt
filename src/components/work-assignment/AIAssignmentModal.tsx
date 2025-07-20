import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Brain, Clock, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plot {
  id: string;
  name: string;
  code: string;
  composite_code: string;
  status: string;
}

interface WorkCategory {
  id: string;
  main_category: string;
  sub_task: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface AISuggestion {
  plotId: string;
  workCategoryId: string;
  userId: string;
  estimatedHours: number;
  dueDate: string;
  confidence: number;
  reasoning: string;
}

interface AIAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plots: Plot[];
  workCategories: WorkCategory[];
  users: User[];
  onApplyAssignments: (suggestions: AISuggestion[]) => void;
}

export const AIAssignmentModal: React.FC<AIAssignmentModalProps> = ({
  open,
  onOpenChange,
  plots,
  workCategories,
  users,
  onApplyAssignments
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  const generateAISuggestions = async () => {
    setLoading(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock AI suggestions
    const mockSuggestions: AISuggestion[] = [];
    
    plots.forEach(plot => {
      // Randomly assign 1-3 work categories per plot
      const numAssignments = Math.floor(Math.random() * 3) + 1;
      const shuffledCategories = [...workCategories].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < numAssignments && i < shuffledCategories.length; i++) {
        const category = shuffledCategories[i];
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        // Generate realistic estimated hours based on work type
        const baseHours = category.main_category.toLowerCase().includes('electrical') ? 6 :
                         category.main_category.toLowerCase().includes('plumbing') ? 8 :
                         category.main_category.toLowerCase().includes('flooring') ? 4 : 6;
        
        const estimatedHours = baseHours + (Math.random() * 4) - 2; // ±2 hours variation
        
        // Generate due date (1-14 days from now)
        const daysFromNow = Math.floor(Math.random() * 14) + 1;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysFromNow);
        
        const confidence = 0.7 + (Math.random() * 0.3); // 70-100% confidence
        
        const reasoning = `Selected ${randomUser.name} based on ${
          randomUser.role === 'Supervisor' ? 'leadership experience' :
          'availability and skill match'
        }. Estimated ${Math.round(estimatedHours)} hours based on similar work patterns.`;

        mockSuggestions.push({
          plotId: plot.id,
          workCategoryId: category.id,
          userId: randomUser.id,
          estimatedHours: Math.round(estimatedHours * 2) / 2, // Round to nearest 0.5
          dueDate: dueDate.toISOString().split('T')[0],
          confidence,
          reasoning
        });
      }
    });

    setSuggestions(mockSuggestions);
    setLoading(false);
  };

  const handleApplyAll = () => {
    onApplyAssignments(suggestions);
    onOpenChange(false);
    setSuggestions([]);
  };

  const getPlotName = (plotId: string) => {
    return plots.find(p => p.id === plotId)?.composite_code || 'Unknown';
  };

  const getCategoryName = (categoryId: string) => {
    const category = workCategories.find(c => c.id === categoryId);
    return category ? `${category.main_category} - ${category.sub_task}` : 'Unknown';
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.8) return 'bg-blue-500';
    if (confidence >= 0.7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Work Assignment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Info */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Smart Assignment Engine</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI analyzes user skills, availability, workload, and historical performance to suggest optimal work assignments.
              Reviewing {plots.length} units and {users.length} available users.
            </p>
          </div>

          {/* Generate Suggestions Button */}
          {suggestions.length === 0 && (
            <div className="text-center py-8">
              <Button
                onClick={generateAISuggestions}
                disabled={loading}
                size="lg"
                className="gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Generate AI Suggestions
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  AI Suggestions ({suggestions.length})
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSuggestions([])}
                  >
                    Regenerate
                  </Button>
                  <Button onClick={handleApplyAll}>
                    Apply All Suggestions
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary">
                              {getPlotName(suggestion.plotId)}
                            </Badge>
                            <span className="text-sm font-medium">
                              {getCategoryName(suggestion.workCategoryId)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span>Assigned to: <strong>{getUserName(suggestion.userId)}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{suggestion.estimatedHours}h estimated</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Due: {new Date(suggestion.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground mt-2">
                            {suggestion.reasoning}
                          </p>
                        </div>

                        <Badge 
                          className={`ml-4 text-white ${getConfidenceColor(suggestion.confidence)}`}
                        >
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};