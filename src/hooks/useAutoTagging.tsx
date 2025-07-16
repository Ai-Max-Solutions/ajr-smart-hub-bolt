import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AutoTaggingResult {
  suggested_tags: string[];
  confidence_scores: Record<string, number>;
  document_type_suggestion: string;
  content_summary: string;
  technical_terms: string[];
}

const CONSTRUCTION_KEYWORDS = {
  electrical: ['electrical', 'wiring', 'circuit', 'voltage', 'amp', 'socket', 'switch', 'lighting', 'fuse', 'cable'],
  plumbing: ['plumbing', 'pipe', 'water', 'drainage', 'toilet', 'sink', 'boiler', 'heating', 'radiator', 'valve'],
  structural: ['structural', 'beam', 'column', 'foundation', 'concrete', 'steel', 'load', 'support', 'frame'],
  safety: ['safety', 'hazard', 'ppe', 'protection', 'risk', 'accident', 'emergency', 'warning', 'danger'],
  hvac: ['hvac', 'ventilation', 'air', 'conditioning', 'heating', 'cooling', 'duct', 'filter', 'temperature'],
  flooring: ['flooring', 'carpet', 'tile', 'wood', 'laminate', 'concrete', 'screed', 'underlay'],
  roofing: ['roof', 'tile', 'slate', 'felt', 'gutter', 'flashing', 'ridge', 'eaves', 'membrane'],
  windows: ['window', 'glazing', 'frame', 'sill', 'glass', 'double', 'triple', 'opening', 'casement'],
  insulation: ['insulation', 'thermal', 'acoustic', 'cavity', 'loft', 'foam', 'wool', 'board'],
  finishing: ['finish', 'paint', 'plaster', 'render', 'decorate', 'tile', 'wallpaper', 'sealant']
};

const SAFETY_LEVELS = ['low-risk', 'medium-risk', 'high-risk', 'confined-space', 'working-at-height'];
const WORK_PHASES = ['first-fix', 'second-fix', 'final-fix', 'snagging', 'completion', 'handover'];
const LOCATIONS = ['ground-floor', 'first-floor', 'second-floor', 'basement', 'roof', 'external'];

export const useAutoTagging = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeDocument = useCallback(async (
    documentText: string,
    fileName?: string,
    existingTags: string[] = []
  ): Promise<AutoTaggingResult> => {
    setLoading(true);
    setError(null);

    try {
      const text = documentText.toLowerCase();
      const suggested_tags: string[] = [];
      const confidence_scores: Record<string, number> = {};
      const technical_terms: string[] = [];

      // Analyze content for construction-specific keywords
      Object.entries(CONSTRUCTION_KEYWORDS).forEach(([category, keywords]) => {
        const matches = keywords.filter(keyword => text.includes(keyword));
        if (matches.length > 0) {
          suggested_tags.push(category);
          confidence_scores[category] = (matches.length / keywords.length) * 100;
          technical_terms.push(...matches);
        }
      });

      // Check for safety levels
      SAFETY_LEVELS.forEach(level => {
        if (text.includes(level.replace('-', ' '))) {
          suggested_tags.push(level);
          confidence_scores[level] = 80;
        }
      });

      // Check for work phases
      WORK_PHASES.forEach(phase => {
        if (text.includes(phase.replace('-', ' '))) {
          suggested_tags.push(phase);
          confidence_scores[phase] = 75;
        }
      });

      // Check for locations
      LOCATIONS.forEach(location => {
        if (text.includes(location.replace('-', ' '))) {
          suggested_tags.push(location);
          confidence_scores[location] = 70;
        }
      });

      // Extract from filename if provided
      if (fileName) {
        const fileNameLower = fileName.toLowerCase();
        Object.entries(CONSTRUCTION_KEYWORDS).forEach(([category, keywords]) => {
          if (keywords.some(keyword => fileNameLower.includes(keyword))) {
            if (!suggested_tags.includes(category)) {
              suggested_tags.push(category);
              confidence_scores[category] = 60;
            }
          }
        });
      }

      // Suggest document type based on content
      let document_type_suggestion = 'Other';
      if (text.includes('rams') || text.includes('risk assessment')) {
        document_type_suggestion = 'RAMS';
      } else if (text.includes('task plan') || text.includes('method statement')) {
        document_type_suggestion = 'Task Plan';
      } else if (text.includes('drawing') || text.includes('plan') || text.includes('elevation')) {
        document_type_suggestion = 'Drawing';
      } else if (text.includes('certificate') || text.includes('qualification')) {
        document_type_suggestion = 'Certificate';
      }

      // Generate content summary (first meaningful sentences)
      const sentences = documentText.split('.').filter(s => s.trim().length > 20);
      const content_summary = sentences.slice(0, 2).join('. ').substring(0, 200) + '...';

      // Remove duplicates and sort by confidence
      const uniqueTags = [...new Set(suggested_tags)]
        .sort((a, b) => (confidence_scores[b] || 0) - (confidence_scores[a] || 0))
        .slice(0, 10); // Limit to top 10 suggestions

      return {
        suggested_tags: uniqueTags,
        confidence_scores,
        document_type_suggestion,
        content_summary,
        technical_terms: [...new Set(technical_terms)].slice(0, 15)
      };
    } catch (err: any) {
      setError(err.message || 'Failed to analyze document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const extractTextFromFile = useCallback(async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      // For now, return filename-based analysis
      // In production, you'd use PDF.js or similar to extract text
      return `PDF document: ${file.name}. Unable to extract text content in demo mode.`;
    } else if (file.type.startsWith('text/')) {
      return await file.text();
    } else if (file.type.includes('word')) {
      // For Word documents, you'd use a library like mammoth.js
      return `Word document: ${file.name}. Unable to extract text content in demo mode.`;
    } else {
      return `File: ${file.name}`;
    }
  }, []);

  const processDocumentFile = useCallback(async (file: File, existingTags: string[] = []) => {
    try {
      const documentText = await extractTextFromFile(file);
      return await analyzeDocument(documentText, file.name, existingTags);
    } catch (err: any) {
      setError(err.message || 'Failed to process document file');
      throw err;
    }
  }, [analyzeDocument, extractTextFromFile]);

  const learnFromUserCorrections = useCallback(async (
    documentId: string,
    suggestedTags: string[],
    finalTags: string[],
    documentType: string
  ) => {
    try {
      // Mock activity logging since activity_metrics table doesn't exist
      console.log('Would log tag correction:', {
        documentId,
        suggestedTags,
        finalTags,
        documentType
      });
    } catch (err) {
      console.warn('Failed to log tag correction:', err);
    }
  }, []);

  return {
    analyzeDocument,
    extractTextFromFile,
    processDocumentFile,
    learnFromUserCorrections,
    loading,
    error
  };
};