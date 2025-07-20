
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft, AlertCircle, Clock } from 'lucide-react';

interface LoadingBoundaryProps {
  isLoading: boolean;
  error: Error | null;
  hasTimedOut: boolean;
  onRetry: () => void;
  onBack: () => void;
  loadingMessage?: string;
  children: React.ReactNode;
}

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
  isLoading,
  error,
  hasTimedOut,
  onRetry,
  onBack,
  loadingMessage = "Loading...",
  children
}) => {
  // Show timeout error
  if (hasTimedOut && isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <Clock className="h-12 w-12 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Loading Taking Too Long</h3>
            <p className="text-muted-foreground text-sm mb-4">
              The request is taking longer than expected to complete.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Retry
            </Button>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    const isAccessDenied = error.message?.includes('Access denied');
    
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">
              {isAccessDenied ? 'Access Denied' : 'Something went wrong'}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {isAccessDenied 
                ? 'You may not have permission to access this resource.'
                : error.message || 'An unexpected error occurred.'
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show children when everything is loaded
  return <>{children}</>;
};
