import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Package,
  MapPin,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeliveryRequestForm } from './DeliveryRequestForm';
import { DeliveryTracker } from './DeliveryTracker';
import { DeliveryCalendar } from './DeliveryCalendar';

interface DeliveryRequest {
  id: string;
  request_number: string;
  project_name: string;
  delivery_date: string;
  time_slot: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  items: any[];
  total_items: number;
  delivery_address: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

export const ContractorDeliveryPortal = () => {
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadDeliveryRequests();
  }, []);

  const loadDeliveryRequests = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockData: DeliveryRequest[] = [
        {
          id: '1',
          request_number: 'DEL-2024-001',
          project_name: 'Riverside Development Phase 2',
          delivery_date: '2024-07-20',
          time_slot: '09:00-11:00',
          status: 'approved',
          items: [
            { name: 'Copper Pipes 22mm', quantity: 50, unit: 'meters' },
            { name: 'Pipe Fittings', quantity: 25, unit: 'pieces' }
          ],
          total_items: 2,
          delivery_address: 'Riverside Development, Plot 15-20, London SE1 9RY',
          special_instructions: 'Deliver to main site entrance. Contact site manager on arrival.',
          created_at: '2024-07-15T10:30:00Z',
          updated_at: '2024-07-15T14:20:00Z',
          admin_notes: 'Approved by site manager. Access granted for morning delivery.'
        },
        {
          id: '2',
          request_number: 'DEL-2024-002',
          project_name: 'Commercial Tower Build',
          delivery_date: '2024-07-22',
          time_slot: '14:00-16:00',
          status: 'pending',
          items: [
            { name: 'HVAC Ducting', quantity: 100, unit: 'meters' },
            { name: 'Insulation Material', quantity: 10, unit: 'rolls' }
          ],
          total_items: 2,
          delivery_address: 'Tower Site, 123 Business District, London EC1A 1BB',
          created_at: '2024-07-16T09:15:00Z',
          updated_at: '2024-07-16T09:15:00Z'
        }
      ];
      setDeliveryRequests(mockData);
    } catch (error) {
      console.error('Error loading delivery requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><Package className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = deliveryRequests.filter(request => {
    const matchesSearch = request.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: deliveryRequests.length,
    pending: deliveryRequests.filter(r => r.status === 'pending').length,
    approved: deliveryRequests.filter(r => r.status === 'approved').length,
    completed: deliveryRequests.filter(r => r.status === 'completed').length,
    rejected: deliveryRequests.filter(r => r.status === 'rejected').length,
  };

  if (showNewRequest) {
    return (
      <DeliveryRequestForm 
        onCancel={() => setShowNewRequest(false)}
        onSubmit={(data) => {
          console.log('New delivery request:', data);
          setShowNewRequest(false);
          loadDeliveryRequests();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold contractor-accent-text">Delivery Management</h1>
          <p className="text-muted-foreground">Manage your delivery requests and track shipments</p>
        </div>
        <Button 
          onClick={() => setShowNewRequest(true)}
          className="contractor-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Delivery Request
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-contractor-accent" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold contractor-accent-text">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">Delivery Requests</TabsTrigger>
          <TabsTrigger value="tracker">Track Deliveries</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {/* Filters */}
          <Card className="contractor-card">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by request number or project name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Requests List */}
          <div className="space-y-4">
            {loading ? (
              <Card className="contractor-card">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-contractor-accent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading delivery requests...</p>
                </CardContent>
              </Card>
            ) : filteredRequests.length === 0 ? (
              <Card className="contractor-card">
                <CardContent className="p-8 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' ? 'No delivery requests match your filters' : 'No delivery requests yet'}
                  </p>
                  <Button onClick={() => setShowNewRequest(true)} className="contractor-button">
                    Create Your First Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="contractor-card hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg contractor-accent-text">
                          #{request.request_number}
                        </CardTitle>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <CardDescription>{request.project_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-contractor-accent" />
                          <span className="text-sm">
                            {new Date(request.delivery_date).toLocaleDateString()} • {request.time_slot}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-contractor-accent mt-0.5" />
                          <span className="text-sm">{request.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-contractor-accent" />
                          <span className="text-sm">{request.total_items} items</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Items:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {request.items.slice(0, 2).map((item, idx) => (
                              <li key={idx}>• {item.name} ({item.quantity} {item.unit})</li>
                            ))}
                            {request.items.length > 2 && (
                              <li>• +{request.items.length - 2} more items</li>
                            )}
                          </ul>
                        </div>
                        {request.special_instructions && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Special Instructions:</h4>
                            <p className="text-sm text-muted-foreground">{request.special_instructions}</p>
                          </div>
                        )}
                        {request.admin_notes && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Admin Notes:</h4>
                            <p className="text-sm text-green-700">{request.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="tracker">
          <DeliveryTracker requests={deliveryRequests} />
        </TabsContent>

        <TabsContent value="calendar">
          <DeliveryCalendar requests={deliveryRequests} />
        </TabsContent>
      </Tabs>
    </div>
  );
};