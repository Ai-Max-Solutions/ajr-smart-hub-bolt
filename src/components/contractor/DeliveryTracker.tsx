import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Search,
  Calendar,
  Phone,
  AlertTriangle
} from 'lucide-react';

interface DeliveryTrackerProps {
  requests: any[];
}

export const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({ requests }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  // Mock tracking data - in real app this would come from delivery service API
  const getTrackingData = (requestId: string) => {
    return {
      status: 'in_transit',
      estimated_delivery: '2024-07-20T10:30:00Z',
      current_location: 'London Distribution Center',
      driver_name: 'James Wilson',
      driver_phone: '+44 7700 900123',
      vehicle_registration: 'LV64 ABC',
      tracking_history: [
        {
          timestamp: '2024-07-19T08:00:00Z',
          status: 'picked_up',
          location: 'Warehouse - Reading',
          description: 'Items collected from supplier warehouse'
        },
        {
          timestamp: '2024-07-19T14:30:00Z', 
          status: 'in_transit',
          location: 'M25 Junction 10',
          description: 'Vehicle en route to delivery location'
        },
        {
          timestamp: '2024-07-20T07:00:00Z',
          status: 'out_for_delivery',
          location: 'London Distribution Center',
          description: 'Out for delivery - driver assigned'
        }
      ]
    };
  };

  const trackDelivery = (requestNumber: string) => {
    const request = requests.find(r => r.request_number === requestNumber);
    if (request) {
      setSelectedDelivery({
        ...request,
        tracking: getTrackingData(request.id)
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'picked_up':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'in_transit':
        return <Truck className="h-4 w-4 text-yellow-600" />;
      case 'out_for_delivery':
        return <MapPin className="h-4 w-4 text-orange-600" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Track Delivery Form */}
      <Card className="contractor-card">
        <CardHeader>
          <CardTitle className="contractor-accent-text">Track Your Delivery</CardTitle>
          <CardDescription>Enter your delivery request number to track the status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter delivery request number (e.g., DEL-2024-001)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              onClick={() => trackDelivery(trackingNumber)}
              className="contractor-button"
              disabled={!trackingNumber}
            >
              Track Delivery
            </Button>
          </div>

          {/* Quick Track Approved Deliveries */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Quick track approved deliveries:</p>
            <div className="flex flex-wrap gap-2">
              {requests
                .filter(r => r.status === 'approved')
                .map(request => (
                  <Button
                    key={request.id}
                    variant="outline"
                    size="sm"
                    onClick={() => trackDelivery(request.request_number)}
                    className="text-xs"
                  >
                    {request.request_number}
                  </Button>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {selectedDelivery && (
        <div className="space-y-6">
          {/* Delivery Overview */}
          <Card className="contractor-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="contractor-accent-text">
                    Delivery Tracking: {selectedDelivery.request_number}
                  </CardTitle>
                  <CardDescription>{selectedDelivery.project_name}</CardDescription>
                </div>
                <Badge className={getStatusColor(selectedDelivery.tracking.status)}>
                  {getStatusIcon(selectedDelivery.tracking.status)}
                  <span className="ml-1 capitalize">{selectedDelivery.tracking.status.replace('_', ' ')}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Delivery Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-contractor-accent" />
                      <span>
                        {new Date(selectedDelivery.delivery_date).toLocaleDateString()} • {selectedDelivery.time_slot}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-contractor-accent mt-0.5" />
                      <span>{selectedDelivery.delivery_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-contractor-accent" />
                      <span>{selectedDelivery.total_items} items</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Current Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-contractor-accent" />
                      <span>{selectedDelivery.tracking.current_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-contractor-accent" />
                      <span>
                        Est. delivery: {new Date(selectedDelivery.tracking.estimated_delivery).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Driver Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>{selectedDelivery.tracking.driver_name}</div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-contractor-accent" />
                      <a 
                        href={`tel:${selectedDelivery.tracking.driver_phone}`}
                        className="text-contractor-accent hover:underline"
                      >
                        {selectedDelivery.tracking.driver_phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-contractor-accent" />
                      <span>{selectedDelivery.tracking.vehicle_registration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Timeline */}
          <Card className="contractor-card">
            <CardHeader>
              <CardTitle className="contractor-accent-text">Delivery Progress</CardTitle>
              <CardDescription>Real-time tracking of your delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedDelivery.tracking.tracking_history.map((event: any, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(event.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize">
                          {event.status.replace('_', ' ')}
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      <p className="text-sm text-contractor-accent font-medium">
                        {event.location}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Future status */}
                <div className="flex items-start gap-4 opacity-50">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Delivered</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Delivery completed and confirmed
                    </p>
                    <p className="text-sm text-gray-400 font-medium">
                      Pending
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Instructions */}
          {selectedDelivery.special_instructions && (
            <Card className="contractor-card border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  Special Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{selectedDelivery.special_instructions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No tracking data message */}
      {trackingNumber && !selectedDelivery && (
        <Card className="contractor-card">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No delivery found with request number "{trackingNumber}"
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please check the request number and try again
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};