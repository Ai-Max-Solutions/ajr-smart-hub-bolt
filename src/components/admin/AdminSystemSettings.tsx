
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Shield, 
  Upload, 
  Save,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Lock,
  Unlock
} from "lucide-react";
import { toast } from "sonner";

const AdminSystemSettings = () => {
  const [settings, setSettings] = useState({
    cscsGateEnabled: true,
    ramsGateEnabled: true,
    maintenanceMode: false,
    autoBackup: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    emailNotifications: true,
    auditLogging: true
  });

  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "System temporarily down for maintenance - back faster than you can say 'pipe wrench'!"
  );

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSettingChange = (key: string, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Settings updated - all valves adjusted perfectly! 🔧");
    setSaving(false);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      toast.success("Logo selected - ready to make it yours!");
    }
  };

  const getStatusBadge = (enabled: boolean) => {
    return enabled ? (
      <Badge className="bg-green-500/20 text-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Flowing
      </Badge>
    ) : (
      <Badge variant="secondary">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Sealed
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-accent" />
            Master Valves - Control the Flow
          </h2>
          <p className="text-muted-foreground">
            Adjust the main controls - no shortcuts, just proper engineering!
          </p>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} />
          {saving ? 'Adjusting Valves...' : 'Save All Settings'}
        </Button>
      </div>

      {/* Security & Access Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Security Gates - No Leaks Allowed
          </CardTitle>
          <CardDescription>
            Control access gates and security features - keep the system watertight
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Label htmlFor="cscs-gate" className="text-base font-medium">
                  CSCS Card Gate
                </Label>
                {getStatusBadge(settings.cscsGateEnabled)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.cscsGateEnabled 
                  ? "Lock it tight - users need valid CSCS cards" 
                  : "Gate open - CSCS checking disabled"}
              </p>
            </div>
            <Switch
              id="cscs-gate"
              checked={settings.cscsGateEnabled}
              onCheckedChange={(checked) => handleSettingChange('cscsGateEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Label htmlFor="rams-gate" className="text-base font-medium">
                  RAMS Gate
                </Label>
                {getStatusBadge(settings.ramsGateEnabled)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.ramsGateEnabled 
                  ? "Safety first - no shortcuts allowed!" 
                  : "Safety checks disabled - proceed with caution"}
              </p>
            </div>
            <Switch
              id="rams-gate"
              checked={settings.ramsGateEnabled}
              onCheckedChange={(checked) => handleSettingChange('ramsGateEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Label htmlFor="maintenance-mode" className="text-base font-medium">
                  Maintenance Mode
                </Label>
                {settings.maintenanceMode ? (
                  <Badge variant="destructive">
                    <Lock className="w-3 h-3 mr-1" />
                    Site Down
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/20 text-green-500">
                    <Unlock className="w-3 h-3 mr-1" />
                    Open for Business
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {settings.maintenanceMode 
                  ? "Site locked down for maintenance work" 
                  : "System running - all hands on deck!"}
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
            />
          </div>

          {settings.maintenanceMode && (
            <div className="space-y-2">
              <Label htmlFor="maintenance-message">Maintenance Message</Label>
              <Textarea
                id="maintenance-message"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Tell users what's happening..."
                className="min-h-[80px]"
              />
              <p className="text-sm text-muted-foreground">
                This message will be shown to users when they try to access the system
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-accent" />
            System Configuration - Fine Tuning
          </CardTitle>
          <CardDescription>
            Adjust system behavior and performance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value) || 60)}
                min="5"
                max="480"
              />
              <p className="text-sm text-muted-foreground">
                How long before idle users get booted out
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
              <Input
                id="max-login-attempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value) || 5)}
                min="1"
                max="10"
              />
              <p className="text-sm text-muted-foreground">
                Block users after this many failed attempts
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="auto-backup" className="text-base font-medium">
                Automatic Backups
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Keep your data safe with regular backups
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={settings.autoBackup}
              onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="email-notifications" className="text-base font-medium">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Send email alerts for important events
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor="audit-logging" className="text-base font-medium">
                Audit Logging
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Track all system activities in the logbook
              </p>
            </div>
            <Switch
              id="audit-logging"
              checked={settings.auditLogging}
              onCheckedChange={(checked) => handleSettingChange('auditLogging', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent" />
            Company Branding - Make It Yours
          </CardTitle>
          <CardDescription>
            Upload your logo and customize the look - no generic fittings here!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Company Logo</Label>
            <div className="flex items-center gap-4">
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
            {logoFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {logoFile.name} - Ready to install!
              </p>
            )}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Preview Area</h4>
            <div className="w-32 h-16 bg-background border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Logo Preview</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="flex items-center gap-2"
        >
          <Save className={`w-5 h-5 ${saving ? 'animate-pulse' : ''}`} />
          {saving ? 'Saving Changes...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};

export default AdminSystemSettings;
