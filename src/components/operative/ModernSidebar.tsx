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
  LogOut,
  Bell,
  Receipt,
  GraduationCap,
  BookOpen,
  UserCheck,
  FileSignature,
  Shield,
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
  Settings,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

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
  const { profile } = useUserProfile();
  const [complianceExpanded, setComplianceExpanded] = useState(true);
  const [workExpanded, setWorkExpanded] = useState(true);
  const [adminExpanded, setAdminExpanded] = useState(true);

  // Get user role for conditional rendering
  const userRole = profile?.role?.toLowerCase() || 'operative';
  const isAdmin = ['admin', 'dpo'].includes(userRole);

  const mainNavItems = [
    {
      title: 'Dashboard',
      path: '/operative',
      icon: Home,
      active: location.pathname === '/operative'
    },
    {
      title: 'Site Notices',
      path: '/operative/notices',
      icon: Bell,
      active: location.pathname === '/operative/notices'
    }
  ];

  const complianceItems = [
    {
      title: 'Qualifications',
      path: '/operative/qualifications',
      icon: GraduationCap,
      active: location.pathname === '/operative/qualifications'
    },
    {
      title: 'Training',
      path: '/operative/training',
      icon: BookOpen,
      active: location.pathname === '/operative/training'
    },
    {
      title: 'Inductions',
      path: '/operative/inductions',
      icon: UserCheck,
      active: location.pathname === '/operative/inductions'
    },
    {
      title: 'Signatures',
      path: '/operative/signatures',
      icon: FileSignature,
      active: location.pathname === '/operative/signatures'
    }
  ];

  const workItems = [
    {
      title: 'Timesheets',
      path: '/operative/timesheets',
      icon: Clock,
      active: location.pathname === '/operative/timesheets'
    },
    {
      title: 'Payslips',
      path: '/operative/payslips',
      icon: Receipt,
      active: location.pathname === '/operative/payslips'
    },
    {
      title: 'Documents',
      path: '/operative/documents',
      icon: FileText,
      active: location.pathname === '/operative/documents'
    }
  ];

  const profileItems = [
    {
      title: 'My Profile',
      path: '/operative/profile',
      icon: User,
      active: location.pathname === '/operative/profile'
    },
    {
      title: 'My Data',
      path: '/operative/my-data',
      icon: Shield,
      active: location.pathname === '/operative/my-data'
    },
    {
      title: 'Data Retention',
      path: '/operative/data-retention',
      icon: Shield,
      active: location.pathname === '/operative/data-retention'
    }
  ];

  const adminItems = [
    {
      title: 'Admin Dashboard',
      path: '/admin',
      icon: Settings,
      active: location.pathname === '/admin'
    },
    {
      title: 'User Management',
      path: '/admin/users',
      icon: Users,
      active: location.pathname === '/admin/users'
    },
    {
      title: 'System Reports',
      path: '/admin/reports',
      icon: FileText,
      active: location.pathname === '/admin/reports'
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFCC00] rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[#0B0E1A]" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-white">A&J Ryan</span>
            )}
          </div>
          {!isMobile && onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-[#E1E1E8] hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[#E1E1E8] hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        {mainNavItems.map((item) => {
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

        {!collapsed && (
          <>
            {/* Compliance Section */}
            <div className="mt-6">
              <button
                onClick={() => setComplianceExpanded(!complianceExpanded)}
                className="w-full flex items-center justify-between text-sm font-medium text-[#C7C9D9] mb-2 px-3 py-1 hover:text-white transition-colors"
              >
                <span>Compliance & Training</span>
                {complianceExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {complianceExpanded && complianceItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile && onClose) onClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 pl-6 rounded-lg transition-colors",
                      item.active 
                        ? "bg-[#FFCC00]/10 border border-[#FFCC00]/20 text-[#FFCC00]" 
                        : "hover:bg-white/5 text-[#E1E1E8]"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{item.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Work Section */}
            <div className="mt-4">
              <button
                onClick={() => setWorkExpanded(!workExpanded)}
                className="w-full flex items-center justify-between text-sm font-medium text-[#C7C9D9] mb-2 px-3 py-1 hover:text-white transition-colors"
              >
                <span>Work & Pay</span>
                {workExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {workExpanded && workItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile && onClose) onClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 pl-6 rounded-lg transition-colors",
                      item.active 
                        ? "bg-[#FFCC00]/10 border border-[#FFCC00]/20 text-[#FFCC00]" 
                        : "hover:bg-white/5 text-[#E1E1E8]"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{item.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Admin Section - Only show for admin users */}
            {isAdmin && (
              <div className="mt-4">
                <button
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  className="w-full flex items-center justify-between text-sm font-medium text-[#C7C9D9] mb-2 px-3 py-1 hover:text-white transition-colors"
                >
                  <span>🔧 Admin Controls</span>
                  {adminExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {adminExpanded && adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile && onClose) onClose();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 pl-6 rounded-lg transition-colors",
                        item.active 
                          ? "bg-[#FFCC00]/10 border border-[#FFCC00]/20 text-[#FFCC00]" 
                          : "hover:bg-white/5 text-[#E1E1E8]"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Profile Section */}
            <div className="mt-4">
              <div className="text-sm font-medium text-[#C7C9D9] mb-2 px-3 py-1">
                Profile & Data
              </div>
              {profileItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile && onClose) onClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 pl-6 rounded-lg transition-colors",
                      item.active 
                        ? "bg-[#FFCC00]/10 border border-[#FFCC00]/20 text-[#FFCC00]" 
                        : "hover:bg-white/5 text-[#E1E1E8]"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Collapsed state - show all items as icons */}
        {collapsed && (
          <div className="space-y-1 mt-4">
            {[
              ...complianceItems, 
              ...workItems, 
              ...profileItems,
              ...(isAdmin ? adminItems : [])
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile && onClose) onClose();
                  }}
                  className={cn(
                    "w-full flex items-center justify-center p-3 rounded-lg transition-colors",
                    item.active 
                      ? "bg-[#FFCC00]/10 border border-[#FFCC00]/20 text-[#FFCC00]" 
                      : "hover:bg-white/5 text-[#E1E1E8]"
                  )}
                  title={item.title}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        )}
        
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
            🛠️ {userRole.charAt(0).toUpperCase() + userRole.slice(1)} - {isAdmin ? 'Master Controls!' : 'Powers activated!'}
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
