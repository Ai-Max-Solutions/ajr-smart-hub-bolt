import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PendingRequestsTab } from '@/components/logistics/PendingRequestsTab';
import { BookedDeliveriesTab } from '@/components/logistics/BookedDeliveriesTab';
import { UploadFormTab } from '@/components/logistics/UploadFormTab';
import { useAuth } from '@/hooks/useAuth';
import { RoleProtection } from '@/components/auth/RoleProtection';
import { Package, Truck, Upload, BarChart3 } from 'lucide-react';

const LogisticsAssistant = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <RoleProtection 
      allowedRoles={['Admin', 'PM', 'Director', 'Supervisor']}
      fallbackPath="/dashboard"
    >
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Logistics Assistant</h1>
              <p className="text-muted-foreground">
                Manage delivery requests and bookings with AI-powered automation
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Booked</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl font-bold">5</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">34</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                  <TabsTrigger value="booked">Booked Deliveries</TabsTrigger>
                  <TabsTrigger value="upload">Upload Form</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="mt-6">
                  <PendingRequestsTab />
                </TabsContent>
                
                <TabsContent value="booked" className="mt-6">
                  <BookedDeliveriesTab />
                </TabsContent>
                
                <TabsContent value="upload" className="mt-6">
                  <UploadFormTab />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleProtection>
  );
};

export default LogisticsAssistant;