import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Sparkles, Menu } from 'lucide-react';

// Import new components
import { ModernSidebar } from '@/components/operative/ModernSidebar';
import { StatsCard } from '@/components/operative/StatsCard';
import { QuickActionsSection } from '@/components/operative/QuickActionsSection';
import { ActivityFeed } from '@/components/operative/ActivityFeed';

// Import existing route components
import MyPayslips from '@/components/operative/MyPayslips';
import MyQualifications from '@/components/compliance/MyQualifications';
import MyTraining from '@/components/training/MyTraining';
import { SiteNotices } from '@/components/notices/SiteNotices';
import MyInductions from '@/components/inductions/MyInductions';
import MySignatures from '@/components/signatures/MySignatures';
import MyDataRetention from '@/components/retention/MyDataRetention';
import PrivacyDashboard from '@/components/security/PrivacyDashboard';
import MyTimesheets from '@/components/operative/MyTimesheets';
import { MyProfile } from '@/components/operative/MyProfile';

const OperativeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<{ firstname?: string; lastname?: string; avatar_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [greetingEmoji, setGreetingEmoji] = useState('👋');

  // ✅ Role guard: Operative/Supervisor portal access
  useEffect(() => {
    const userRole = user?.role?.trim().toLowerCase();
    if (user && !['operative', 'supervisor'].includes(userRole)) {
      toast({
        title: "Wrong tools, mate!",
        description: "You're in boots not brogues — try your proper dashboard!",
        variant: "destructive",
      });
      const rolePathMap = {
        'pm': '/projects',
        'admin': '/admin',
        'director': '/director',
        'manager': '/projects'
      };
      const redirectPath = rolePathMap[userRole] || '/operative';
      navigate(redirectPath);
    }
  }, [user, navigate, toast]);

  // Set dynamic greeting with emoji and personality
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
      setGreetingEmoji('☕');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
      setGreetingEmoji('🌞');
    } else {
      setGreeting('Good evening');
      setGreetingEmoji('🌙');
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      console.log('Fetching user data for:', session.user.id);
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, phone, avatar_url, firstname, lastname')
          .eq('supabase_auth_id', session.user.id)
          .single();

        console.log('Database query result:', { data, error });

        if (error) {
          console.error('Error fetching user data:', error);
          if (error.code === 'PGRST116') {
            console.log('User not found in database, creating basic record...');
            const { data: insertData, error: insertError } = await supabase
              .from('users')
              .insert({
                supabase_auth_id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                role: 'Operative'
              })
              .select('name, phone, avatar_url, firstname, lastname')
              .single();
            
            if (insertError) {
              console.error('Error creating user record:', insertError);
              setUserData({
                firstname: session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'User',
                lastname: session.user.user_metadata?.last_name || ''
              });
            } else {
              setUserData({
                firstname: insertData?.firstname || insertData?.name?.split(' ')[0] || 'User',
                lastname: insertData?.lastname || insertData?.name?.split(' ').slice(1).join(' ') || '',
                avatar_url: insertData?.avatar_url
              });
            }
          }
        } else {
          console.log('Setting userData:', data);
          setUserData({
            firstname: data?.firstname || data?.name?.split(' ')[0] || 'User',
            lastname: data?.lastname || data?.name?.split(' ').slice(1).join(' ') || '',
            avatar_url: data?.avatar_url
          });
        }
      } catch (err) {
        console.error('Error:', err);
        setUserData({
          firstname: session.user.email?.split('@')[0] || 'User',
          lastname: ''
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session, location.pathname]);

  const stats = [
    { 
      label: 'Week Status', 
      value: 'Approved', 
      color: 'text-green-400', 
      bgColor: 'bg-green-500/10',
      icon: '✅',
      trend: '+2 hrs vs last week',
      visual: 'bar' as const
    },
    { 
      label: 'YTD Earnings', 
      value: '£26,420', 
      color: 'text-yellow-400', 
      bgColor: 'bg-yellow-500/10',
      icon: '💰',
      trend: 'Up 5%—ka-ching, ' + (userData?.firstname || 'mate') + '!',
      visual: 'sparkline' as const
    },
    { 
      label: 'Current Project', 
      value: 'Woodberry Down', 
      color: 'text-blue-400', 
      bgColor: 'bg-blue-500/10',
      icon: '🏗️',
      trend: '75% complete—nearly there!',
      visual: 'progress' as const
    },
    { 
      label: 'Qualification Status', 
      value: '3 Valid, 1 Expiring', 
      color: 'text-orange-400', 
      bgColor: 'bg-orange-500/10',
      icon: '🎓',
      trend: 'One expiring—sort it before the boss notices!',
      visual: 'pie' as const
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <Sparkles className="h-12 w-12 mx-auto text-[#FFCC00] mb-4" />
          </div>
          <p className="text-[#E1E1E8]">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] text-[#E1E1E8] flex">
      {/* Modern Sidebar */}
      <ModernSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobile={false}
      />
      
      {/* Mobile Sidebar */}
      <ModernSidebar 
        collapsed={false}
        onToggle={() => setMobileNavOpen(!mobileNavOpen)}
        isMobile={true}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#1E2435]/95 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(true)}
            className="text-white hover:bg-white/10"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">A&J Ryan</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen bg-[#141A2B] lg:ml-0">
        <div className="p-6 lg:p-8 space-y-8 mt-16 lg:mt-0">
          {/* Personal Header Card */}
          <Card className="bg-[#1E2435] border-white/10 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFCC00] to-[#4DA6FF] p-1">
                      <div className="w-full h-full rounded-full bg-[#1E2435] flex items-center justify-center overflow-hidden">
                        {userData?.avatar_url ? (
                          <img 
                            src={userData.avatar_url} 
                            alt={`${userData.firstname}'s profile`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-[#FFCC00]" />
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FFCC00] rounded-full flex items-center justify-center">
                      <span className="text-sm">{greetingEmoji}</span>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">
                      {greeting}, {userData?.firstname || 'mate'}!
                    </h1>
                    <p className="text-[#C7C9D9] mt-1">
                      Woodberry awaits—let's make it legendary! 💪
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-[#2A3350] px-4 py-2 rounded-lg border border-[#4DA6FF]/30">
                    <span className="text-[#4DA6FF] font-medium">Authenticated ✓</span>
                  </div>
                  <div className="hidden lg:block text-sm text-[#C7C9D9] bg-[#4DA6FF]/10 px-3 py-2 rounded-lg">
                    💡 Fancy a qual refresh? Training's one click away!
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats with Visual Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatsCard
                key={index}
                label={stat.label}
                value={stat.value}
                color={stat.color}
                bgColor={stat.bgColor}
                icon={stat.icon}
                trend={stat.trend}
                visual={stat.visual}
              />
            ))}
          </div>

          {/* Quick Actions Section */}
          <QuickActionsSection userName={userData?.firstname || 'mate'} />

          {/* Recent Activity Feed */}
          <ActivityFeed userName={userData?.firstname || 'mate'} />
        </div>
      </div>
    </div>
  );
};

const OperativePortal = () => {
  return (
    <Routes>
      <Route path="/" element={<OperativeDashboard />} />
      <Route path="/notices" element={<SiteNotices />} />
      <Route path="/payslips" element={<MyPayslips />} />
      <Route path="/qualifications" element={<MyQualifications />} />
      <Route path="/training" element={<MyTraining />} />
      <Route path="/inductions" element={<MyInductions />} />
      <Route path="/signatures" element={<MySignatures />} />
      <Route path="/data-retention" element={<MyDataRetention />} />
      <Route path="/my-data" element={<PrivacyDashboard userId="current-user" />} />
      <Route path="/timesheets" element={<MyTimesheets />} />
      <Route path="/profile" element={<MyProfile />} />
      <Route path="/documents" element={<div className="p-8 text-center text-muted-foreground">Documents coming soon...</div>} />
    </Routes>
  );
};

export default OperativePortal;
