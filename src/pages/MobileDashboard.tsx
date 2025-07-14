import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Battery, 
  Camera, 
  MapPin,
  Bell,
  Users,
  FileText,
  Settings,
  Download,
  Share,
  Zap,
  Clock
} from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { DocumentScanner } from '@/components/mobile/DocumentScanner';
import { LocationTracker } from '@/components/mobile/LocationTracker';
// import { PushNotifications } from '@/components/mobile/PushNotifications';
import { MobileOfflineIndicator } from '@/components/mobile/MobileOfflineIndicator';
import { MobileWorkflowShortcuts } from '@/components/mobile/MobileWorkflowShortcuts';
import { MobileProjectCard } from '@/components/mobile/MobileProjectCard';

export default function MobileDashboard() {
  const mobile = useMobile();
  const mobileOpt = useMobileOptimization();
  const [activeTab, setActiveTab] = useState('overview');

  // Sample project data
  const sampleProjects = [
    {
      id: '1',
      name: 'Oakwood Residential Development',
      location: 'Birmingham, West Midlands',
      status: 'active' as const,
      progress: 78,
      teamSize: 12,
      documentsCount: 45,
      urgentTasks: 3,
      lastActivity: '2 hours ago',
      isNearby: true,
      distance: '0.8 miles'
    },
    {
      id: '2',
      name: 'Central Plaza Commercial',
      location: 'Manchester City Centre',
      status: 'active' as const,
      progress: 45,
      teamSize: 8,
      documentsCount: 32,
      urgentTasks: 1,
      lastActivity: '1 day ago',
      isNearby: false,
      distance: '15.2 miles'
    }
  ];

  const capabilityItems = [
    {
      name: 'Platform',
      value: mobile.isNative ? 'Native App' : 'Web App',
      icon: Smartphone,
      available: true
    },
    {
      name: 'Connection',
      value: mobile.isOnline ? 'Online' : 'Offline',
      icon: mobile.isOnline ? Wifi : WifiOff,
      available: true
    },
    {
      name: 'Camera',
      value: mobile.canUseCamera ? 'Available' : 'Web Only',
      icon: Camera,
      available: mobile.canUseCamera
    },
    {
      name: 'Location',
      value: mobile.canUseLocation ? 'Available' : 'Disabled',
      icon: MapPin,
      available: mobile.canUseLocation
    },
    {
      name: 'Notifications',
      value: mobile.canUsePushNotifications ? 'Enabled' : 'Web Only',
      icon: Bell,
      available: mobile.canUsePushNotifications
    },
    {
      name: 'Haptics',
      value: mobile.canVibrate ? 'Available' : 'Not Supported',
      icon: Smartphone,
      available: mobile.canVibrate
    }
  ];

  const mobileFeatures = [
    {
      name: 'Battery Level',
      value: mobileOpt.mobileFeatures.batteryLevel ? `${Math.round(mobileOpt.mobileFeatures.batteryLevel * 100)}%` : 'Unknown',
      icon: Battery,
      available: !!mobileOpt.mobileFeatures.batteryLevel
    },
    {
      name: 'Offline Mode',
      value: mobileOpt.mobileFeatures.isOffline ? 'Active' : 'Normal',
      icon: Zap,
      available: true
    },
    {
      name: 'Connection Type',
      value: mobileOpt.mobileFeatures.connectionType || 'Unknown',
      icon: Wifi,
      available: !!mobileOpt.mobileFeatures.connectionType
    },
    {
      name: 'Device Type',
      value: mobileOpt.mobileFeatures.deviceType || 'Unknown',
      icon: Smartphone,
      available: true
    }
  ];

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mobile Dashboard</h1>
        <Badge variant={mobile.isNative ? "default" : "secondary"}>
          {mobile.isNative ? "Native" : "Web"}
        </Badge>
      </div>

      {/* Offline Status */}
      <MobileOfflineIndicator />

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {['overview', 'projects', 'scanner', 'location', 'notifications'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="flex-1 text-xs"
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick Workflow Shortcuts */}
          <MobileWorkflowShortcuts />
          
          {/* Mobile Capabilities Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Device
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {capabilityItems.slice(0, 3).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Icon className={`w-3 h-3 ${item.available ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>{item.name}</span>
                        </div>
                        <Badge variant={item.available ? "default" : "secondary"} className="text-xs px-1">
                          {item.value}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Features
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {mobileFeatures.slice(0, 3).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Icon className={`w-3 h-3 ${item.available ? 'text-green-600' : 'text-gray-400'}`} />
                          <span>{item.name}</span>
                        </div>
                        <Badge variant={item.available ? "default" : "secondary"} className="text-xs px-1">
                          {item.value}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PWA Features */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Progressive Web App
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {mobileOpt.deferredPrompt && (
                  <Button onClick={mobileOpt.installPWA} size="sm" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Install Mobile App
                  </Button>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={mobileOpt.toggleOneHandedMode} 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                  >
                    One-Hand Mode
                  </Button>
                  
                  <Button 
                    onClick={() => mobile.triggerHaptics()}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Test Haptics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Projects</h2>
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Real-time
            </Badge>
          </div>
          
          {sampleProjects.map((project) => (
            <MobileProjectCard 
              key={project.id} 
              project={project}
            />
          ))}
        </div>
      )}

      {activeTab === 'scanner' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Document Scanner</h2>
          <DocumentScanner />
        </div>
      )}

      {activeTab === 'location' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Location Services</h2>
          <LocationTracker />
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Push Notifications</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Push notifications feature will be available here.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}