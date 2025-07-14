import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Download, Upload } from "lucide-react";
import { ProjectsCRUD } from "./crud/ProjectsCRUD";
import { LevelsCRUD } from "./crud/LevelsCRUD";
import { PlotsCRUD } from "./crud/PlotsCRUD";
import { WorkPackagesCRUD } from "./crud/WorkPackagesCRUD";
import { RAMSDocumentsCRUD } from "./crud/RAMSDocumentsCRUD";
import { BulkOperations } from "./crud/BulkOperations";
import { OfflineSync } from "./crud/OfflineSync";
import { toast } from "sonner";

const AdminCRUDModule = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced");

  // Monitor offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSyncStatus("syncing");
      toast.success("Connection restored - syncing data...");
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus("offline");
      toast.warning("Working offline - changes will sync when reconnected");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const crudTabs = [
    {
      id: "projects",
      label: "Projects",
      icon: "🏗️",
      component: ProjectsCRUD,
      description: "Manage construction projects and assignments"
    },
    {
      id: "levels",
      label: "Levels",
      icon: "🏢",
      component: LevelsCRUD,
      description: "Configure building levels and floor plans"
    },
    {
      id: "plots",
      label: "Plots",
      icon: "📍",
      component: PlotsCRUD,
      description: "Track individual plot progress and assignments"
    },
    {
      id: "work-packages",
      label: "Work Packages",
      icon: "📋",
      component: WorkPackagesCRUD,
      description: "Manage job packages and task assignments"
    },
    {
      id: "rams",
      label: "RAMS & Documents",
      icon: "📄",
      component: RAMSDocumentsCRUD,
      description: "Upload and version control safety documents"
    },
    {
      id: "bulk",
      label: "Bulk Operations",
      icon: "⚡",
      component: BulkOperations,
      description: "Import/export and batch operations"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Mobile-first header with glove-friendly touch targets */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin CRUD</h1>
                <p className="text-sm text-muted-foreground">SmartWork Hub Management</p>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Badge 
                  variant={syncStatus === "offline" ? "destructive" : syncStatus === "syncing" ? "secondary" : "default"}
                  className="text-xs"
                >
                  {syncStatus === "offline" ? "Offline" : syncStatus === "syncing" ? "Syncing..." : "Online"}
                </Badge>
                {isOffline && <OfflineSync />}
              </div>
            </div>
            
            {/* Search and filters - mobile optimized */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search across all entities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="lg" className="h-12 px-4">
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-4">
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-4">
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile-optimized tab navigation */}
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 min-w-fit gap-1 h-auto p-1">
              {crudTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1 p-3 h-auto min-h-[60px] text-xs whitespace-nowrap"
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
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
                  <tab.component searchQuery={searchQuery} isOffline={isOffline} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Mobile-friendly floating action button for quick actions */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default AdminCRUDModule;