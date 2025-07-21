import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Package, Truck } from 'lucide-react';

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
  booking_reference?: string;
  booking_time?: string;
}

interface RequestDetailsModalProps {
  request: DeliveryRequest;
  onClose: () => void;
}

export const RequestDetailsModal = ({ request, onClose }: RequestDetailsModalProps) => {
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-5 w-5" />
            Delivery Request Details - {request.request_id}
            {getStatusBadge(request.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Request ID</p>
                  <p className="font-medium">{request.request_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted Date</p>
                  <p className="font-medium">{format(new Date(request.submitted_date), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{request.supplier}</p>
                </div>
                {request.booking_reference && (
                  <div>
                    <p className="text-sm text-muted-foreground">Booking Reference</p>
                    <p className="font-medium">{request.booking_reference}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Date</p>
                  <p className="font-medium">{format(new Date(request.delivery_date), 'EEEE, dd MMMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Time</p>
                  <p className="font-medium">{request.delivery_time}</p>
                </div>
                {request.booking_time && (
                  <div>
                    <p className="text-sm text-muted-foreground">Booked At</p>
                    <p className="font-medium">{format(new Date(request.booking_time), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

            {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items to Deliver
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(request.items_json) && request.items_json.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">Item</th>
                        <th className="p-3 text-left font-medium">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.items_json.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">{item.item}</td>
                          <td className="p-3">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No items specified</p>
              )}
            </CardContent>
          </Card>

          {/* Delivery Method & Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {request.delivery_method?.pallets && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Pallets: {request.delivery_method.pallets}</span>
                  </div>
                )}
                {request.delivery_method?.bags && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Bags: {request.delivery_method.bags}</span>
                  </div>
                )}
                {request.delivery_method?.bundles && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Bundles: {request.delivery_method.bundles}</span>
                  </div>
                )}
                {request.delivery_method?.lengths && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Lengths: {request.delivery_method.lengths}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Unload Method</p>
                  <p className="font-medium capitalize">
                    {request.delivery_method?.unloadMethod?.replace('-', ' ') || 'Not specified'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Type</p>
                  <p className="font-medium">{request.vehicle_details?.type || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Supplier</p>
                  <p className="font-medium">{request.vehicle_details?.supplier || 'Not specified'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {request.vehicle_details?.edgeProtection ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Edge Protection</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Over 3.5T</p>
                  <p className="font-medium">{request.vehicle_details?.over35T ? 'Yes' : 'No'}</p>
                </div>
                {request.vehicle_details?.weight && (
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">{request.vehicle_details.weight}</p>
                  </div>
                )}
                {request.vehicle_details?.forsNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">FORS Number</p>
                    <p className="font-medium">{request.vehicle_details.forsNumber}</p>
                  </div>
                )}
                {request.vehicle_details?.colour && (
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle Colour</p>
                    <p className="font-medium">{request.vehicle_details.colour}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};