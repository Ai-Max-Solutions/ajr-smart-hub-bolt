import { useState } from "react";
import { useTheme } from "next-themes";
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { theme, setTheme } = useTheme();

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileNav = () => setMobileNavOpen(!mobileNavOpen);
  const closeMobileNav = () => setMobileNavOpen(false);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

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
              <img 
                src="/lovable-uploads/0b275deb-8a7d-4a00-85a3-ae746d59b6f1.png" 
                alt="A&J Ryan Logo" 
                className="w-[180px] rounded-[5px]"
              />
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
                {theme === 'dark' ? (
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