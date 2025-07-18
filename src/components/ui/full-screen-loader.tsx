import { Loader2 } from 'lucide-react';

interface FullScreenLoaderProps {
  message?: string;
}

export const FullScreenLoader = ({ message = "Loading..." }: FullScreenLoaderProps) => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};