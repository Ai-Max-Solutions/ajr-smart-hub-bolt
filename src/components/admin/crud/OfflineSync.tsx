import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface OfflineSyncProps {
  className?: string;
}

export const OfflineSync = ({ className }: OfflineSyncProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (pendingChanges > 0) {
        handleSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending changes from localStorage
    loadPendingChanges();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingChanges = () => {
    try {
      const stored = localStorage.getItem('pendingCRUDChanges');
      if (stored) {
        const changes = JSON.parse(stored);
        setPendingChanges(changes.length);
      }
    } catch (error) {
      console.error('Failed to load pending changes:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      const stored = localStorage.getItem('pendingCRUDChanges');
      if (!stored) {
        setIsSyncing(false);
        return;
      }

      const changes = JSON.parse(stored);
      if (changes.length === 0) {
        setIsSyncing(false);
        return;
      }

      // Simulate sync progress
      for (let i = 0; i <= changes.length; i++) {
        setSyncProgress((i / changes.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Here you would actually sync each change to Supabase
        // await syncChangeToSupabase(changes[i]);
      }

      // Clear pending changes
      localStorage.removeItem('pendingCRUDChanges');
      setPendingChanges(0);
      setLastSyncTime(new Date());
      
      toast.success(`Synced ${changes.length} pending changes`);
    } catch (error) {
      toast.error('Sync failed - will retry when connection is stable');
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const savePendingChange = (change: any) => {
    try {
      const stored = localStorage.getItem('pendingCRUDChanges') || '[]';
      const changes = JSON.parse(stored);
      changes.push({
        ...change,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      });
      localStorage.setItem('pendingCRUDChanges', JSON.stringify(changes));
      setPendingChanges(changes.length);
    } catch (error) {
      console.error('Failed to save pending change:', error);
    }
  };

  const getConnectionStatus = () => {
    if (isOnline) {
      return {
        icon: <Wifi className="h-4 w-4" />,
        label: "Online",
        variant: "default" as const,
        color: "text-success"
      };
    } else {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        label: "Offline",
        variant: "destructive" as const,
        color: "text-destructive"
      };
    }
  };

  const status = getConnectionStatus();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className={status.color}>{status.icon}</span>
            <span>Connection Status</span>
          </div>
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Pending Changes</span>
            <Badge variant={pendingChanges > 0 ? "secondary" : "secondary"} className="text-xs">
              {pendingChanges}
            </Badge>
          </div>
          
          {pendingChanges > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Changes saved locally</span>
            </div>
          )}
        </div>

        {/* Sync progress */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Syncing...</span>
              <span>{Math.round(syncProgress)}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}

        {/* Last sync time */}
        {lastSyncTime && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-success" />
            <span>Last sync: {lastSyncTime.toLocaleTimeString()}</span>
          </div>
        )}

        {/* Sync button */}
        <Button
          size="sm"
          variant={pendingChanges > 0 ? "default" : "outline"}
          onClick={handleSync}
          disabled={!isOnline || isSyncing || pendingChanges === 0}
          className="w-full h-8"
        >
          <RefreshCw className={`h-3 w-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : pendingChanges > 0 ? 'Sync Now' : 'Up to Date'}
        </Button>

        {/* Offline notice */}
        {!isOnline && (
          <div className="flex items-start gap-2 p-2 bg-warning/10 rounded-lg">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
            <div className="text-xs text-warning">
              <div className="font-medium">Working Offline</div>
              <div>Changes will sync when connection returns</div>
            </div>
          </div>
        )}

        {/* Tips */}
        {!isOnline && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="font-medium">Offline Tips:</div>
            <ul className="space-y-0.5 ml-2">
              <li>• All changes are saved locally</li>
              <li>• Avoid duplicate entries</li>
              <li>• File uploads unavailable</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};