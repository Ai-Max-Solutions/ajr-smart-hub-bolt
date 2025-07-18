
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface CSCSCardType {
  value: string;
  label: string;
  color: string;
  description: string;
}

interface CSCSCardTypeMapperProps {
  selectedType: string;
  onTypeChange: (value: string) => void;
  aiDetectedType?: string;
  aiConfidence?: number;
  required?: boolean;
}

export const CSCSCardTypeMapper: React.FC<CSCSCardTypeMapperProps> = ({
  selectedType,
  onTypeChange,
  aiDetectedType,
  aiConfidence = 0,
  required = false
}) => {
  // Enhanced CSCS card type mapping with colors and descriptions
  const cardTypes: CSCSCardType[] = [
    { value: 'Labourer', label: 'Labourer', color: '#00A650', description: 'Green Card - Basic construction work' },
    { value: 'MATE', label: 'MATE (Mechanical)', color: '#00A650', description: 'Green Card - Mechanical, Heating, Plumbing' },
    { value: 'Plant Operator', label: 'Plant Operator', color: '#00A650', description: 'Green Card - Construction plant machinery' },
    { value: 'Skilled Worker', label: 'Skilled Worker', color: '#0072CE', description: 'Blue Card - Qualified tradesperson' },
    { value: 'Experienced Worker', label: 'Experienced Worker', color: '#0072CE', description: 'Blue Card - Experienced in trade' },
    { value: 'Apprentice', label: 'Apprentice', color: '#D71920', description: 'Red Card - Learning a trade' },
    { value: 'Trainee', label: 'Trainee', color: '#D71920', description: 'Red Card - In training' },
    { value: 'Advanced Craft', label: 'Advanced Craft', color: '#FFD700', description: 'Gold Card - Advanced skilled role' },
    { value: 'Supervisor', label: 'Supervisor', color: '#FFD700', description: 'Gold Card - Supervisory position' },
    { value: 'Academically Qualified', label: 'Academically Qualified', color: '#FFFFFF', description: 'White Card - Degree qualified' },
    { value: 'Professionally Qualified', label: 'Professionally Qualified', color: '#FFFFFF', description: 'White Card - Professional qualification' },
    { value: 'Manager', label: 'Manager', color: '#000000', description: 'Black Card - Management role' },
    { value: 'Senior Manager', label: 'Senior Manager', color: '#000000', description: 'Black Card - Senior management' },
    { value: 'Visitor', label: 'Visitor', color: '#FFFF00', description: 'Yellow Card - Temporary site access' }
  ];

  // Map AI detected colors to card types
  const mapAIColorToTypes = (aiColor: string): CSCSCardType[] => {
    const colorMap: Record<string, string[]> = {
      'Green': ['Labourer', 'MATE', 'Plant Operator'],
      'Blue': ['Skilled Worker', 'Experienced Worker'],
      'Red': ['Apprentice', 'Trainee'],
      'Gold': ['Advanced Craft', 'Supervisor'],
      'White': ['Academically Qualified', 'Professionally Qualified'],
      'Black': ['Manager', 'Senior Manager'],
      'Yellow': ['Visitor']
    };
    
    const matchingTypes = colorMap[aiColor] || [];
    return cardTypes.filter(type => matchingTypes.includes(type.value));
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (confidence >= 0.5) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High confidence';
    if (confidence >= 0.5) return 'Medium confidence';
    return 'Low confidence';
  };

  const suggestedTypes = aiDetectedType ? mapAIColorToTypes(aiDetectedType) : [];

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium text-primary">
          Select Card Type {required && <span className="text-destructive">*</span>}
        </label>
        
        {aiDetectedType && aiConfidence > 0 && (
          <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md">
            {getConfidenceIcon(aiConfidence)}
            <span className="text-sm text-muted-foreground">
              AI detected: <strong>{aiDetectedType}</strong> ({getConfidenceText(aiConfidence)})
            </span>
            <Badge variant="outline" className="text-xs">
              {Math.round(aiConfidence * 100)}%
            </Badge>
          </div>
        )}

        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select your CSCS card type" />
          </SelectTrigger>
          <SelectContent>
            {/* Show suggested types first if AI detected them */}
            {suggestedTypes.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
                  AI Suggestions
                </div>
                {suggestedTypes.map((type) => (
                  <SelectItem key={`suggested-${type.value}`} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border" 
                        style={{ 
                          backgroundColor: type.color,
                          borderColor: type.color === '#FFFFFF' ? '#ccc' : type.color 
                        }}
                      />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
                  All Types
                </div>
              </>
            )}
            
            {/* Show all card types */}
            {cardTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border" 
                    style={{ 
                      backgroundColor: type.color,
                      borderColor: type.color === '#FFFFFF' ? '#ccc' : type.color 
                    }}
                  />
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
