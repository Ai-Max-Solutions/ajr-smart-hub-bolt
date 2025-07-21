import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RequestDetailsModal } from './RequestDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface DeliveryRequest {
  id: string;
  request_id: string;
  submitted_by: string;
  submitted_date: string;
  supplier: string;
  delivery_date: string;
  delivery_time: string;
  items_json: any;
  delivery_method: any;
  vehicle_details: any;
  status: string;
}

export const PendingRequestsTab = () => {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_bookings')
        .select('*')
        .order('submitted_date', { ascending: false });

      if (error) throw error;
      setRequests((data || []).map(d => ({
        ...d,
        items_json: Array.isArray(d.items_json) ? d.items_json : []
      })));
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch delivery requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleInitiateBooking = async (requestId: string) => {
    try {
      const request = requests.find(r => r.request_id === requestId);
      if (!request) return;

      // Update status to initiated
      const { error: updateError } = await supabase
        .from('delivery_bookings')
        .update({ status: 'initiated' })
        .eq('request_id', requestId);

      if (updateError) throw updateError;

      // Call booking edge function
      const { data, error } = await supabase.functions.invoke('initiate-booking', {
        body: {
          requestId,
          formData: {
            deliveryDate: request.delivery_date,
            deliveryTime: request.delivery_time,
            supplier: request.supplier,
            items: request.items_json,
            deliveryMethod: request.delivery_method,
            vehicleDetails: request.vehicle_details,
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Booking Successful!',
          description: `Ref: ${data.reference} at ${format(new Date(data.bookingTime), 'HH:mm')}`,
        });
        fetchRequests(); // Refresh the list
      } else {
        throw new Error(data.error || 'Booking failed');
      }
    } catch (error) {
      console.error('Error initiating booking:', error);
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_bookings')
        .update({ status: 'rejected' })
        .eq('request_id', requestId);

      if (error) throw error;

      toast({
        title: 'Request Rejected',
        description: 'The delivery request has been rejected',
      });
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      initiated: 'default',
      booked: 'default',
      failed: 'destructive',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.request_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getItemsSummary = (items: any) => {
    if (!Array.isArray(items) || items.length === 0) return 'No items';
    return `${items.length} item(s)`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by supplier or request ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="initiated">Initiated</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Submitted Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.request_id}</TableCell>
                <TableCell>{format(new Date(request.submitted_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{request.supplier}</TableCell>
                <TableCell>{format(new Date(request.delivery_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{request.delivery_time}</TableCell>
                <TableCell>{getItemsSummary(request.items_json)}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {request.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleInitiateBooking(request.request_id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Initiate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRejectRequest(request.request_id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No requests found matching your criteria
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};