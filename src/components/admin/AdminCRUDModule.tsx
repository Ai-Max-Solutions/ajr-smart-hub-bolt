import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Plus, Filter, Download, Upload, Brain, Sparkles, Zap, Shield, Activity, BarChart3, Building2, Users, Layers, MapPin, Package, FileText } from "lucide-react";
import { AJIcon } from "@/components/ui/aj-icon";
import { ProjectsCRUD } from "./crud/ProjectsCRUD";
import { LevelsCRUD } from "./crud/LevelsCRUD";
import { PlotsCRUD } from "./crud/PlotsCRUD";
import { WorkPackagesCRUD } from "./crud/WorkPackagesCRUD";
import { RAMSDocumentsCRUD } from "./crud/RAMSDocumentsCRUD";
import { BulkOperations } from "./crud/BulkOperations";
import { OfflineSync } from "./crud/OfflineSync";
import { UnifiedSearch } from "./UnifiedSearch";
import { AuditLogsViewer } from "./AuditLogsViewer";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { toast } from "sonner";

const AdminCRUDModule = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showUnifiedSearch, setShowUnifiedSearch] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  
  const { 
    isOnline, 
    pendingOperations, 
    isSyncing, 
    pendingCount 
  } = useOfflineStorage();

  // Monitor connection status
  useEffect(() => {
    if (!isOnline) {
      toast.warning("Working offline - changes will sync when reconnected");
    } else if (pendingCount > 0) {
      toast.success(`Connection restored - syncing ${pendingCount} pending changes...`);
    }
  }, [isOnline, pendingCount]);

  const crudTabs = [
    {
      id: "projects",
      label: "Projects",
      icon: "🏗️",
      component: ProjectsCRUD,
      description: "Manage construction projects and assignments",
      badge: null
    },
    {
      id: "levels",
      label: "Levels", 
      icon: "🏢",
      component: LevelsCRUD,
      description: "Configure building levels and floor plans",
      badge: null
    },
    {
      id: "plots",
      label: "Plots",
      icon: "📍",
      component: PlotsCRUD,
      description: "Track individual plot progress and assignments",
      badge: null
    },
    {
      id: "work-packages",
      label: "Work Packages",
      icon: "📋",
      component: WorkPackagesCRUD,
      description: "Manage job packages and task assignments",
      badge: null
    },
    {
      id: "rams",
      label: "RAMS & Documents",
      icon: "📄",
      component: RAMSDocumentsCRUD,
      description: "Upload and version control safety documents",
      badge: aiEnabled ? "AI" : null
    },
    {
      id: "bulk",
      label: "Bulk Operations",
      icon: "⚡",
      component: BulkOperations,
      description: "Import/export and batch operations",
      badge: null
    },
    {
      id: "audit",
      label: "Audit Logs",
      icon: "🛡️",
      component: AuditLogsViewer,
      description: "View comprehensive audit trail and compliance logs",
      badge: "Security"
    }
  ];

  return (
    <div className="min-h-screen bg-background mobile-optimized">
      {/* AJ Ryan Header with Enhanced Branding */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border shadow-card">
        <div className="container mx-auto px-lg py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-brand flex items-center justify-center shadow-elevated">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-header font-poppins font-bold text-foreground">AJ Ryan SmartWork Hub</h1>
                <p className="text-label text-muted-foreground font-poppins">Admin Control Panel</p>
              </div>
              <div className="flex items-center gap-3 ml-auto md:ml-0">
                <Badge 
                  variant={!isOnline ? "destructive" : isSyncing ? "secondary" : "default"}
                  className="text-label touch-target font-poppins px-3 py-1"
                >
                  {!isOnline ? "Offline" : isSyncing ? "Syncing..." : "Online"}
                </Badge>
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="text-label font-poppins px-3 py-1">
                    {pendingCount} Pending
                  </Badge>
                )}
                {!isOnline && <OfflineSync />}
              </div>
            </div>
            
            {/* AJ Ryan Enhanced Search Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
              <div className="relative flex-1 max-w-sm">
                <AJIcon icon={Search} variant="yellow" size="sm" hover={false} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search across all entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-body touch-target font-poppins bg-card border-border focus:ring-accent"
                />
              </div>
              
              {/* AJ Ryan AI & Performance Controls */}
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="ai-mode"
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                  />
                  <Label htmlFor="ai-mode" className="text-label font-poppins font-medium flex items-center gap-2">
                    <AJIcon icon={Brain} variant="yellow" size="sm" hover={false} />
                    AI Features
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Switch
                    id="performance-mode"
                    checked={performanceMode}
                    onCheckedChange={setPerformanceMode}
                  />
                  <Label htmlFor="performance-mode" className="text-label font-poppins font-medium flex items-center gap-2">
                    <AJIcon icon={Zap} variant="yellow" size="sm" hover={false} />
                    Performance
                  </Label>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="accent" 
                  size="touch" 
                  className="font-poppins"
                  onClick={() => setShowUnifiedSearch(!showUnifiedSearch)}
                >
                  <AJIcon icon={Search} variant="navy" size="sm" hover={false} />
                  <span className="hidden sm:inline ml-2">Unified Search</span>
                  <span className="sm:hidden ml-2">Search</span>
                </Button>
                <Button variant="outline" size="touch" className="font-poppins">
                  <AJIcon icon={Filter} variant="yellow" size="sm" hover={false} />
                  <span className="hidden sm:inline ml-2">Filter</span>
                </Button>
                <Button variant="outline" size="touch" className="font-poppins">
                  <AJIcon icon={Download} variant="yellow" size="sm" hover={false} />
                  <span className="hidden sm:inline ml-2">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Search Overlay */}
      {showUnifiedSearch && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40">
          <div className="container mx-auto px-4 py-8">
            <UnifiedSearch />
          </div>
        </div>
      )}

      {/* Main content area with enhanced performance */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Enhanced mobile-optimized tab navigation */}
          <div className="overflow-x-auto mobile-scroll">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 min-w-fit gap-1 h-auto p-1">
              {crudTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1 p-3 h-auto min-h-[64px] text-xs whitespace-nowrap touch-target relative"
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline text-center leading-tight">{tab.label}</span>
                  <span className="sm:hidden text-center">{tab.label.split(' ')[0]}</span>
                  {tab.badge && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4">
                      {tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab content with smooth transitions */}
          {crudTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <span>{tab.icon}</span>
                        {tab.label}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {tab.description}
                      </CardDescription>
                    </div>
                    <Button size="lg" className="h-12 px-6">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add New</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <tab.component 
                    searchQuery={searchQuery} 
                    isOffline={!isOnline}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Enhanced mobile-friendly floating action button */}
      <div className="fixed bottom-6 right-6 md:hidden z-30">
        <div className="flex flex-col gap-2 items-end">
          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {pendingCount} pending
            </Badge>
          )}
          <Button 
            size="lg" 
            className="h-14 w-14 rounded-full shadow-brand hover:shadow-lg transition-all duration-200 touch-target"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminCRUDModule;