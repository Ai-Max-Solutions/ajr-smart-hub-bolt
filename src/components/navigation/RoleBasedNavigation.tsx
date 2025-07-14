import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  LayoutDashboard, 
  Clock, 
  Brain, 
  Shield, 
  Settings, 
  FileText, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  Home,
  MapPin,
  Zap,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AJIcon } from "@/components/ui/aj-icon";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/hooks/useUserProfile";

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: any;
  roles: string[];
  badge?: string;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    roles: ["all"],
    description: "Overview and key metrics"
  },
  {
    id: "operative",
    label: "My Portal",
    path: "/operative",
    icon: Home,
    roles: ["operative", "all"],
    description: "Personal dashboard and tasks"
  },
  {
    id: "projects",
    label: "Projects",
    path: "/projects",
    icon: Building2,
    roles: ["pm", "admin", "supervisor", "director"],
    description: "Project management and tracking"
  },
  {
    id: "timesheets",
    label: "Timesheets",
    path: "/operative/timesheets",
    icon: Clock,
    roles: ["operative", "pm", "admin", "supervisor"],
    description: "Time tracking and approvals"
  },
  {
    id: "ai-assistant",
    label: "AI Assistant",
    path: "/ai-assistant",
    icon: Brain,
    roles: ["all"],
    badge: "AI",
    description: "Smart assistant and automation"
  },
  {
    id: "evidence-chain",
    label: "Evidence Chain",
    path: "/operative/evidence",
    icon: Shield,
    roles: ["operative", "pm", "admin", "supervisor"],
    description: "Document trail and compliance"
  },
  {
    id: "compliance",
    label: "Compliance",
    path: "/operative/compliance",
    icon: FileText,
    roles: ["operative", "pm", "admin", "supervisor"],
    description: "Safety and regulatory compliance"
  },
  {
    id: "admin",
    label: "Admin Panel",
    path: "/admin",
    icon: Settings,
    roles: ["admin", "dpo"],
    badge: "Admin",
    description: "System administration"
  },
  {
    id: "director",
    label: "Director Dashboard",
    path: "/director",
    icon: BarChart3,
    roles: ["director", "admin", "dpo"],
    badge: "Executive",
    description: "High-level analytics and insights"
  }
];

interface RoleBasedNavigationProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function RoleBasedNavigation({ 
  collapsed = false, 
  onToggleCollapse, 
  isMobile = false,
  isOpen = false,
  onClose 
}: RoleBasedNavigationProps) {
  const location = useLocation();
  const { profile } = useUserProfile();
  const userRole = profile?.role || "operative";

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes("all") || item.roles.includes(userRole)
  );

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getNavLinkClass = (path: string) => cn(
    "flex items-center gap-3 px-4 py-3 rounded-lg transition-aj duration-aj-smooth font-poppins font-medium group relative",
    "hover:bg-accent hover:text-accent-foreground hover:shadow-card hover:-translate-y-0.5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    isActivePath(path) 
      ? "bg-accent text-accent-foreground shadow-card" 
      : "text-muted-foreground hover:text-foreground",
    isMobile ? "text-body" : collapsed ? "justify-center" : "text-body"
  );

  const navContent = (
    <>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 p-lg border-b border-border",
        isMobile ? "justify-between" : collapsed ? "justify-center" : "justify-between"
      )}>
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-brand rounded-lg flex items-center justify-center shadow-elevated">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-body font-poppins font-bold text-foreground">AJ Ryan</h2>
              <p className="text-label text-muted-foreground font-poppins">SmartWork Hub</p>
            </div>
          </div>
        )}
        
        {isMobile ? (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleCollapse}
            className="text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-lg space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={getNavLinkClass(item.path)}
            onClick={isMobile ? onClose : undefined}
          >
            <AJIcon 
              icon={item.icon} 
              variant={isActivePath(item.path) ? "navy" : "yellow"} 
              size="default"
              className="shrink-0"
            />
            
            {(!collapsed || isMobile) && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {item.description}
                    </p>
                  )}
                </div>
              </>
            )}
            
            {/* Tooltip for collapsed state */}
            {collapsed && !isMobile && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border rounded-lg shadow-elevated opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-lg border-t border-border",
        collapsed && !isMobile ? "text-center" : ""
      )}>
        {(!collapsed || isMobile) && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-poppins">
              Role: <span className="text-accent font-medium capitalize">{userRole}</span>
            </p>
          </div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div className={cn(
          "fixed top-0 left-0 h-full w-80 bg-card border-r border-border shadow-elevated z-50 transform transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {navContent}
          </div>
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className={cn(
      "hidden lg:flex flex-col h-screen bg-card border-r border-border shadow-card transition-all duration-300",
      collapsed ? "w-20" : "w-80"
    )}>
      {navContent}
    </div>
  );
}

// Mobile Navigation Toggle Button
export function MobileNavToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onClick}
      className="lg:hidden text-muted-foreground hover:text-foreground"
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
}