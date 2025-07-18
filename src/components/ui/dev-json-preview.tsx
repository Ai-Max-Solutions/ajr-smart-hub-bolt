
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DevJsonPreviewProps {
  data: any;
  title?: string;
  confidence?: number;
}

export const DevJsonPreview: React.FC<DevJsonPreviewProps> = ({
  data,
  title = "AI Analysis Result",
  confidence
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev || !data) return null;

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getConfidenceBadge = (conf: number) => {
    if (conf >= 0.8) return <Badge className="bg-green-500">High</Badge>;
    if (conf >= 0.5) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge className="bg-red-500">Low</Badge>;
  };

  return (
    <Card className="border-dashed border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
            <Code className="h-4 w-4" />
            {title}
            {confidence !== undefined && getConfidenceBadge(confidence)}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
            className="text-orange-600 hover:text-orange-700"
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription className="text-xs text-orange-600">
          Development Mode - AI Response Preview
        </CardDescription>
      </CardHeader>
      
      {isVisible && (
        <CardContent className="pt-0">
          <pre className="text-xs bg-white/50 p-3 rounded border overflow-auto max-h-40 text-gray-700">
            {formatJson(data)}
          </pre>
        </CardContent>
      )}
    </Card>
  );
};
