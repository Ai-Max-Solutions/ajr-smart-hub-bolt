
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  PoundSterling, 
  Clock, 
  FileText, 
  User, 
  Building2, 
  ArrowRight,
  Shield,
  BookOpen,
  Bell,
  Database,
  Search,
  TrendingUp,
  AlertTriangle,
  Menu,
  X,
  Sparkles,
  Coffee,
  Moon,
  Sun
} from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Set dynamic greeting with emoji
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
      setGreetingEmoji('☕');
    } else if (hour < 17) {
      setGreeting('Good afternoon');
      setGreetingEmoji('☀️');
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
          .select('name, phone')
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
              .select('name, phone')
              .single();
            
            if (insertError) {
              console.error('Error creating user record:', insertError);
              setUserData({
                firstname: session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'User',
                lastname: session.user.user_metadata?.last_name || ''
              });
            } else {
              setUserData({
                firstname: insertData?.name?.split(' ')[0] || 'User',
                lastname: insertData?.name?.split(' ').slice(1).join(' ') || ''
              });
            }
          }
        } else {
          console.log('Setting userData:', data);
          setUserData({
            firstname: data?.name?.split(' ')[0] || 'User',
            lastname: data?.name?.split(' ').slice(1).join(' ') || ''
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

  const safetyActions = [
    {
      title: 'Site Notices',
      description: 'Stay sharp—don\'t get caught out!',
      icon: Bell,
      action: () => navigate('/operative/notices'),
      highlight: true,
      color: 'bg-red-500/10 border-red-500/20'
    },
    {
      title: 'My Inductions',
      description: 'Knowledge is power—get inducted!',
      icon: FileText,
      action: () => navigate('/operative/inductions'),
      highlight: true,
      color: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'My Qualifications',
      description: 'Keep your tickets fresh!',
      icon: Shield,
      action: () => navigate('/operative/qualifications'),
      color: 'bg-green-500/10 border-green-500/20'
    },
    {
      title: 'My Training',
      description: 'Level up your skills!',
      icon: BookOpen,
      action: () => navigate('/operative/training'),
      color: 'bg-purple-500/10 border-purple-500/20'
    }
  ];

  const paperworkActions = [
    {
      title: 'My Payslips',
      description: 'Ka-ching! Check your earnings',
      icon: PoundSterling,
      action: () => navigate('/operative/payslips'),
      color: 'bg-yellow-500/10 border-yellow-500/20'
    },
    {
      title: 'My Signatures',
      description: 'Signed, sealed, delivered!',
      icon: FileText,
      action: () => navigate('/operative/signatures'),
      color: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      title: 'My Data',
      description: 'Your digital footprint matters',
      icon: Database,
      action: () => navigate('/operative/data-retention'),
      color: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'My Timesheets',
      description: 'Time is money—track it well!',
      icon: Clock,
      action: () => navigate('/operative/timesheets'),
      color: 'bg-orange-500/10 border-orange-500/20'
    }
  ];

  const personalActions = [
    {
      title: 'My Profile',
      description: 'Update your deets!',
      icon: User,
      action: () => navigate('/operative/profile'),
      color: 'bg-pink-500/10 border-pink-500/20'
    }
  ];

  const stats = [
    { 
      label: 'This Week Status', 
      value: 'Approved', 
      color: 'text-green-400', 
      bgColor: 'bg-green-500/10',
      icon: '✅',
      trend: '+2 hrs vs last week'
    },
    { 
      label: 'YTD Earnings', 
      value: '£26,420', 
      color: 'text-yellow-400', 
      bgColor: 'bg-yellow-500/10',
      icon: '💰',
      trend: 'Ka-ching—up 5%!'
    },
    { 
      label: 'Current Project', 
      value: 'Woodberry Down', 
      color: 'text-blue-400', 
      bgColor: 'bg-blue-500/10',
      icon: '🏗️',
      trend: '3 quals expiring soon'
    },
    { 
      label: 'Qualification Status', 
      value: '3 Valid, 1 Expiring', 
      color: 'text-orange-400', 
      bgColor: 'bg-orange-500/10',
      icon: '🎓',
      trend: 'Renew by March 15th'
    }
  ];

  const recentActivities = [
    {
      id: '1',
      title: 'Week ending 21 July 2025',
      description: 'Timesheet approved by Jane—nice one!',
      status: 'Paid',
      statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      title: 'Week ending 14 July 2025',
      description: 'Exported to payroll—sorted!',
      status: 'Exported',
      statusColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      timestamp: '1 day ago'
    },
    {
      id: '3',
      title: 'CSCS Card Verification',
      description: 'Card verified and updated—top notch!',
      status: 'Valid',
      statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
      timestamp: '3 days ago'
    }
  ];

  const filteredActivities = recentActivities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="min-h-screen bg-[#0B0E1A] text-[#E1E1E8]">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0B0E1A] to-[#1a1f2e] transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 border-r border-white/10`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FFCC00] rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#0B0E1A]" />
              </div>
              <span className="text-xl font-bold text-white">AJ Ryan</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="bg-[#FFCC00]/10 border border-[#FFCC00]/20 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#FFCC00] rounded flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-[#0B0E1A]" />
                </div>
                <span className="text-[#FFCC00] font-medium">Dashboard</span>
              </div>
            </div>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
              <User className="h-5 w-5 text-[#4DA6FF]" />
              <span className="text-[#E1E1E8]">My Portal</span>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#4DA6FF]" />
                <span className="text-[#E1E1E8]">AI Assistant</span>
                <span className="text-xs bg-[#4DA6FF]/20 text-[#4DA6FF] px-2 py-1 rounded-full">Ask me anything!</span>
              </div>
            </button>
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-white/10 space-y-3">
            <Badge className="bg-[#4DA6FF]/20 text-[#4DA6FF] border-[#4DA6FF]/30">
              🛠️ {user?.role || 'Operative'}
            </Badge>
            <button className="w-full flex items-center gap-2 p-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <span>Sign Out</span>
              <span className="text-xs opacity-60">See ya—stay safe!</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#1E2435]/95 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFCC00] rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-[#0B0E1A]" />
            </div>
            <span className="text-lg font-bold text-white">AJ Ryan</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen bg-[#141A2B]">
        <div className="p-6 lg:p-8 space-y-8">
          {/* Personal Header Card */}
          <Card className="bg-[#1E2435] border-white/10 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFCC00] to-[#4DA6FF] p-1">
                      <div className="w-full h-full rounded-full bg-[#1E2435] flex items-center justify-center">
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
                      {greeting}, {userData?.firstname || 'Mate'}!
                    </h1>
                    <p className="text-[#C7C9D9] mt-1">
                      Ready to conquer Woodberry Down? Let's smash it! 💪
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-[#2A3350] px-4 py-2 rounded-lg border border-[#4DA6FF]/30">
                    <span className="text-[#4DA6FF] font-medium">Authenticated ✓</span>
                  </div>
                  <div className="hidden lg:block text-sm text-[#C7C9D9] bg-[#4DA6FF]/10 px-3 py-2 rounded-lg">
                    💡 Fancy a qual boost? Check training!
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-[#1C2234] border-white/10 hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <span className="text-lg">{stat.icon}</span>
                    </div>
                    <TrendingUp className="h-4 w-4 text-[#4DA6FF] opacity-60" />
                  </div>
                  <div>
                    <p className="text-sm text-[#C7C9D9] mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-[#A1A6B3] mt-1">{stat.trend}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Quick Actions – Let's Crush the Day!</h2>
              <span className="text-2xl">⚡</span>
            </div>

            {/* Safety & Sharp */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#FFCC00] flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Stay Safe & Sharp
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {safetyActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Card 
                      key={index} 
                      className={`bg-[#1E2435] border-white/10 hover:scale-105 transition-all duration-200 cursor-pointer group ${action.color}`}
                      onClick={action.action}
                    >
                      <CardContent className="p-5">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 bg-[#FFCC00] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Icon className="w-6 h-6 text-[#0B0E1A]" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                            <p className="text-sm text-[#C7C9D9] mb-4">{action.description}</p>
                            <Button className="w-full bg-[#FFCC00] text-[#0B0E1A] hover:bg-[#FFCC00]/90 font-medium">
                              Open
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Handle the Paperwork */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#4DA6FF] flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Handle the Paperwork
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {paperworkActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Card 
                      key={index} 
                      className={`bg-[#1E2435] border-white/10 hover:scale-105 transition-all duration-200 cursor-pointer group ${action.color}`}
                      onClick={action.action}
                    >
                      <CardContent className="p-5">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 bg-[#FFCC00] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Icon className="w-6 h-6 text-[#0B0E1A]" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                            <p className="text-sm text-[#C7C9D9] mb-4">{action.description}</p>
                            <Button className="w-full bg-[#FFCC00] text-[#0B0E1A] hover:bg-[#FFCC00]/90 font-medium">
                              Open
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Update Your Deets */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#E1E1E8] flex items-center gap-2">
                <User className="h-5 w-5" />
                Update Your Deets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {personalActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Card 
                      key={index} 
                      className={`bg-[#1E2435] border-white/10 hover:scale-105 transition-all duration-200 cursor-pointer group ${action.color}`}
                      onClick={action.action}
                    >
                      <CardContent className="p-5">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 bg-[#FFCC00] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Icon className="w-6 h-6 text-[#0B0E1A]" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                            <p className="text-sm text-[#C7C9D9] mb-4">{action.description}</p>
                            <Button className="w-full bg-[#FFCC00] text-[#0B0E1A] hover:bg-[#FFCC00]/90 font-medium">
                              Open
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <Card className="bg-[#1E2435] border-white/10">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  Recent Activity – What's the Craic?
                </CardTitle>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A1A6B3]" />
                  <Input
                    placeholder="Search activity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#2A3350] border-white/20 text-[#E1E1E8] placeholder:text-[#A1A6B3]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Coffee className="h-12 w-12 mx-auto text-[#A1A6B3] mb-4" />
                  <p className="text-[#A1A6B3]">
                    {searchTerm ? 'No matching activity found' : 'All quiet on the western front—time for a brew? ☕'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map((activity) => (
                    <div key={activity.id} className="bg-[#2A3350] rounded-lg p-4 hover:bg-[#2A3350]/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">{activity.title}</h4>
                            <span className="text-sm text-[#A1A6B3]">{activity.timestamp}</span>
                          </div>
                          <p className="text-sm text-[#A1A6B3] mt-1">{activity.description}</p>
                        </div>
                        <Badge className={`ml-4 ${activity.statusColor}`}>
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
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
