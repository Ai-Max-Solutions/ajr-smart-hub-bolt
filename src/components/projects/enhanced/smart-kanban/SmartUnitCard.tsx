import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MiniKanban } from './MiniKanban';
import { ConfettiTrigger } from './ConfettiTrigger';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Plot {
  id: string;
  name: string;
  code: string;
  unit_type: string;
  status: string;
  handed_over: boolean;
}

interface SmartUnitCardProps {
  plot: Plot;
  projectId: string;
}

export const SmartUnitCard: React.FC<SmartUnitCardProps> = ({ plot, projectId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Fetch completion percentage
  const { data: completion } = useQuery({
    queryKey: ['plot-completion', plot.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_plot_completion', {
        p_plot_id: plot.id
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    if (completion !== undefined) {
      setCompletionPercentage(completion * 100);
    }
  }, [completion]);

  const isCompleted = completionPercentage >= 100;

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${isCompleted ? 'border-green-500 bg-green-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              Unit {plot.code} – {plot.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={plot.handed_over ? 'default' : 'secondary'}>
                {plot.handed_over ? 'Handed Over' : plot.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {plot.unit_type}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Completion</div>
              <div className="font-semibold text-lg">
                {Math.round(completionPercentage)}%
              </div>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        <Progress 
          value={completionPercentage} 
          className={`h-2 transition-all duration-500 ${isCompleted ? 'bg-green-100' : ''}`}
        />
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <MiniKanban plotId={plot.id} />
        </CardContent>
      )}

      {isCompleted && <ConfettiTrigger />}
    </Card>
  );
};