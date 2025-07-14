import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, CloudOff, RefreshCw, Clock } from 'lucide-react';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useMobile } from '@/hooks/useMobile';
import { useToast } from '@/hooks/use-toast';

export function MobileOfflineIndicator() {
  const { isOnline, pendingOperations, isSyncing, syncPendingOperations, pendingCount } = useOfflineStorage();
  const { triggerHaptics } = useMobile();
  const { toast } = useToast();
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      toast({
        title: "Back Online",
        description: `${pendingCount} pending changes will be synced`,
      });
    }
  }, [isOnline, pendingCount, toast]);

  const handleManualSync = async () => {
    try {
      await triggerHaptics();
      await syncPendingOperations();
      setLastSync(new Date());
      toast({
        title: "Sync Complete",
        description: "All changes have been synchronized",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Some changes could not be synchronized",
        variant: "destructive",
      });
    }
  };

  if (isOnline && pendingCount === 0) {
    return (
      <Badge variant="outline" className="flex items-center gap-2 bg-green-50 text-green-700 border-green-200">
        <Wifi className="w-3 h-3" />
        Online
      </Badge>
    );
  }

  if (!isOnline) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <WifiOff className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Working Offline</div>
              {pendingCount > 0 && (
                <div className="text-sm mt-1">
                  {pendingCount} changes pending sync
                </div>
              )}
            </div>
            <CloudOff className="w-4 h-4 text-amber-600" />
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Clock className="w-3 h-3 mr-1" />
              {pendingCount} pending
            </Badge>
            {lastSync && (
              <span className="text-xs text-blue-600">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            {isSyncing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Sync
              </>
            )}
          </Button>
        </div>
        
        {pendingOperations.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-xs font-medium text-blue-700">Pending Changes:</div>
            {pendingOperations.slice(0, 3).map((op) => (
              <div key={op.id} className="text-xs text-blue-600 flex items-center gap-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full" />
                {op.operation} on {op.table}
              </div>
            ))}
            {pendingOperations.length > 3 && (
              <div className="text-xs text-blue-500">
                +{pendingOperations.length - 3} more
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}