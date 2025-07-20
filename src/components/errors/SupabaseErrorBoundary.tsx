
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  operation?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class SupabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { operation = 'Unknown Operation', onError } = this.props;
    
    console.error(`[SupabaseErrorBoundary] ${operation} failed:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount
    });

    this.setState({ errorInfo });
    
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error?.message?.includes('NetworkError') ||
                            this.state.error?.message?.includes('fetch');
      
      return (
        <div className="flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Wrench className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {isNetworkError ? 'Connection Issues' : 'System Maintenance'}
              </CardTitle>
              <CardDescription>
                {isNetworkError 
                  ? '🚰 Pipes got a bit tangled! Our plumbers are working on it.'
                  : '🔧 System needs a quick tune-up. Please try again in a moment.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.retryCount > 0 && (
                <div className="text-sm text-muted-foreground text-center">
                  Retry attempt: {this.state.retryCount}
                </div>
              )}
              
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant={this.state.retryCount > 2 ? "outline" : "default"}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {this.state.retryCount > 2 ? 'Try Once More' : 'Retry Operation'}
              </Button>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                    Error Details (Dev Mode)
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\nStack:\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
