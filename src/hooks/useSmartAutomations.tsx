import { useEffect, useState } from 'react';
import { useUserProfile } from './useUserProfile';
import { useToast } from './use-toast';

interface AutomationTrigger {
  id: string;
  type: 'compliance_warning' | 'pod_discrepancy' | 'equipment_alert' | 'training_reminder';
  threshold: any;
  action: string;
  webhook_url?: string;
}

interface PredictiveInsight {
  type: 'trend' | 'warning' | 'opportunity';
  message: string;
  confidence: number;
  action_suggested?: string;
}

export const useSmartAutomations = () => {
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [automationTriggers, setAutomationTriggers] = useState<AutomationTrigger[]>([]);

  // Proactive compliance monitoring (mock implementation)
  useEffect(() => {
    if (!profile) return;

    const checkCompliance = async () => {
      try {
        // Mock compliance check - simulate expiring qualifications
        const mockQualifications = [
          {
            expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
            qualification_types: { name: 'Safety Certificate' }
          }
        ];

        if (mockQualifications.length > 0) {
          mockQualifications.forEach(qual => {
            const daysLeft = Math.floor((new Date(qual.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 7) {
              toast({
                title: "🚨 Urgent: Qualification Expiring",
                description: `Your ${qual.qualification_types?.name} expires in ${daysLeft} days`,
                variant: "destructive",
              });
              
              // Mock webhook trigger
              console.log('Triggering webhook for qualification expiry:', {
                user_id: profile.id,
                qualification: qual.qualification_types?.name,
                days_left: daysLeft,
                urgency: 'critical'
              });
            }
          });
        }
      } catch (error) {
        console.error('Compliance check error:', error);
      }
    };

    checkCompliance();
    const interval = setInterval(checkCompliance, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [profile, toast]);

  // Smart POD discrepancy detection (mock implementation)
  const monitorPODDiscrepancies = async () => {
    if (!profile?.currentproject) return;

    try {
      // Mock POD data
      const mockPods = [
        { discrepancy_value: 150, status: 'pending' },
        { discrepancy_value: 300, status: 'pending' }
      ];

      if (mockPods.length > 0) {
        const totalDiscrepancy = mockPods.reduce((sum, pod) => sum + (pod.discrepancy_value || 0), 0);
        
        if (totalDiscrepancy > 400) {
          setInsights(prev => [...prev, {
            type: 'warning',
            message: `High-value POD discrepancies detected: £${totalDiscrepancy}`,
            confidence: 0.95,
            action_suggested: 'Review and approve pending PODs immediately'
          }]);

          // Mock webhook trigger
          console.log('POD discrepancy escalation:', {
            project_id: profile.currentproject,
            total_value: totalDiscrepancy,
            pod_count: mockPods.length,
            urgency: 'high'
          });
        }
      }
    } catch (error) {
      console.error('POD monitoring error:', error);
    }
  };

  // Predictive analytics for training needs (mock implementation)
  const analyzeTrainingNeeds = async () => {
    if (!profile) return;

    try {
      // Mock team data
      const mockTeamData = [
        {
          id: 'user1',
          role: 'Operative',
          skills: ['CSCS'],
          qualifications: [{ qualification_type: 'First Aid', expiry_date: '2024-06-01' }]
        },
        {
          id: 'user2',
          role: 'Supervisor',
          skills: ['Manual Handling'],
          qualifications: []
        }
      ];

      if (mockTeamData) {
        const skillGaps = analyzeSkillGaps(mockTeamData);
        const trainingRecommendations = generateTrainingRecommendations(skillGaps);
        
        setInsights(prev => [...prev, ...trainingRecommendations]);
      }
    } catch (error) {
      console.error('Training analysis error:', error);
    }
  };

  // Enhanced webhook trigger with smart routing (mock implementation)
  const triggerWebhook = async (eventType: string, data: any) => {
    try {
      // Mock webhook - just log to console
      console.log(`Smart automation triggered: ${eventType}`, {
        event_type: eventType,
        timestamp: new Date().toISOString(),
        user_role: profile?.role,
        project_id: profile?.currentproject,
        data,
        ai_confidence: 0.9
      });
    } catch (error) {
      console.error('Webhook trigger error:', error);
    }
  };

  // Generate daily AI briefings (mock implementation)
  const generateDailyBriefing = async () => {
    if (profile?.role !== 'Supervisor' && profile?.role !== 'Project Manager') return;

    const briefingData = await Promise.all([
      getTeamComplianceStatus(),
      getPendingApprovals(),
      getProjectProgress(),
      getEquipmentAlerts()
    ]);

    const briefing = {
      date: new Date().toISOString().split('T')[0],
      user_id: profile.id,
      compliance_summary: briefingData[0],
      pending_items: briefingData[1],
      progress_highlights: briefingData[2],
      alerts: briefingData[3]
    };

    // Mock briefing trigger
    console.log('Daily briefing generated:', briefing);
  };

  return {
    insights,
    monitorPODDiscrepancies,
    analyzeTrainingNeeds,
    generateDailyBriefing,
    triggerWebhook
  };
};

// Helper functions
const analyzeSkillGaps = (teamData: any[]) => {
  // Analyze team skills vs project requirements
  const requiredSkills = ['CSCS', 'First Aid', 'Manual Handling'];
  const gaps: any[] = [];
  
  teamData.forEach(member => {
    const memberSkills = member.skills || [];
    const missingSkills = requiredSkills.filter(skill => 
      !memberSkills.includes(skill) && 
      !member.qualifications?.some((q: any) => q.qualification_type.includes(skill))
    );
    
    if (missingSkills.length > 0) {
      gaps.push({ user_id: member.id, missing: missingSkills });
    }
  });
  
  return gaps;
};

const generateTrainingRecommendations = (skillGaps: any[]): PredictiveInsight[] => {
  return skillGaps.map(gap => ({
    type: 'opportunity' as const,
    message: `Training needed: ${gap.missing.join(', ')}`,
    confidence: 0.85,
    action_suggested: 'Schedule training session'
  }));
};

// Additional helper functions for data collection (mock implementations)
const getTeamComplianceStatus = async () => ({ compliant: 85, total: 100 });
const getPendingApprovals = async () => ({ timesheets: 12, pods: 5, training: 3 });
const getProjectProgress = async () => ({ completion: 67, onTrack: true });
const getEquipmentAlerts = async () => ({ critical: 2, maintenance: 5 });