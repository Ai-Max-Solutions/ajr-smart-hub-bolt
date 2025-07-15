import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Package
} from 'lucide-react';

interface DeliveryCalendarProps {
  requests: any[];
}

export const DeliveryCalendar: React.FC<DeliveryCalendarProps> = ({ requests }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return { days, firstDay, lastDay };
  };

  const getDeliveriesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return requests.filter(request => 
      request.delivery_date === dateStr && 
      ['approved', 'pending'].includes(request.status)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const { days } = getMonthData(currentDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <Card className="contractor-card flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="contractor-accent-text">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>View scheduled deliveries by date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {daysOfWeek.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const deliveries = getDeliveriesForDate(day);
                const hasDeliveries = deliveries.length > 0;
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all hover:bg-gray-50
                      ${isCurrentMonth(day) ? 'bg-white' : 'bg-gray-50 text-muted-foreground'}
                      ${isToday(day) ? 'ring-2 ring-contractor-accent' : ''}
                      ${hasDeliveries ? 'border-contractor-accent' : 'border-gray-200'}
                    `}
                    onClick={() => setSelectedDelivery(hasDeliveries ? deliveries[0] : null)}
                  >
                    <div className="text-sm font-medium mb-1">
                      {day.getDate()}
                    </div>
                    
                    {hasDeliveries && (
                      <div className="space-y-1">
                        {deliveries.slice(0, 2).map((delivery, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-1 rounded border ${getStatusColor(delivery.status)}`}
                          >
                            <div className="font-medium truncate">
                              {delivery.request_number}
                            </div>
                            <div className="truncate">
                              {delivery.time_slot}
                            </div>
                          </div>
                        ))}
                        {deliveries.length > 2 && (
                          <div className="text-xs text-contractor-accent font-medium">
                            +{deliveries.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Details Sidebar */}
        <Card className="contractor-card lg:w-80">
          <CardHeader>
            <CardTitle className="contractor-accent-text">
              {selectedDelivery ? 'Delivery Details' : 'Select a Delivery'}
            </CardTitle>
            <CardDescription>
              {selectedDelivery 
                ? 'Information about the selected delivery'
                : 'Click on a calendar date with deliveries to see details'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDelivery ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{selectedDelivery.request_number}</h3>
                  <Badge className={getStatusColor(selectedDelivery.status)}>
                    {selectedDelivery.status}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Project</h4>
                    <p className="text-sm">{selectedDelivery.project_name}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-contractor-accent" />
                    <span className="text-sm">
                      {new Date(selectedDelivery.delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-contractor-accent" />
                    <span className="text-sm">{selectedDelivery.time_slot}</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-contractor-accent mt-0.5" />
                    <span className="text-sm">{selectedDelivery.delivery_address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-contractor-accent" />
                    <span className="text-sm">{selectedDelivery.total_items} items</span>
                  </div>
                </div>

                {selectedDelivery.items && selectedDelivery.items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Items:</h4>
                    <ul className="text-sm space-y-1">
                      {selectedDelivery.items.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between">
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">
                            {item.quantity} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedDelivery.special_instructions && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Special Instructions:
                    </h4>
                    <p className="text-sm">{selectedDelivery.special_instructions}</p>
                  </div>
                )}

                {selectedDelivery.admin_notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Admin Notes:
                    </h4>
                    <p className="text-sm text-green-700">{selectedDelivery.admin_notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Click on a date with scheduled deliveries to view details
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card className="contractor-card">
        <CardHeader>
          <CardTitle className="contractor-accent-text">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-sm">Pending Approval</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-contractor-accent rounded"></div>
              <span className="text-sm">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};