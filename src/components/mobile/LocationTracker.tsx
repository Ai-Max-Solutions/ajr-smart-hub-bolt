import React, { useState, useEffect } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Target } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { toast } from 'sonner';
import { AJIcon } from '@/components/ui/aj-icon';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface SiteLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
}

interface LocationTrackerProps {
  siteLocations?: SiteLocation[];
  onLocationUpdate?: (location: LocationData) => void;
  onSiteEntry?: (site: SiteLocation) => void;
  onSiteExit?: (site: SiteLocation) => void;
}

export function LocationTracker({ 
  siteLocations = [],
  onLocationUpdate,
  onSiteEntry,
  onSiteExit
}: LocationTrackerProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [nearestSite, setNearestSite] = useState<SiteLocation | null>(null);
  const [isOnSite, setIsOnSite] = useState(false);
  const { canUseLocation, isNative, triggerHaptics } = useMobile();

  useEffect(() => {
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchId]);

  useEffect(() => {
    if (currentLocation && siteLocations.length > 0) {
      checkSiteProximity();
    }
  }, [currentLocation, siteLocations]);

  const getCurrentLocation = async () => {
    if (!canUseLocation) {
      toast.error('Location access not available');
      return;
    }

    await triggerHaptics();

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      // Reverse geocoding (disabled for security - requires API key configuration)
      // To enable: Configure OpenCage API key in Supabase Edge Functions
      try {
        // Note: Direct API calls with keys should be done server-side
        // Consider implementing this via Supabase Edge Function
        console.log('Reverse geocoding disabled - implement via Edge Function for security');
      } catch (error) {
        console.log('Reverse geocoding not configured:', error);
      }

      setCurrentLocation(locationData);
      onLocationUpdate?.(locationData);
      toast.success('Location updated');
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Failed to get location');
    }
  };

  const startTracking = async () => {
    if (!canUseLocation) {
      toast.error('Location access not available');
      return;
    }

    try {
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 30000
        },
        (position: Position | null, error) => {
          if (error) {
            console.error('Location tracking error:', error);
            toast.error('Location tracking error');
            return;
          }

          if (position) {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };

            setCurrentLocation(locationData);
            onLocationUpdate?.(locationData);
          }
        }
      );

      setWatchId(id);
      setIsTracking(true);
      await triggerHaptics();
      toast.success('Location tracking started');
    } catch (error) {
      console.error('Failed to start tracking:', error);
      toast.error('Failed to start location tracking');
    }
  };

  const stopTracking = async () => {
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
    }
    setIsTracking(false);
    await triggerHaptics();
    toast.success('Location tracking stopped');
  };

  const checkSiteProximity = () => {
    if (!currentLocation) return;

    let nearest: SiteLocation | null = null;
    let shortestDistance = Infinity;
    let withinSite = false;

    siteLocations.forEach(site => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        site.latitude,
        site.longitude
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearest = site;
      }

      if (distance <= site.radius) {
        withinSite = true;
        if (!isOnSite) {
          onSiteEntry?.(site);
          triggerHaptics();
          toast.success(`Entered ${site.name}`);
        }
      }
    });

    if (isOnSite && !withinSite && nearestSite) {
      onSiteExit?.(nearestSite);
      triggerHaptics();
      toast.info(`Left ${nearestSite.name}`);
    }

    setNearestSite(nearest);
    setIsOnSite(withinSite);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const openInMaps = () => {
    if (!currentLocation) return;

    const { latitude, longitude } = currentLocation;
    const url = isNative 
      ? `maps://?q=${latitude},${longitude}`
      : `https://maps.google.com?q=${latitude},${longitude}`;
    
    window.open(url, '_blank');
    triggerHaptics();
  };

  if (!canUseLocation) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="text-center py-8">
          <Navigation className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Location Not Available</h3>
          <p className="text-muted-foreground">
            Location tracking requires device permissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-poppins">
            <AJIcon icon={MapPin} variant="navy" size="sm" hover={false} />
            Location Tracking
            {isOnSite && (
              <Badge variant="default" className="ml-auto">
                On Site
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Button
              onClick={getCurrentLocation}
              variant="outline"
              size="lg"
              className="h-16 font-poppins"
            >
              <AJIcon icon={Target} variant="yellow" size="lg" hover={false} />
              <div className="ml-3 text-left">
                <div className="font-semibold">Get Location</div>
                <div className="text-sm opacity-70">Current position</div>
              </div>
            </Button>
            
            <Button
              onClick={isTracking ? stopTracking : startTracking}
              size="lg"
              className="h-16 font-poppins"
              variant={isTracking ? "destructive" : "default"}
            >
              <AJIcon 
                icon={Navigation} 
                variant={isTracking ? "white" : "white"} 
                size="lg" 
                hover={false} 
              />
              <div className="ml-3 text-left">
                <div className="font-semibold">
                  {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                </div>
                <div className="text-sm opacity-90">
                  {isTracking ? 'Continuous updates' : 'Live location'}
                </div>
              </div>
            </Button>
          </div>

          {isTracking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Location tracking active
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Location Info */}
      {currentLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-poppins">
              <span>Current Location</span>
              <Button
                variant="outline"
                size="sm"
                onClick={openInMaps}
                className="font-poppins"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Open in Maps
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Latitude</div>
                  <div className="font-mono">{currentLocation.latitude.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Longitude</div>
                  <div className="font-mono">{currentLocation.longitude.toFixed(6)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Accuracy: ±{Math.round(currentLocation.accuracy)}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(currentLocation.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {currentLocation.address && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Address</div>
                  <div className="font-medium">{currentLocation.address}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site Information */}
      {nearestSite && (
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins">Nearest Site</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{nearestSite.name}</h3>
                <Badge variant={isOnSite ? "default" : "secondary"}>
                  {isOnSite ? "On Site" : "Off Site"}
                </Badge>
              </div>
              
              {currentLocation && (
                <div className="text-sm text-muted-foreground">
                  Distance: {Math.round(calculateDistance(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    nearestSite.latitude,
                    nearestSite.longitude
                  ))}m away
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}