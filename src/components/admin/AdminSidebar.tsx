
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTheme } from 'next-themes';
import { 
  Gauge, 
  Settings, 
  Users, 
  FileText, 
  LogOut, 
  Sun, 
  Moon, 
  Wrench,
  Building
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  isCollapsed = false 
}) => {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Dashboard',
      icon: Gauge,
      path: '/admin',
      wittyHint: 'Main control room—all gauges here!'
    },
    {
      title: 'Projects',
      icon: Building,
      path: '/projects',
      wittyHint: 'Build & Flow – Foundation central!'
    },
    {
      title: 'User Management',
      icon: Users,
      path: '/admin/users',
      wittyHint: 'Crew roster—no leaks in personnel!'
    },
    {
      title: 'Audit Logs',
      icon: FileText,
      path: '/admin/audit',
      wittyHint: 'Flow history—what\'s been through the pipes?'
    },
    {
      title: 'System Settings',
      icon: Settings,
      path: '/admin/settings',
      wittyHint: 'Valve controls—twist with care!'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`
      h-full bg-gradient-to-b from-aj-navy-deep to-aj-navy-light
      border-r border-border/50 backdrop-blur-sm
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-80'}
    `}>
      {/* Logo Section */}
      <div className="p-6 border-b border-border/20">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-aj-yellow flex items-center justify-center">
            <Wrench className="w-5 h-5 text-aj-navy-deep" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-white">AJ Ryan</h1>
              <p className="text-sm text-white/70">Smart Hub</p>
            </div>
          )}
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                group flex items-center gap-3 px-3 py-3 rounded-xl
                transition-all duration-200 hover:bg-white/10
                ${active 
                  ? 'bg-aj-yellow/20 text-aj-yellow border border-aj-yellow/30' 
                  : 'text-white/80 hover:text-white'
                }
              `}
              title={isCollapsed ? item.wittyHint : undefined}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-aj-yellow' : ''}`} />
              {!isCollapsed && (
                <div className="flex-1">
                  <span className="font-medium">{item.title}</span>
                  <p className="text-xs text-white/60 mt-0.5">{item.wittyHint}</p>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section - Admin Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/20">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full mb-3 text-white/80 hover:text-white hover:bg-white/10"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 mr-2" />
          ) : (
            <Moon className="w-4 h-4 mr-2" />
          )}
          {!isCollapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
        </Button>

        {/* Admin Profile */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-3">
          <Avatar className="w-10 h-10 ring-2 ring-aj-yellow/30">
            <AvatarImage src={profile?.avatar_url} alt={profile?.firstname || 'Admin'} />
            <AvatarFallback className="bg-aj-yellow text-aj-navy-deep font-bold">
              {(profile?.firstname || profile?.fullname || user?.email || 'A').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {profile?.firstname || profile?.fullname || 'Admin'}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-aj-yellow/20 text-aj-yellow">
                  Master Plumber
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full text-white/80 hover:text-white hover:bg-white/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {!isCollapsed && 'Flush & Logout!'}
        </Button>
      </div>
    </div>
  );
};
