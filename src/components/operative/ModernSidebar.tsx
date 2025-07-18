
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  User, 
  Sparkles, 
  Menu, 
  X,
  Home,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ModernSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const ModernSidebar = ({ 
  collapsed, 
  onToggle, 
  isMobile = false, 
  isOpen = false, 
  onClose 
}: ModernSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    {
      title: 'Dashboard',
      path: '/operative',
      icon: Home,
      active: location.pathname === '/operative'
    },
    {
      title: 'My Portal',
      path: '/operative',
      icon: User,
      active: location.pathname.startsWith('/operative')
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0B0E1A] to-[#1a1f2e] border-r border-white/10">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FFCC00] rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-[#0B0E1A]" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-white">A&J Ryan</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile && onClose) onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                item.active 
                  ? "bg-[#FFCC00]/10 border border-[#FFCC00]/20 text-[#FFCC00]" 
                  : "hover:bg-white/5 text-[#E1E1E8]"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </button>
          );
        })}
        
        <Separator className="my-4 bg-white/10" />
        
        <button 
          onClick={() => navigate('/ai-assistant')}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-[#E1E1E8]"
        >
          <Sparkles className="h-5 w-5 text-[#4DA6FF] shrink-0" />
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <span>AI Assistant</span>
              <Badge className="bg-[#4DA6FF]/20 text-[#4DA6FF] border-[#4DA6FF]/30 text-xs px-2 py-1 whitespace-nowrap">
                Ask me!
              </Badge>
            </div>
          )}
        </button>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {!collapsed && (
          <Badge className="bg-[#4DA6FF]/20 text-[#4DA6FF] border-[#4DA6FF]/30 w-full justify-center">
            🛠️ {user?.role || 'Operative'} - Powers activated!
          </Badge>
        )}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4 mr-2 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className={cn(
      "hidden lg:block transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      {sidebarContent}
    </div>
  );
};
