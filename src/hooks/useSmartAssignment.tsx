import { useState, useEffect } from 'react';
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
  confidence_score: number;
  skills_match: string[];
  availability_score: number;
  reasoning: string[];
}

interface UseSmartAssignmentProps {
  projectId: string;
  workType: string;
  requiredSkills: string[];
  priority: 'low' | 'medium' | 'high';
}

export const useSmartAssignment = (props?: UseSmartAssignmentProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [suggestions, setSuggestions] = useState<SkillMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data
  const mockAssignments: Assignment[] = [
    {
      id: 'assign1',
      user_id: 'user1',
      plot_id: 'plot1',
      work_type: 'Excavation',
      assigned_date: '2024-01-15',
      expected_completion: '2024-01-22',
      status: 'in_progress',
      notes: 'Phase 1 excavation work'
    },
    {
      id: 'assign2',
      user_id: 'user2',
      plot_id: 'plot2',
      work_type: 'Foundation',
      assigned_date: '2024-01-16',
      expected_completion: '2024-01-30',
      status: 'assigned',
      notes: 'Foundation laying for main building'
    }
  ];

  const mockUsers = [
    {
      id: 'user1',
      fullname: 'John Smith',
      role: 'Operative',
      skills: ['Excavation', 'Heavy Machinery', 'Safety'],
      currentproject: 'proj1',
      employmentstatus: 'Active'
    },
    {
      id: 'user2',
      fullname: 'Jane Doe',
      role: 'Supervisor',
      skills: ['Foundation', 'Project Management', 'Quality Control'],
      currentproject: 'proj1',
      employmentstatus: 'Active'
    },
    {
      id: 'user3',
      fullname: 'Mike Johnson',
      role: 'Specialist',
      skills: ['Electrical', 'Wiring', 'Safety', 'Testing'],
      currentproject: 'proj2',
      employmentstatus: 'Active'
    }
  ];

  useEffect(() => {
    fetchAssignments();
    if (props) {
      findBestMatches(props.workType, props.requiredSkills, props.projectId);
    }
  }, [props]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setAssignments(mockAssignments);
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
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const users = mockUsers.filter(user => user.employmentstatus === 'Active');
      const skillMatches: SkillMatch[] = [];

      for (const user of users) {
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

        // Get current workload (mock)
        const currentAssignments = mockAssignments.filter(assignment => 
          assignment.user_id === user.id && 
          ['assigned', 'in_progress'].includes(assignment.status)
        );
        const currentWorkload = currentAssignments.length;

        // Availability penalty for overloaded users
        if (currentWorkload > 3) {
          matchScore -= 20;
        } else if (currentWorkload > 5) {
          matchScore -= 40;
        }

        const finalScore = Math.max(0, Math.min(100, matchScore));

        skillMatches.push({
          user_id: user.id,
          user_name: user.fullname || 'Unknown',
          user_role: user.role || 'Unknown',
          skills: userSkills,
          match_score: finalScore,
          availability: currentWorkload <= 3,
          current_workload: currentWorkload,
          confidence_score: finalScore,
          skills_match: matchingSkills,
          availability_score: currentWorkload <= 3 ? 100 : currentWorkload <= 5 ? 60 : 20,
          reasoning: [
            `${matchingSkills.length} matching skills`,
            `Current workload: ${currentWorkload} assignments`,
            user.role === 'Specialist' ? 'Senior role bonus' : 'Standard role'
          ]
        });
      }

      // Sort by match score and return top matches
      const sortedMatches = skillMatches
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 10);

      setSuggestions(sortedMatches);
      return sortedMatches;

    } catch (error: any) {
      console.error('Error finding best matches:', error);
      toast.error('Failed to find skill matches');
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const assignUser = async (userId: string, workPackageId: string, notes?: string): Promise<boolean> => {
    try {
      const newAssignment: Assignment = {
        id: `assign_${Date.now()}`,
        user_id: userId,
        plot_id: workPackageId,
        work_type: props?.workType || 'General',
        assigned_date: new Date().toISOString().split('T')[0],
        expected_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'assigned',
        notes: notes || ''
      };

      setAssignments(prev => [newAssignment, ...prev]);
      toast.success('Assignment created successfully');
      return true;
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
      setError(error.message);
      return false;
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
      const newAssignment: Assignment = {
        id: `assign_${Date.now()}`,
        user_id: userId,
        plot_id: plotId,
        work_type: workType,
        assigned_date: new Date().toISOString().split('T')[0],
        expected_completion: expectedCompletion,
        status: 'assigned',
        notes: notes || ''
      };

      setAssignments(prev => [newAssignment, ...prev]);
      toast.success('Assignment created successfully');
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
      setAssignments(prev => prev.map(assignment => {
        if (assignment.id === assignmentId) {
          const updateData: any = { ...assignment, status };
          if (notes) updateData.notes = notes;
          return updateData;
        }
        return assignment;
      }));

      toast.success('Assignment updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment');
      return false;
    }
  };

  const getWorkloadAnalysis = async (userId: string) => {
    try {
      const assignments = mockAssignments.filter(assignment => 
        assignment.user_id === userId && 
        ['assigned', 'in_progress'].includes(assignment.status)
      );

      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      
      const upcomingDeadlines = assignments.filter(assignment => {
        const deadline = new Date(assignment.expected_completion);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return deadline <= weekFromNow;
      });

      return {
        totalAssignments: assignments.length,
        upcomingDeadlines: upcomingDeadlines.length,
        overdue: assignments.filter(a => 
          new Date(a.expected_completion) < new Date()
        ).length
      };
    } catch (error: any) {
      console.error('Error getting workload analysis:', error);
      return { totalAssignments: 0, upcomingDeadlines: 0, overdue: 0 };
    }
  };

  return {
    assignments,
    suggestions,
    loading,
    error,
    findBestMatches,
    assignUser,
    createAssignment,
    updateAssignmentStatus,
    getWorkloadAnalysis,
    refresh: fetchAssignments
  };
};