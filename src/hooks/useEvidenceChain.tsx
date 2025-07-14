import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EvidenceChainEvent {
  projectId: string;
  operativeId: string;
  plotId?: string;
  documentId: string;
  documentType: 'RAMS' | 'Drawing' | 'Task_Plan' | 'Site_Notice' | 'POD';
  documentVersion: string;
  documentRevision?: string;
  actionType: 'view' | 'sign' | 'download' | 'print' | 'qr_scan' | 'upload' | 'supersede';
  signatureId?: string;
  deviceInfo?: any;
  metadata?: any;
}

export interface QRValidationResult {
  status: 'current' | 'superseded' | 'error' | 'unauthorized';
  document_id?: string;
  version?: string;
  revision?: string;
  title?: string;
  message: string;
}

export interface EvidenceExportRequest {
  exportType: 'project' | 'operative' | 'plot' | 'company' | 'custom';
  scopeData: {
    projectIds?: string[];
    operativeIds?: string[];
    plotIds?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
  exportFormat: 'pdf' | 'csv' | 'zip' | 'json';
  filters?: any;
}

export const useEvidenceChain = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const logEvidenceEvent = useCallback(async (event: EvidenceChainEvent) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('evidence-chain-processor/log-event', {
        body: event
      });

      if (error) throw error;

      console.log('Evidence event logged:', data);
      return data;
    } catch (error: any) {
      console.error('Error logging evidence event:', error);
      toast({
        title: "Evidence Chain Error",
        description: "Failed to log evidence event",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const validateQRCode = useCallback(async (documentId: string, deviceInfo?: any) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('qr-scan-validator', {
        body: {
          documentId,
          deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            ...deviceInfo
          }
        }
      });

      if (error) throw error;

      const result: QRValidationResult = data.validation;
      
      // Show appropriate toast based on result
      if (result.status === 'current') {
        toast({
          title: "✅ Document Current",
          description: result.message,
          className: "bg-green-50 border-green-200",
        });
      } else if (result.status === 'superseded') {
        toast({
          title: "⚠️ Document Superseded",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Document Error",
          description: result.message,
          variant: "destructive",
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error validating QR code:', error);
      toast({
        title: "QR Scan Error",
        description: "Failed to validate document",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const exportEvidenceChain = useCallback(async (exportRequest: EvidenceExportRequest) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('evidence-chain-processor/export-evidence', {
        body: exportRequest
      });

      if (error) throw error;

      toast({
        title: "Export Started",
        description: `Evidence chain export is being processed. You'll receive a download link shortly.`,
      });

      return data;
    } catch (error: any) {
      console.error('Error exporting evidence chain:', error);
      toast({
        title: "Export Error",
        description: "Failed to start evidence export",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const generateQRPoster = useCallback(async (posterData: {
    projectId: string;
    posterType: 'sign-in' | 'welfare' | 'hoarding' | 'office' | 'plot-specific';
    locationName: string;
    documentVersions: string[];
    scope: string;
  }) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('evidence-chain-processor/generate-poster', {
        body: posterData
      });

      if (error) throw error;

      toast({
        title: "QR Poster Generated",
        description: `Poster for ${posterData.locationName} has been created successfully.`,
      });

      return data;
    } catch (error: any) {
      console.error('Error generating QR poster:', error);
      toast({
        title: "Poster Generation Error",
        description: "Failed to generate QR poster",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Helper function to get device info for evidence logging
  const getDeviceInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      online: navigator.onLine
    };
  }, []);

  return {
    isLoading,
    logEvidenceEvent,
    validateQRCode,
    exportEvidenceChain,
    generateQRPoster,
    getDeviceInfo
  };
};