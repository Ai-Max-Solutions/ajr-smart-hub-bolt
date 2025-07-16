import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  LogOut,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MyTrainingDocuments from '@/components/contractor/MyTrainingDocuments';
import RAMSManager from '@/components/contractor/RAMSManager';
import { EnhancedRAMSCompliance } from '@/components/contractor/EnhancedRAMSCompliance';
import { ContractorDeliveryPortal } from '@/components/contractor/ContractorDeliveryPortal';
import { Separator } from '@/components/ui/separator';

interface ContractorProfile {
  id: string;
  auth_user_id: string;
  company_id: string;
  email: string;
  first_name: string;
  last_name: string;
  job_role: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  vehicle_registration?: string;
  vehicle_type?: string;
  company: {
    company_name: string;
    primary_contact_email: string;
    primary_contact_phone: string;
  };
}

interface DeliveryRequest {
  id: string;
  request_number: string;
  project_name: string;
  delivery_date: string;
  time_slot: string;
  status: 'pending' | 'approved' | 'rejected';
  items: any[];
  total_items: number;
  created_at: string;
  admin_notes?: string;
}

const ContractorDashboard = () => {
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadContractorData();
    }
  }, [user]);

  const loadContractorData = async () => {
    try {
      setLoading(true);
      
      // Mock contractor profile data for now
      const mockProfile: ContractorProfile = {
        id: 'mock-id',
        auth_user_id: user?.id || '',
        company_id: 'mock-company-id',
        email: user?.email || '',
        first_name: 'John',
        last_name: 'Doe',
        job_role: 'General Builder',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '+44 123 456 7890',
        vehicle_registration: 'AB12 CDE',
        vehicle_type: 'Van',
        company: {
          company_name: 'Mock Construction Ltd',
          primary_contact_email: 'contact@mock-construction.com',
          primary_contact_phone: '+44 987 654 3210'
        }
      };
      
      setProfile(mockProfile);

      // Mock delivery requests for now (until we create the table)
      setDeliveryRequests([]);

    } catch (error: any) {
      console.error('Error loading contractor data:', error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/contractor/auth');
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (showDeliveryForm) {
    return <ContractorDeliveryPortal />;
  }

  return (
    <div className="min-h-screen contractor-pattern bg-gradient-subtle">
      {/* Enhanced Contractor Header */}
      <div className="contractor-header text-white p-6 shadow-elevated">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="h-10 w-10 text-white" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">AJ Ryan</h1>
                  <div className="contractor-badge">
                    External Contractor Portal
                  </div>
                </div>
                <p className="text-white/90">
                  Welcome, {profile?.company.company_name} • {profile?.job_role}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-white/90">
                <p className="font-medium text-white">{user?.email}</p>
                <p>Contractor Access</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="rams">RAMS</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* RAMS Compliance Status */}
            <Card className="contractor-card border-l-4 border-l-contractor-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 contractor-accent-text">
                  <FileText className="w-5 h-5" />
                  RAMS Compliance Status
                </CardTitle>
                <CardDescription>
                  Risk Assessment and Method Statement documents - Required for site access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold contractor-accent-text">0%</div>
                      <div className="text-sm text-muted-foreground">Complete</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>• 2 documents required</div>
                      <div>• 0 documents signed</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/contractor/dashboard?tab=rams')}
                    >
                      View RAMS
                    </Button>
                    <Badge variant="destructive" className="bg-warning/10 text-warning border-warning">
                      Action Required
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Quick Stats with Contractor Styling */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="contractor-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-warning" />
                    <div>
                      <p className="text-sm font-medium">Pending</p>
                      <p className="text-2xl font-bold contractor-accent-text">
                        {deliveryRequests.filter(r => r.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="contractor-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-medium">Approved</p>
                      <p className="text-2xl font-bold contractor-accent-text">
                        {deliveryRequests.filter(r => r.status === 'approved').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="contractor-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">Rejected</p>
                      <p className="text-2xl font-bold contractor-accent-text">
                        {deliveryRequests.filter(r => r.status === 'rejected').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="contractor-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-5 w-5 text-contractor-accent" />
                    <div>
                      <p className="text-sm font-medium">Total</p>
                      <p className="text-2xl font-bold contractor-accent-text">{deliveryRequests.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Quick Actions */}
            <Card className="contractor-card">
              <CardHeader>
                <CardTitle className="contractor-accent-text">Quick Actions</CardTitle>
                <CardDescription>Common contractor tasks and services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => setShowDeliveryForm(true)} className="contractor-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Request New Delivery
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-contractor-accent text-contractor-accent hover:bg-contractor-alert-bg"
                    onClick={() => navigate('/contractor/dashboard?tab=rams')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View RAMS Documents
                  </Button>
                  <Button variant="outline" className="border-contractor-accent text-contractor-accent hover:bg-contractor-alert-bg">
                    <Calendar className="h-4 w-4 mr-2" />
                    Upcoming Deliveries
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Recent Delivery Requests */}
            <Card className="contractor-card">
              <CardHeader>
                <CardTitle className="contractor-accent-text">Recent Delivery Requests</CardTitle>
                <CardDescription>Your latest delivery booking requests</CardDescription>
              </CardHeader>
              <CardContent>
                {deliveryRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No delivery requests yet</p>
                    <Button 
                      onClick={() => setShowDeliveryForm(true)} 
                      className="mt-4 contractor-button"
                    >
                      Create Your First Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deliveryRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <p className="font-medium">#{request.request_number}</p>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.project_name} • {new Date(request.delivery_date).toLocaleDateString()} • {request.time_slot}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.total_items} items
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <MyTrainingDocuments />
          </TabsContent>

          <TabsContent value="rams" className="space-y-6">
            <EnhancedRAMSCompliance />
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-6">
            <ContractorDeliveryPortal />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="contractor-card">
              <CardHeader>
                <CardTitle className="contractor-accent-text">Contractor Profile</CardTitle>
                <CardDescription>Your company and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      Company Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                        <p>{profile?.company.company_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Job Role</p>
                        <p>{profile?.job_role}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Contact Email</p>
                        <p className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {profile?.company.primary_contact_email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Contact Phone</p>
                        <p className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {profile?.company.primary_contact_phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Emergency Contact
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p>{profile?.emergency_contact_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {profile?.emergency_contact_phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {profile?.vehicle_type && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center">
                        <Truck className="h-4 w-4 mr-2" />
                        Vehicle Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Vehicle Type</p>
                          <p>{profile.vehicle_type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Registration</p>
                          <p>{profile.vehicle_registration || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContractorDashboard;