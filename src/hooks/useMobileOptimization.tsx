import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  action: () => void;
  threshold?: number;
}

interface MobileFeatures {
  isOffline: boolean;
  isPWA: boolean;
  batteryLevel?: number;
  isLowPower: boolean;
  connectionType: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export const useMobileOptimization = () => {
  const { toast } = useToast();
  const [mobileFeatures, setMobileFeatures] = useState<MobileFeatures>({
    isOffline: !navigator.onLine,
    isPWA: window.matchMedia('(display-mode: standalone)').matches,
    isLowPower: false,
    connectionType: 'unknown',
    deviceType: 'desktop'
  });

  const [swipeGestures, setSwipeGestures] = useState<SwipeGesture[]>([]);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isOneHandedMode, setIsOneHandedMode] = useState(false);

  // Detect device type and capabilities
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;
      
      let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      
      if (/Mobile|Android|iPhone/i.test(userAgent)) {
        deviceType = width < 768 ? 'mobile' : 'tablet';
      }

      setMobileFeatures(prev => ({
        ...prev,
        deviceType,
        isPWA: window.matchMedia('(display-mode: standalone)').matches
      }));
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Battery optimization
  useEffect(() => {
    const monitorBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          
          setMobileFeatures(prev => ({
            ...prev,
            batteryLevel: battery.level * 100,
            isLowPower: battery.level < 0.2
          }));

          battery.addEventListener('levelchange', () => {
            setMobileFeatures(prev => ({
              ...prev,
              batteryLevel: battery.level * 100,
              isLowPower: battery.level < 0.2
            }));
          });
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    monitorBattery();
  }, []);

  // Network monitoring
  useEffect(() => {
    const updateConnectionType = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        setMobileFeatures(prev => ({
          ...prev,
          connectionType: connection.effectiveType || 'unknown'
        }));
      }
    };

    updateConnectionType();
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateConnectionType);
    }

    const handleOnline = () => setMobileFeatures(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setMobileFeatures(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  // Touch gestures and swipe detection
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart || e.changedTouches.length !== 1) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const threshold = 50;

    let direction: 'left' | 'right' | 'up' | 'down' | null = null;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        direction = deltaX > 0 ? 'right' : 'left';
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }

    if (direction) {
      const gesture = swipeGestures.find(g => g.direction === direction);
      if (gesture) {
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        gesture.action();
      }
    }

    setTouchStart(null);
  }, [touchStart, swipeGestures]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  // PWA installation prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: "🎉 App Installed!",
          description: "SmartWork Hub is now available on your home screen",
        });
      }
      
      setDeferredPrompt(null);
    }
  };

  // One-handed mode optimization
  const toggleOneHandedMode = () => {
    setIsOneHandedMode(!isOneHandedMode);
    
    // Apply CSS classes for one-handed layout
    if (!isOneHandedMode) {
      document.body.classList.add('one-handed-mode');
      toast({
        title: "👍 One-Handed Mode",
        description: "Interface optimized for single-hand use",
      });
    } else {
      document.body.classList.remove('one-handed-mode');
    }
  };

  // Smart audio compression for mobile
  const optimizeAudioForMobile = (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      if (mobileFeatures.connectionType === 'slow-2g' || mobileFeatures.isLowPower) {
        // Apply aggressive compression
        const compressionOptions = {
          quality: 0.3,
          sampleRate: 16000
        };
        // Implementation would use Web Audio API for compression
        resolve(audioBlob); // Simplified for now
      } else {
        resolve(audioBlob);
      }
    });
  };

  // Offline message caching
  const cacheMessageOffline = (message: string, response: string) => {
    if (mobileFeatures.isOffline) {
      const cached = localStorage.getItem('offline_messages') || '[]';
      const messages = JSON.parse(cached);
      
      messages.push({
        id: Date.now(),
        message,
        response,
        timestamp: new Date().toISOString(),
        synced: false
      });
      
      localStorage.setItem('offline_messages', JSON.stringify(messages));
    }
  };

  // Register swipe gesture
  const registerSwipeGesture = (gesture: SwipeGesture) => {
    setSwipeGestures(prev => [...prev, gesture]);
  };

  // Remove swipe gesture
  const unregisterSwipeGesture = (direction: SwipeGesture['direction']) => {
    setSwipeGestures(prev => prev.filter(g => g.direction !== direction));
  };

  return {
    mobileFeatures,
    isOneHandedMode,
    deferredPrompt: !!deferredPrompt,
    installPWA,
    toggleOneHandedMode,
    optimizeAudioForMobile,
    cacheMessageOffline,
    registerSwipeGesture,
    unregisterSwipeGesture
  };
};

// CSS for one-handed mode (to be added to index.css)
export const oneHandedModeStyles = `
.one-handed-mode {
  --mobile-safe-area: env(safe-area-inset-bottom, 20px);
}

.one-handed-mode .fixed.bottom-0,
.one-handed-mode .absolute.bottom-0 {
  bottom: var(--mobile-safe-area);
}

.one-handed-mode .chat-interface {
  max-height: 50vh;
  transform: translateY(25vh);
}

.one-handed-mode .ai-controls {
  position: fixed;
  bottom: var(--mobile-safe-area);
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 300px;
}

@media (max-width: 768px) {
  .one-handed-mode .text-input {
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  .one-handed-mode .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
}
`;