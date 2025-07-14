import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Brain, Users, Clock, Star, CheckCircle } from "lucide-react";
import { useSmartAssignment } from "@/hooks/useSmartAssignment";
import { toast } from "sonner";

interface SmartAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workPackageId: string;
  projectId: string;
  workType: string;
  requiredSkills: string[];
  priority: 'low' | 'medium' | 'high';
  onAssignmentComplete: () => void;
}

export const SmartAssignmentDialog = ({
  open,
  onOpenChange,
  workPackageId,
  projectId,
  workType,
  requiredSkills,
  priority,
  onAssignmentComplete
}: SmartAssignmentDialogProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const { suggestions, loading, error, assignUser } = useSmartAssignment({
    projectId,
    workType,
    requiredSkills,
    priority
  });

  const handleAssign = async () => {
    if (!selectedUserId) return;

    setIsAssigning(true);
    try {
      const success = await assignUser(selectedUserId, workPackageId, assignmentNotes);
      if (success) {
        toast.success("Work package assigned successfully!");
        onAssignmentComplete();
        onOpenChange(false);
        setSelectedUserId(null);
        setAssignmentNotes("");
      }
    } catch (error) {
      toast.error("Failed to assign work package");
    } finally {
      setIsAssigning(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  const getConfidenceBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Smart Assignment Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Context Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Work Type</div>
                  <div className="font-semibold">{workType}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Priority</div>
                  <Badge variant={priority === 'high' ? 'destructive' : priority === 'medium' ? 'secondary' : 'outline'}>
                    {priority}
                  </Badge>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Required Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {requiredSkills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Suggestions</div>
                  <div className="font-semibold">{suggestions.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 animate-pulse text-primary" />
                <span>Analyzing best assignments...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <div className="text-destructive font-medium">Error generating suggestions</div>
                <div className="text-sm text-muted-foreground">{error}</div>
              </CardContent>
            </Card>
          )}

          {/* Assignment Suggestions */}
          {!loading && !error && suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Select the best candidate based on AI analysis:</span>
              </div>

              <div className="grid gap-3">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <Card 
                    key={suggestion.user_id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedUserId === suggestion.user_id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    } ${index === 0 ? 'border-2 border-success/50 bg-success/5' : ''}`}
                    onClick={() => setSelectedUserId(suggestion.user_id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="font-semibold">{suggestion.user_name}</div>
                            <Badge variant="outline">{suggestion.user_role}</Badge>
                            {index === 0 && (
                              <Badge variant="default" className="bg-success text-success-foreground">
                                <Star className="h-3 w-3 mr-1" />
                                Top Pick
                              </Badge>
                            )}
                            {selectedUserId === suggestion.user_id && (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Confidence</div>
                              <div className={`font-bold text-lg ${getConfidenceColor(suggestion.confidence_score)}`}>
                                {suggestion.confidence_score}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Workload</div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{suggestion.current_workload}h/week</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Skills Match</div>
                              <div className="flex flex-wrap gap-1">
                                {suggestion.skills_match.slice(0, 2).map((skill, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {suggestion.skills_match.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{suggestion.skills_match.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Availability</div>
                              <Badge variant={getConfidenceBadgeVariant(suggestion.availability_score)}>
                                {suggestion.availability_score}%
                              </Badge>
                            </div>
                          </div>

                          {suggestion.reasoning.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs text-muted-foreground mb-1">AI Reasoning:</div>
                              <div className="text-sm">
                                {suggestion.reasoning.join(' • ')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Assignment Notes */}
          {selectedUserId && (
            <div className="space-y-2">
              <Label htmlFor="assignment-notes">Assignment Notes (Optional)</Label>
              <Textarea
                id="assignment-notes"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add any specific instructions or notes for this assignment..."
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || isAssigning}
              className="flex-1"
            >
              {isAssigning ? "Assigning..." : "Assign Selected User"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
          </div>

          {/* No Suggestions */}
          {!loading && !error && suggestions.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="font-medium mb-2">No suitable candidates found</div>
                <div className="text-sm text-muted-foreground">
                  Try adjusting the required skills or consider manual assignment
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};