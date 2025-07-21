import { useState } from "react";
import { useTheme } from "next-themes";
import { useLocation, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Sun, Moon, Menu, Home, Building2, Settings, Shield, Brain, UserCheck } from "lucide-react";
import { AJIcon } from "@/components/ui/aj-icon";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export function AppLayout({ children, showNavigation = true }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileNav = () => setMobileNavOpen(!mobileNavOpen);
  const closeMobileNav = () => setMobileNavOpen(false);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Check if we should show navigation for this route
  const shouldShowNavigation = showNavigation || location.pathname.startsWith('/projects');

  const navigationItems = [
    { label: 'Dashboard', href: '/', icon: Home },
    { label: 'Projects', href: '/projects', icon: Building2 },
    { label: 'Work Assignment', href: '/work-assignment', icon: UserCheck },
    { label: 'Engineer Tools', href: '/engineer-dashboard', icon: Settings },
    { label: 'Document Control', href: '/document-control', icon: Shield },
    { label: 'Admin', href: '/admin', icon: Settings },
    { label: 'AI Assistant', href: '/ai', icon: Brain },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    if (href === '/work-assignment') {
      return location.pathname.includes('/units');
    }
    return location.pathname.startsWith(href);
  };

  if (!shouldShowNavigation) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          {/* Mobile Navigation */}
          <div className="flex md:hidden">
            <MobileNavigation />
          </div>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <NavLink to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/0b275deb-8a7d-4a00-85a3-ae746d59b6f1.png" 
                alt="AJ Ryan Logo" 
                className="h-8 w-auto rounded-sm"
              />
              
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-8">
            {navigationItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-aj-yellow/10",
                  isActive(item.href) 
                    ? "text-foreground bg-accent" 
                    : "text-foreground/60"
                )}
              >
                <AJIcon 
                  icon={item.icon} 
                  variant={isActive(item.href) ? "navy" : "yellow"} 
                  size="sm" 
                />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 px-0 hover:bg-aj-yellow/10"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}
