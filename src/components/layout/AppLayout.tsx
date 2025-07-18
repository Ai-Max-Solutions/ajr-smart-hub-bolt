import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Sun, Moon, Menu } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}