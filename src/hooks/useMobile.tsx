import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Device, DeviceInfo } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface MobileCapabilities {
  isNative: boolean;
  platform: 'web' | 'ios' | 'android';
  isOnline: boolean;
  deviceInfo: DeviceInfo | null;
  canVibrate: boolean;
  canUseCamera: boolean;
  canUseLocation: boolean;
  canUsePushNotifications: boolean;
}

export function useMobile() {
  const [capabilities, setCapabilities] = useState<MobileCapabilities>({
    isNative: false,
    platform: 'web',
    isOnline: true,
    deviceInfo: null,
    canVibrate: false,
    canUseCamera: false,
    canUseLocation: false,
    canUsePushNotifications: false,
  });

  useEffect(() => {
    initializeMobileCapabilities();
    
    // Listen for network changes
    Network.addListener('networkStatusChange', status => {
      setCapabilities(prev => ({ ...prev, isOnline: status.connected }));
    });

    return () => {
      // Cleanup handled by component unmount
    };
  }, []);

  const initializeMobileCapabilities = async () => {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';
    
    let deviceInfo: DeviceInfo | null = null;
    let networkStatus = { connected: true };

    try {
      if (isNative) {
        deviceInfo = await Device.getInfo();
        networkStatus = await Network.getStatus();
      }

      setCapabilities({
        isNative,
        platform,
        isOnline: networkStatus.connected,
        deviceInfo,
        canVibrate: isNative && platform !== 'web',
        canUseCamera: isNative,
        canUseLocation: isNative || (typeof navigator !== 'undefined' && 'geolocation' in navigator),
        canUsePushNotifications: isNative,
      });
    } catch (error) {
      console.error('Error initializing mobile capabilities:', error);
    }
  };

  const triggerHaptics = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (capabilities.canVibrate) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.error('Haptics error:', error);
      }
    }
  };

  const vibrate = (pattern?: number | number[]) => {
    if (capabilities.canVibrate && navigator.vibrate) {
      navigator.vibrate(pattern || 200);
    }
  };

  return {
    ...capabilities,
    triggerHaptics,
    vibrate,
    refresh: initializeMobileCapabilities,
  };
}