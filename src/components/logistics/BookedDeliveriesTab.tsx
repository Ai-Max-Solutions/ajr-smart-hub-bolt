import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Search, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface BookedDelivery {
  id: string;
  request_id: string;
  supplier: string;
  delivery_date: string;
  delivery_time: string;
  items_json: any;
  booking_reference: string;
  booking_time: string;
  status: string;
  created_at: string;
}

export const BookedDeliveriesTab = () => {
  const [deliveries, setDeliveries] = useState<BookedDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const { toast } = useToast();

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_bookings')
        .select('*')
        .neq('status', 'pending')
        .order('booking_time', { ascending: false });

      if (error) throw error;
      setDeliveries((data || []).map(d => ({
        ...d,
        items_json: Array.isArray(d.items_json) ? d.items_json : []
      })));
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch booked deliveries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleExportCSV = () => {
    try {
      const headers = [
        'Request ID',
        'Booking Reference',
        'Supplier',
        'Delivery Date',
        'Delivery Time',
        'Items Count',
        'Status',
        'Booking Time'
      ];

      const csvData = filteredDeliveries.map(delivery => [
        delivery.request_id,
        delivery.booking_reference || '',
        delivery.supplier,
        format(new Date(delivery.delivery_date), 'dd/MM/yyyy'),
        delivery.delivery_time,
        Array.isArray(delivery.items_json) ? delivery.items_json.length : 0,
        delivery.status,
        delivery.booking_time ? format(new Date(delivery.booking_time), 'dd/MM/yyyy HH:mm') : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booked-deliveries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'Delivery data exported to CSV',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const generateTomorrowReport = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('delivery_bookings')
        .select('*')
        .eq('delivery_date', tomorrowStr)
        .eq('status', 'booked');

      if (error) throw error;

      if (data.length === 0) {
        toast({
          title: 'No Deliveries',
          description: 'No deliveries scheduled for tomorrow',
        });
        return;
      }

      // Generate report content
      const reportData = data.map(delivery => [
        delivery.booking_reference,
        delivery.supplier,
        delivery.delivery_time,
        Array.isArray(delivery.items_json) ? delivery.items_json.length : 0,
        Array.isArray(delivery.items_json) ? delivery.items_json.map((item: any) => `${item.item} (${item.quantity})`).join('; ') : ''
      ]);

      const csvContent = [
        ['Booking Ref', 'Supplier', 'Time', 'Items Count', 'Items Detail'].join(','),
        ...reportData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tomorrow-deliveries-${tomorrowStr}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Report Generated',
        description: `Tomorrow's delivery report exported (${data.length} deliveries)`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Report Failed',
        description: 'Failed to generate tomorrow\'s report',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      booked: 'default',
      failed: 'destructive',
      rejected: 'destructive',
      initiated: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (delivery.booking_reference && delivery.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = format(new Date(), 'yyyy-MM-dd');
      matchesDate = delivery.delivery_date === today;
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      matchesDate = delivery.delivery_date === format(tomorrow, 'yyyy-MM-dd');
    } else if (dateFilter === 'this-week') {
      const deliveryDate = new Date(delivery.delivery_date);
      const today = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);
      matchesDate = deliveryDate >= today && deliveryDate <= weekFromNow;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) {
    return <div className="text-center py-8">Loading deliveries...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by supplier, request ID, or booking ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="initiated">Initiated</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>

        <Button onClick={generateTomorrowReport} variant="default">
          <Calendar className="h-4 w-4 mr-2" />
          Tomorrow's Report
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking Ref</TableHead>
              <TableHead>Request ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Booked At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeliveries.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="font-medium">
                  {delivery.booking_reference || '-'}
                </TableCell>
                <TableCell>{delivery.request_id}</TableCell>
                <TableCell>{delivery.supplier}</TableCell>
                <TableCell>{format(new Date(delivery.delivery_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{delivery.delivery_time}</TableCell>
                <TableCell>{Array.isArray(delivery.items_json) ? delivery.items_json.length : 0} item(s)</TableCell>
                <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                <TableCell>
                  {delivery.booking_time 
                    ? format(new Date(delivery.booking_time), 'dd/MM/yyyy HH:mm')
                    : '-'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredDeliveries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No booked deliveries found matching your criteria
        </div>
      )}
    </div>
  );
};