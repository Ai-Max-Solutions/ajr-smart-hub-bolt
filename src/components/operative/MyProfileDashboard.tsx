import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ProfilePictureUploader } from '@/components/ui/profile-picture-uploader';
import { 
  User, 
  Camera, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  Award, 
  Clock, 
  Calendar,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Settings,
  Bell,
  Star,
  Wrench,
  TrendingUp,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { DailySafetyChecklist } from './DailySafetyChecklist';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface QuickStat {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  trend?: string;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'timesheet' | 'rams' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'warning';
}

export const MyProfileDashboard: React.FC = () => {
  const { profile, loading, updateProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>('');
  const queryClient = useQueryClient();

  // Set dynamic greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Update avatar URL when profile changes
  useEffect(() => {
    if (profile?.avatar_url) {
      setCurrentAvatarUrl(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  // Fetch CSCS card data
  const { data: cscsCard } = useQuery({
    queryKey: ['cscs-card', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('cscs_cards')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch emergency contact
  const { data: emergencyContact } = useQuery({
    queryKey: ['emergency-contact', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch user work types
  const { data: workTypes } = useQuery({
    queryKey: ['work-types', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('user_work_types')
        .select('work_type')
        .eq('user_id', profile.id);
      if (error) throw error;
      return data?.map(wt => wt.work_type) || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch current project
  const { data: currentProject } = useQuery({
    queryKey: ['current-project', profile?.currentproject],
    queryFn: async () => {
      if (!profile?.currentproject) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('name, code, client')
        .eq('id', profile.currentproject)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.currentproject,
  });

  // Calculate profile completeness
  const profileCompleteness = React.useMemo(() => {
    if (!profile) return 0;
    const fields = [
      profile.firstname,
      profile.lastname,
      profile.phone,
      emergencyContact?.name,
      emergencyContact?.phone,
      cscsCard?.card_number,
      workTypes?.length > 0,
      currentAvatarUrl // Include avatar in completeness calculation
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [profile, emergencyContact, cscsCard, workTypes, currentAvatarUrl]);

  // Generate quick stats
  const quickStats: QuickStat[] = [
    {
      label: 'CSCS Status',
      value: cscsCard ? 'Valid' : 'Missing',
      icon: Shield,
      color: cscsCard ? '#22c55e' : '#ef4444'
    },
    {
      label: 'Emergency Contact',
      value: emergencyContact ? 'Set' : 'Missing',
      icon: Phone,
      color: emergencyContact ? '#22c55e' : '#f59e0b'
    },
    {
      label: 'Active Project',
      value: currentProject?.code || 'Unassigned',
      icon: Briefcase,
      color: currentProject ? '#3b82f6' : '#6b7280'
    },
    {
      label: 'Work Types',
      value: workTypes?.length?.toString() || '0',
      icon: Wrench,
      color: workTypes?.length ? '#8b5cf6' : '#6b7280'
    }
  ];

  // Mock recent activities (in real app, fetch from various tables)
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'timesheet',
      title: 'Timesheet Submitted',
      description: 'Week commencing 13/01/2025',
      timestamp: new Date().toISOString(),
      status: 'completed'
    },
    {
      id: '2',
      type: 'rams',
      title: 'RAMS Document Signed',
      description: 'Site Safety Protocol v2.1',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed'
    },
    {
      id: '3',
      type: 'notification',
      title: 'CSCS Card Expiry Reminder',
      description: 'Expires in 30 days',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      status: 'warning'
    }
  ];

  // Pie chart data for profile completeness
  const completenessData = [
    { name: 'Completed', value: profileCompleteness, fill: 'hsl(var(--aj-yellow))' },
    { name: 'Remaining', value: 100 - profileCompleteness, fill: 'hsl(var(--muted))' }
  ];

  const chartConfig = {
    completed: { label: 'Completed', color: 'hsl(var(--aj-yellow))' },
    remaining: { label: 'Remaining', color: 'hsl(var(--muted))' }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setCurrentAvatarUrl(newAvatarUrl);
    // Refresh the profile data to get the latest avatar URL
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-background via-accent/5 to-background rounded-lg p-6 border border-border/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-accent/20">
                <AvatarImage src={currentAvatarUrl} />
                <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                  {profile.firstname?.[0] || ''}{profile.lastname?.[0] || ''}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {greeting}, {profile.firstname || 'User'}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-accent/10 text-accent">
                  {profile.role}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {profile.employmentstatus}
                </span>
              </div>
            </div>
          </div>
          
          {/* Profile Completeness Ring */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <ChartContainer
                config={chartConfig}
                className="aspect-square w-16 h-16"
              >
                <PieChart>
                  <Pie
                    data={completenessData}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={28}
                    startAngle={90}
                    endAngle={450}
                    dataKey="value"
                  >
                    {completenessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium">{profileCompleteness}%</span>
              </div>
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">Profile Complete</p>
              <p className="text-muted-foreground">
                {profileCompleteness < 80 ? 'Keep going!' : 'Well done!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon 
                    className="h-5 w-5" 
                    style={{ color: stat.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                  <p className="font-semibold text-foreground truncate">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Profile Info + Avatar Uploader */}
        <div className="space-y-6">
          
          {/* Profile Picture Uploader Card */}
          <ProfilePictureUploader
            currentAvatarUrl={currentAvatarUrl}
            userName={profile.fullname || `${profile.firstname} ${profile.lastname}`.trim()}
            userRole={profile.role}
            userSkills={workTypes}
            cscsLevel={cscsCard?.card_color}
            onAvatarUpdate={handleAvatarUpdate}
          />

          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{profile.fullname || 'Not provided'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.auth_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.phone || 'Not provided'}</span>
                  {profile.phone && (
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-auto">
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setIsEditing(true)}
              >
                Edit Details
              </Button>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emergencyContact ? (
                <div className="space-y-2">
                  <p className="font-medium">{emergencyContact.name}</p>
                  <p className="text-sm text-muted-foreground">{emergencyContact.relationship}</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{emergencyContact.phone}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle className="h-8 w-8 mx-auto text-warning mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No emergency contact set</p>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Activity & Stats */}
        <div className="space-y-6">
          
          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-full ${
                      activity.status === 'completed' ? 'bg-success/20 text-success' :
                      activity.status === 'warning' ? 'bg-warning/20 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {activity.type === 'timesheet' && <Calendar className="h-4 w-4" />}
                      {activity.type === 'rams' && <Shield className="h-4 w-4" />}
                      {activity.type === 'notification' && <Bell className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Work Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Work Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workTypes && workTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {workTypes.map((type, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Wrench className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No work types assigned</p>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Work Types
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Certifications & Tools */}
        <div className="space-y-6">
          
          {/* CSCS Card Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                CSCS Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cscsCard ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant="default" className="bg-success">Valid</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Card Type</span>
                    <span className="text-sm font-medium">{cscsCard.card_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expires</span>
                    <span className="text-sm font-medium">
                      {cscsCard.expiry_date ? format(new Date(cscsCard.expiry_date), 'MMM d, yyyy') : 'N/A'}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    View Details
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle className="h-8 w-8 mx-auto text-warning mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No CSCS card uploaded</p>
                  <Button size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload CSCS Card
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Project */}
          {currentProject && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Current Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{currentProject.name}</p>
                  <p className="text-sm text-muted-foreground">Code: {currentProject.code}</p>
                  <p className="text-sm text-muted-foreground">Client: {currentProject.client}</p>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    View Project <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Submit Timesheet
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Safety Checklist - Full Width */}
      <div className="mt-6">
        <DailySafetyChecklist />
      </div>
    </div>
  );
};
