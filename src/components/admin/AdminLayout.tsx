
import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-aj-yellow/5 rounded-full blur-xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-aj-blue-accent/5 rounded-full blur-xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-success/5 rounded-full blur-xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileMenu}
          className="bg-card/90 backdrop-blur-md border border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 hover:scale-105 rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <div className="fixed left-0 top-0 h-full z-40">
          <AdminSidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        </div>
        
        {/* Desktop Toggle Button - Hidden when sidebar is visible */}
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 bg-card/90 backdrop-blur-md border border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 hover:scale-105 rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Enhanced Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
            onClick={toggleMobileMenu}
          />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] transform transition-transform duration-300 ease-out">
            <AdminSidebar />
          </div>
        </div>
      )}

      {/* Main Content with enhanced styling */}
      <main className={`
        relative z-10
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-80'}
        p-4 md:p-8
        min-h-screen
      `}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
