import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, 
  Building2, 
  Users, 
  FileText, 
  Camera, 
  MapPin, 
  Bell, 
  Settings, 
  Menu,
  X,
  Layers,
  Activity,
  Shield,
  Brain,
  LogOut,
  LucideIcon
} from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { AJIcon } from '@/components/ui/aj-icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string | number;
  requiresAuth?: boolean;
  mobileOnly?: boolean;
  description?: string;
}

interface MobileNavigationProps {
  className?: string;
  onNavigate?: () => void;
}

export function MobileNavigation({ className, onNavigate }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerHaptics, isNative } = useMobile();
  const { signOut } = useAuth();
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/',
      description: 'Overview and quick actions'
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: Building2,
      href: '/projects',
      description: 'Manage construction projects'
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      href: '/admin',
      description: 'System administration',
      requiresAuth: true
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      href: '/compliance',
      description: 'Safety and compliance tracking'
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: Brain,
      href: '/ai',
      description: 'Intelligent project assistance'
    },
    {
      id: 'scanner',
      label: 'Document Scanner',
      icon: Camera,
      href: '/scanner',
      description: 'Scan and manage documents',
      mobileOnly: true
    },
    {
      id: 'location',
      label: 'Location',
      icon: MapPin,
      href: '/location',
      description: 'Site tracking and navigation',
      mobileOnly: true
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      href: '/notifications',
      badge: 3,
      description: 'Alerts and updates'
    }
  ];

  const filteredItems = navigationItems.filter(item => {
    if (item.mobileOnly && !isNative) return false;
    return true;
  });

  const handleNavigation = async (href: string) => {
    await triggerHaptics();
    setIsOpen(false);
    onNavigate?.();
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "touch-target font-poppins relative",
            className
          )}
          onClick={() => triggerHaptics()}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 border-b bg-gradient-brand text-white">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-white font-poppins text-xl">
                  AJ Ryan
                </SheetTitle>
                <p className="text-white/80 text-sm font-poppins">
                  SmartWork Hub
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {filteredItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={({ isActive: linkIsActive }) => cn(
                    "flex items-center gap-3 p-4 rounded-lg transition-all duration-200 touch-target group",
                    linkIsActive || isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-md transition-colors",
                    isActive(item.href)
                      ? "bg-white/20"
                      : "bg-muted/50 group-hover:bg-muted"
                  )}>
                    <AJIcon 
                      icon={item.icon} 
                      variant={isActive(item.href) ? "white" : "navy"} 
                      size="sm" 
                      hover={false}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-poppins">
                        {item.label}
                      </span>
                      {item.badge && (
                        <Badge 
                          variant={isActive(item.href) ? "secondary" : "default"}
                          className="text-xs h-5 px-2"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className={cn(
                        "text-sm mt-1 font-poppins",
                        isActive(item.href)
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="w-full mb-3 hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-poppins">
                AJ Ryan Construction
              </p>
              <p className="text-xs text-muted-foreground font-poppins mt-1">
                Professional • Reliable • Innovative
              </p>
              {isNative && (
                <Badge variant="outline" className="mt-2 text-xs font-poppins">
                  Mobile App v1.0.0
                </Badge>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Bottom navigation for mobile-first experience
export function MobileBottomNavigation() {
  const { triggerHaptics, isNative } = useMobile();
  const location = useLocation();

  const bottomNavItems = [
    { icon: Home, href: '/', label: 'Home' },
    { icon: Building2, href: '/projects', label: 'Projects' },
    { icon: Camera, href: '/scanner', label: 'Scan' },
    { icon: Bell, href: '/notifications', label: 'Alerts', badge: 3 },
    { icon: Settings, href: '/settings', label: 'Settings' }
  ].filter(item => {
    // Show scanner only on mobile
    if (item.href === '/scanner' && !isNative) return false;
    return true;
  });

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-t border-border shadow-lg md:hidden">
      <nav className="flex items-center justify-around p-2">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => triggerHaptics()}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-lg touch-target transition-all duration-200",
              isActive(item.href)
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <div className="relative">
              <AJIcon 
                icon={item.icon} 
                variant={isActive(item.href) ? "navy" : "yellow"}
                size="sm" 
                hover={false}
              />
              {item.badge && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                >
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs font-poppins font-medium">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}