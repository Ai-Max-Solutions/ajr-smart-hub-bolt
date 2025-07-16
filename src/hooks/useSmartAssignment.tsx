
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  user_id: string;
  plot_id: string;
  work_type: string;
  assigned_date: string;
  expected_completion: string;
  status: string;
  notes: string;
}

interface SkillMatch {
  user_id: string;
  user_name: string;
  user_role: string;
  skills: string[];
  match_score: number;
  availability: boolean;
  current_workload: number;
}

export const useSmartAssignment = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Plot_Assignments')
        .select('*')
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const findBestMatches = async (
    workType: string,
    requiredSkills: string[] = [],
    projectId?: string
  ): Promise<SkillMatch[]> => {
    try {
      // Get users with relevant skills
      const { data: users, error } = await supabase
        .from('Users')
        .select('id, fullname, role, skills, currentproject, employmentstatus')
        .eq('employmentstatus', 'Active');

      if (error) throw error;

      const skillMatches: SkillMatch[] = [];

      for (const user of users || []) {
        // Calculate skill match score
        let matchScore = 0;
        const userSkills = user.skills || [];
        
        // Base score for work type match
        if (userSkills.some((skill: string) => 
          skill.toLowerCase().includes(workType.toLowerCase())
        )) {
          matchScore += 40;
        }

        // Score for required skills
        const matchingSkills = requiredSkills.filter(skill =>
          userSkills.some((userSkill: string) => 
            userSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        
        matchScore += (matchingSkills.length / Math.max(requiredSkills.length, 1)) * 40;

        // Role-based scoring
        if (user.role === 'Specialist' || user.role === 'Senior Operative') {
          matchScore += 15;
        } else if (user.role === 'Operative') {
          matchScore += 10;
        } else if (user.role === 'Supervisor') {
          matchScore += 5;
        }

        // Project alignment bonus
        if (projectId && user.currentproject === projectId) {
          matchScore += 10;
        }

        // Get current workload
        const { data: currentAssignments } = await supabase
          .from('Plot_Assignments')
          .select('id')
          .eq('user_id', user.id)
          .in('status', ['assigned', 'in_progress']);

        const currentWorkload = currentAssignments?.length || 0;

        // Availability penalty for overloaded users
        if (currentWorkload > 3) {
          matchScore -= 20;
        } else if (currentWorkload > 5) {
          matchScore -= 40;
        }

        skillMatches.push({
          user_id: user.id,
          user_name: user.fullname || 'Unknown',
          user_role: user.role || 'Unknown',
          skills: userSkills,
          match_score: Math.max(0, Math.min(100, matchScore)),
          availability: currentWorkload <= 3,
          current_workload: currentWorkload
        });
      }

      // Sort by match score and return top matches
      return skillMatches
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 10);

    } catch (error: any) {
      console.error('Error finding best matches:', error);
      toast.error('Failed to find skill matches');
      return [];
    }
  };

  const createAssignment = async (
    userId: string,
    plotId: string,
    workType: string,
    expectedCompletion: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('Plot_Assignments')
        .insert({
          user_id: userId,
          plot_id: plotId,
          work_type: workType,
          assigned_date: new Date().toISOString().split('T')[0],
          expected_completion: expectedCompletion,
          status: 'assigned',
          notes: notes || ''
        });

      if (error) throw error;

      toast.success('Assignment created successfully');
      await fetchAssignments();
      return true;
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
      return false;
    }
  };

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      if (status === 'completed') {
        updateData.actual_completion = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('Plot_Assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Assignment updated successfully');
      await fetchAssignments();
      return true;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment');
      return false;
    }
  };

  const getWorkloadAnalysis = async (userId: string) => {
    try {
      const { data: assignments, error } = await supabase
        .from('Plot_Assignments')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['assigned', 'in_progress']);

      if (error) throw error;

      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      
      const upcomingDeadlines = assignments?.filter(assignment => {
        const deadline = new Date(assignment.expected_completion);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return deadline <= weekFromNow;
      }) || [];

      return {
        totalAssignments: assignments?.length || 0,
        upcomingDeadlines: upcomingDeadlines.length,
        overdue: assignments?.filter(a => 
          new Date(a.expected_completion) < new Date()
        ).length || 0
      };
    } catch (error: any) {
      console.error('Error getting workload analysis:', error);
      return { totalAssignments: 0, upcomingDeadlines: 0, overdue: 0 };
    }
  };

  return {
    assignments,
    loading,
    error,
    findBestMatches,
    createAssignment,
    updateAssignmentStatus,
    getWorkloadAnalysis,
    refresh: fetchAssignments
  };
};
