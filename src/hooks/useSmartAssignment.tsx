import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AssignmentSuggestion {
  user_id: string;
  user_name: string;
  user_role: string;
  confidence_score: number;
  reasoning: string[];
  current_workload: number;
  skills_match: string[];
  availability_score: number;
}

interface UseSmartAssignmentProps {
  projectId?: string;
  workType?: string;
  requiredSkills?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export const useSmartAssignment = ({
  projectId,
  workType,
  requiredSkills = [],
  priority = 'medium'
}: UseSmartAssignmentProps) => {
  const [suggestions, setSuggestions] = useState<AssignmentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAssignmentSuggestions = async () => {
    if (!projectId || !workType) return;
    
    setLoading(true);
    setError(null);

    try {
      // Get all eligible users (Supervisors, Foremen, Operatives)
      const { data: users, error: usersError } = await supabase
        .from('Users')
        .select('whalesync_postgres_id, fullname, role, skills, currentproject')
        .in('role', ['Supervisor', 'Foreman', 'Operative', 'Specialist'])
        .eq('employmentstatus', 'Active');

      if (usersError) throw usersError;

      // Get current workload data
      const { data: workloadData, error: workloadError } = await supabase
        .from('Work_Tracking_History')
        .select('user_id, work_date, hours_worked')
        .gte('work_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (workloadError) throw workloadError;

      // Calculate workload scores
      const workloadMap = new Map();
      workloadData?.forEach(record => {
        const userId = record.user_id;
        const current = workloadMap.get(userId) || 0;
        workloadMap.set(userId, current + (record.hours_worked || 0));
      });

      // Generate smart suggestions
      const assignmentSuggestions: AssignmentSuggestion[] = users?.map(user => {
        const userSkills = user.skills || [];
        const currentWorkload = workloadMap.get(user.whalesync_postgres_id) || 0;
        
        // Skills matching algorithm
        const skillsMatch = requiredSkills.filter(skill => 
          userSkills.some((userSkill: string) => 
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
          )
        );
        
        const skillsMatchScore = requiredSkills.length > 0 
          ? (skillsMatch.length / requiredSkills.length) * 100 
          : 50;

        // Workload scoring (inverse - lower workload = higher score)
        const maxWorkload = 40; // hours per week
        const workloadScore = Math.max(0, (maxWorkload - currentWorkload) / maxWorkload * 100);

        // Project proximity (same project = bonus)
        const projectProximityScore = user.currentproject === projectId ? 20 : 0;

        // Role suitability
        const roleSuitabilityScore = (() => {
          switch (workType.toLowerCase()) {
            case 'electrical':
              return user.role === 'Specialist' ? 30 : user.role === 'Supervisor' ? 20 : 10;
            case 'plumbing':
              return user.role === 'Specialist' ? 30 : user.role === 'Supervisor' ? 20 : 10;
            case 'general':
              return user.role === 'Operative' ? 25 : user.role === 'Foreman' ? 20 : 15;
            default:
              return user.role === 'Supervisor' ? 25 : 15;
          }
        })();

        // Priority adjustment
        const priorityMultiplier = priority === 'high' ? 1.2 : priority === 'low' ? 0.8 : 1.0;

        // Calculate overall confidence score
        const baseScore = (skillsMatchScore * 0.4) + (workloadScore * 0.3) + (roleSuitabilityScore * 0.3);
        const confidence_score = Math.min(100, baseScore * priorityMultiplier + projectProximityScore);

        // Generate reasoning
        const reasoning: string[] = [];
        if (skillsMatch.length > 0) {
          reasoning.push(`Skills match: ${skillsMatch.join(', ')}`);
        }
        if (currentWorkload < 30) {
          reasoning.push(`Low current workload (${currentWorkload}h/week)`);
        }
        if (user.currentproject === projectId) {
          reasoning.push('Already assigned to this project');
        }
        if (user.role === 'Specialist') {
          reasoning.push('Specialist-level expertise');
        }

        return {
          user_id: user.whalesync_postgres_id,
          user_name: user.fullname || 'Unknown',
          user_role: user.role || 'Unknown',
          confidence_score: Math.round(confidence_score),
          reasoning,
          current_workload: currentWorkload,
          skills_match: skillsMatch,
          availability_score: Math.round(workloadScore)
        };
      }).sort((a, b) => b.confidence_score - a.confidence_score) || [];

      setSuggestions(assignmentSuggestions);
    } catch (err: any) {
      setError(err.message || 'Failed to generate assignment suggestions');
    } finally {
      setLoading(false);
    }
  };

  const assignUser = async (userId: string, workPackageId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('work_packages')
        .update({
          assigned_to: userId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          assignment_notes: notes
        })
        .eq('id', workPackageId);

      if (error) throw error;

      // Log the assignment for learning
      await supabase
        .from('activity_metrics')
        .insert({
          user_id: userId,
          action_type: 'smart_assignment',
          table_name: 'work_packages',
          record_id: workPackageId,
          metadata: {
            assignment_method: 'ai_suggested',
            confidence_score: suggestions.find(s => s.user_id === userId)?.confidence_score,
            work_type: workType,
            required_skills: requiredSkills
          }
        });

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to assign user');
      return false;
    }
  };

  useEffect(() => {
    generateAssignmentSuggestions();
  }, [projectId, workType, requiredSkills, priority]);

  return {
    suggestions,
    loading,
    error,
    generateAssignmentSuggestions,
    assignUser
  };
};