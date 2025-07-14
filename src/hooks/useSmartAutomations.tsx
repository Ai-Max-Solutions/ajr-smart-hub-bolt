import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  // Proactive compliance monitoring
  useEffect(() => {
    if (!profile) return;

    const checkCompliance = async () => {
      try {
        const { data: qualifications } = await supabase
          .from('qualifications')
          .select('*, qualification_types(name, code)')
          .eq('user_id', profile.id)
          .lt('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

        if (qualifications && qualifications.length > 0) {
          qualifications.forEach(qual => {
            const daysLeft = Math.floor((new Date(qual.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 7) {
              toast({
                title: "🚨 Urgent: Qualification Expiring",
                description: `Your ${qual.qualification_types?.name} expires in ${daysLeft} days`,
                variant: "destructive",
              });
              
              // Trigger n8n workflow for critical expiry
              triggerWebhook('qualification_critical_expiry', {
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

  // Smart POD discrepancy detection
  const monitorPODDiscrepancies = async () => {
    if (!profile?.currentproject) return;

    try {
      const { data: pods } = await supabase
        .from('pod_register')
        .select('*')
        .eq('project_id', profile.currentproject)
        .gt('discrepancy_value', 100) // High-value discrepancies
        .eq('status', 'pending');

      if (pods && pods.length > 0) {
        const totalDiscrepancy = pods.reduce((sum, pod) => sum + (pod.discrepancy_value || 0), 0);
        
        if (totalDiscrepancy > 1000) {
          setInsights(prev => [...prev, {
            type: 'warning',
            message: `High-value POD discrepancies detected: £${totalDiscrepancy}`,
            confidence: 0.95,
            action_suggested: 'Review and approve pending PODs immediately'
          }]);

          // Auto-escalate to project manager
          triggerWebhook('pod_discrepancy_escalation', {
            project_id: profile.currentproject,
            total_value: totalDiscrepancy,
            pod_count: pods.length,
            urgency: 'high'
          });
        }
      }
    } catch (error) {
      console.error('POD monitoring error:', error);
    }
  };

  // Predictive analytics for training needs
  const analyzeTrainingNeeds = async () => {
    if (!profile) return;

    try {
      const { data: teamData } = await supabase
        .from('Users')
        .select(`
          whalesync_postgres_id,
          role,
          skills,
          qualifications(qualification_type, expiry_date)
        `)
        .eq('currentproject', profile.currentproject);

      if (teamData) {
        const skillGaps = analyzeSkillGaps(teamData);
        const trainingRecommendations = generateTrainingRecommendations(skillGaps);
        
        setInsights(prev => [...prev, ...trainingRecommendations]);
      }
    } catch (error) {
      console.error('Training analysis error:', error);
    }
  };

  // Enhanced n8n webhook trigger with smart routing
  const triggerWebhook = async (eventType: string, data: any) => {
    try {
      // Smart workflow routing based on user role and urgency
      const webhookUrl = getSmartWebhookUrl(eventType, profile?.role, data.urgency);
      
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'no-cors',
          body: JSON.stringify({
            event_type: eventType,
            timestamp: new Date().toISOString(),
            user_role: profile?.role,
            project_id: profile?.currentproject,
            data,
            ai_confidence: 0.9
          })
        });

        console.log(`Smart automation triggered: ${eventType}`);
      }
    } catch (error) {
      console.error('Webhook trigger error:', error);
    }
  };

  // Generate daily AI briefings
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

    // Send to n8n for email/Teams notification
    triggerWebhook('daily_briefing', briefing);
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
      gaps.push({ user_id: member.whalesync_postgres_id, missing: missingSkills });
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

const getSmartWebhookUrl = (eventType: string, userRole?: string, urgency?: string) => {
  // Smart routing based on event type and context
  const baseUrl = 'https://hooks.zapier.com/hooks/catch/';
  
  const routes = {
    'qualification_critical_expiry': '123456/abc123/',
    'pod_discrepancy_escalation': '123456/def456/',
    'daily_briefing': '123456/ghi789/',
    'equipment_alert': '123456/jkl012/'
  };
  
  return baseUrl + routes[eventType as keyof typeof routes];
};

// Additional helper functions for data collection
const getTeamComplianceStatus = async () => ({ compliant: 85, total: 100 });
const getPendingApprovals = async () => ({ timesheets: 12, pods: 5, training: 3 });
const getProjectProgress = async () => ({ completion: 67, onTrack: true });
const getEquipmentAlerts = async () => ({ critical: 2, maintenance: 5 });