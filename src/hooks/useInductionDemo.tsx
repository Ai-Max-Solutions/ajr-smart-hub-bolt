import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEvidenceChain } from '@/hooks/useEvidenceChain';
import { Json } from '@/integrations/supabase/types';

// Data types matching actual database schema
interface InductionMaterial {
  id: string;
  material_type: string;
  title: string;
  content_url: string | null;
  language: string | null;
  is_active: boolean | null;
  metadata: Json | null;
  project_id: string | null;
  version: number | null;
  created_at: string;
  updated_at: string;
}

interface InductionProgress {
  id: string;
  user_id: string;
  induction_type: string;
  status: string | null;
  current_step: number | null;
  completion_percentage: number | null;
  language_preference: string | null;
  device_info: Json;
  created_at: string | null;
  completed_at: string | null;
  supervisor_id: string | null;
  project_id: string | null;
}

interface DemoCompletion {
  id: string;
  demo_type: string;
  induction_id: string;
  completed_at?: string;
  time_taken_seconds?: number;
  understanding_confirmed?: boolean;
  assistance_needed?: boolean;
  qr_code_scanned?: string;
  scan_result?: Json;
  notes?: string;
}

export const useInductionDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentInduction, setCurrentInduction] = useState<InductionProgress | null>(null);
  const [materials, setMaterials] = useState<InductionMaterial[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStartTime, setStepStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { validateQRCode } = useEvidenceChain();

  // Load induction materials
  const loadMaterials = useCallback(async (language = 'en') => {
    try {
      // Use mock data for demo materials
      const mockMaterials: InductionMaterial[] = [
        {
          id: '1',
          material_type: 'demo_qr',
          title: 'Current QR Demo',
          content_url: null,
          language: language,
          is_active: true,
          metadata: {
            status: 'current',
            revision: 'Rev-04',
            document_type: 'Safety Method Statement'
          },
          project_id: null,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          material_type: 'demo_qr',
          title: 'Superseded QR Demo',
          content_url: null,
          language: language,
          is_active: true,
          metadata: {
            status: 'superseded',
            revision: 'Rev-02',
            document_type: 'Safety Method Statement',
            superseded_by: 'Rev-04'
          },
          project_id: null,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setMaterials(mockMaterials);
    } catch (error) {
      console.error('Error loading induction materials:', error);
      toast({
        title: "Error",
        description: "Failed to load induction materials",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Start new induction
  const startInduction = useCallback(async (
    projectId?: string,
    language = 'en',
    accessibilityNeeds: string[] = [],
    deviceInfo: any = {}
  ) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Create mock induction data
      const mockInduction: InductionProgress = {
        id: `induction_${Date.now()}`,
        user_id: user.id,
        induction_type: 'qr_demo',
        status: 'in_progress',
        current_step: 0,
        completion_percentage: 0,
        language_preference: language,
        device_info: deviceInfo,
        created_at: new Date().toISOString(),
        completed_at: null,
        supervisor_id: null,
        project_id: projectId || null
      };

      setCurrentInduction(mockInduction);
      setCurrentStep(0);
      setStepStartTime(new Date());
      await loadMaterials(language);

      toast({
        title: "Induction Started",
        description: "Welcome to the QR Scan Demo!",
      });

      return mockInduction.id;
    } catch (error) {
      console.error('Error starting induction:', error);
      toast({
        title: "Error",
        description: "Failed to start induction",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, loadMaterials]);

  // Complete a step
  const completeStep = useCallback(async (
    stepName: string,
    interactionData: any = {},
    successScore?: number
  ) => {
    if (!currentInduction || !stepStartTime) return false;

    const timeTaken = Math.round((new Date().getTime() - stepStartTime.getTime()) / 1000);

    try {
      // Update local state (mock implementation)
      setCurrentInduction(prev => prev ? {
        ...prev,
        current_step: (prev.current_step || 0) + 1,
        completion_percentage: Math.min(((prev.current_step || 0) + 1) * 20, 100)
      } : null);

      setCurrentStep(prev => prev + 1);
      setStepStartTime(new Date());

      // Mock analytics logging (console log for demo)
      console.log('Step completed:', {
        step: stepName,
        time_taken: timeTaken,
        success_score: successScore,
        interaction_data: interactionData
      });

      return true;
    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: "Error",
        description: "Failed to record step completion",
        variant: "destructive"
      });
      return false;
    }
  }, [currentInduction, stepStartTime, toast]);

  // Simulate QR scan
  const simulateQRScan = useCallback(async (qrType: 'current' | 'superseded') => {
    const stepStarted = new Date();
    
    try {
      // Find the appropriate demo QR material
      const demoMaterial = materials.find(m => 
        m.material_type === 'demo_qr' && 
        (m.metadata as any)?.status === qrType
      );

      if (!demoMaterial) {
        // Use fallback demo data
        const fallbackData = {
          status: qrType,
          revision: qrType === 'current' ? 'Rev-04' : 'Rev-02',
          document_type: 'Safety Method Statement',
          superseded_by: qrType === 'superseded' ? 'Rev-04' : undefined
        };
        
        const result = {
          status: qrType === 'current' ? 'valid' : 'superseded',
          document_id: `demo_${qrType}_${Date.now()}`,
          revision: fallbackData.revision,
          document_type: fallbackData.document_type,
          message: qrType === 'current' 
            ? `✅ Current Rev: ${fallbackData.revision} — Approved for Use`
            : `❌ Superseded — Do Not Use — Latest: ${fallbackData.superseded_by}`,
          branding: {
            company: 'AJ Ryan SmartWork Hub',
            colors: { primary: '#1d1e3d', accent: '#ffcf21' }
          }
        };

        // Simulate validation delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        await completeStep(`qr_scan_${qrType}`, {
          qr_type: qrType,
          scan_result: result,
          demo: true
        }, qrType === 'current' ? 100 : 90);

        return result;
      }

      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = {
        status: qrType === 'current' ? 'valid' : 'superseded',
        document_id: `demo_${qrType}_${Date.now()}`,
        revision: (demoMaterial.metadata as any)?.revision || 'Rev-04',
        document_type: (demoMaterial.metadata as any)?.document_type || 'Safety Method Statement',
        message: qrType === 'current' 
          ? `✅ Current Rev: ${(demoMaterial.metadata as any)?.revision || 'Rev-04'} — Approved for Use`
          : `❌ Superseded — Do Not Use — Latest: ${(demoMaterial.metadata as any)?.superseded_by || 'Rev-04'}`,
        branding: {
          company: 'AJ Ryan SmartWork Hub',
          colors: { primary: '#1d1e3d', accent: '#ffcf21' }
        }
      };

      await completeStep(`qr_scan_${qrType}`, {
        qr_type: qrType,
        scan_result: result,
        demo: true
      }, qrType === 'current' ? 100 : 90);

      return result;
    } catch (error) {
      console.error('Error simulating QR scan:', error);
      toast({
        title: "Scan Error",
        description: "Failed to simulate QR scan",
        variant: "destructive"
      });
      return null;
    }
  }, [materials, completeStep, toast]);

  // Get user's induction progress
  const getCurrentInduction = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Mock implementation - no existing induction by default
      // In a real app, this would check for existing induction progress
      return null;
    } catch (error) {
      console.error('Error getting current induction:', error);
      return null;
    }
  }, []);

  // Load current induction on mount
  useEffect(() => {
    getCurrentInduction();
  }, [getCurrentInduction]);

  return {
    isLoading,
    currentInduction,
    materials,
    currentStep,
    startInduction,
    completeStep,
    simulateQRScan,
    loadMaterials,
    getCurrentInduction
  };
};

export type { InductionProgress, InductionMaterial, DemoCompletion };