import { useState } from "react";
import { RoleBasedNavigation, MobileNavToggle } from "@/components/navigation/RoleBasedNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Sun, Moon } from "lucide-react";
import { AJIcon } from "@/components/ui/aj-icon";

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export function AppLayout({ children, showNavigation = true }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileNav = () => setMobileNavOpen(!mobileNavOpen);
  const closeMobileNav = () => setMobileNavOpen(false);
  const toggleTheme = () => setIsDark(!isDark);

  if (!showNavigation) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <RoleBasedNavigation 
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      
      {/* Mobile Sidebar */}
      <RoleBasedNavigation 
        isMobile={true}
        isOpen={mobileNavOpen}
        onClose={closeMobileNav}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header Bar for Mobile */}
        <header className="lg:hidden bg-card/95 backdrop-blur border-b border-border shadow-card px-lg py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MobileNavToggle onClick={toggleMobileNav} />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                  <span className="text-lg">🏗️</span>
                </div>
                <div>
                  <h1 className="text-body font-poppins font-bold text-foreground">AJ Ryan</h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Online Status */}
              <Badge 
                variant={isOnline ? "default" : "destructive"}
                className="text-xs font-poppins"
              >
                {isOnline ? (
                  <><Wifi className="w-3 h-3 mr-1" />Online</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" />Offline</>
                )}
              </Badge>
              
              {/* Theme Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}