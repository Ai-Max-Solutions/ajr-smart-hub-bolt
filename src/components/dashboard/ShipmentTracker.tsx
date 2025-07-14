import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Truck, Clock, CheckCircle, AlertTriangle, Package, MapPin } from "lucide-react";
import { AJIcon } from "@/components/ui/aj-icon";

interface ShipmentItem {
  id: string;
  reference: string;
  supplier: string;
  status: "pending" | "in_transit" | "delivered" | "delayed" | "cancelled";
  expectedDate: string;
  actualDate?: string;
  location: string;
  progress: number;
  items: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  priority?: "high" | "medium" | "low";
}

interface ShipmentTrackerProps {
  title?: string;
  shipments: ShipmentItem[];
  maxItems?: number;
  showProgress?: boolean;
  className?: string;
}

export function ShipmentTracker({
  title = "Shipment Tracking",
  shipments,
  maxItems = 5,
  showProgress = true,
  className
}: ShipmentTrackerProps) {
  const getStatusIcon = (status: ShipmentItem["status"]) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-accent" />;
      case "in_transit":
        return <Truck className="w-4 h-4 text-warning" />;
      case "delayed":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "cancelled":
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ShipmentItem["status"]) => {
    switch (status) {
      case "delivered":
        return "text-accent bg-accent/20";
      case "in_transit":
        return "text-warning bg-warning/20";
      case "delayed":
        return "text-destructive bg-destructive/20";
      case "cancelled":
        return "text-muted-foreground bg-muted/20";
      default:
        return "text-muted-foreground bg-muted/20";
    }
  };

  const getStatusBadge = (status: ShipmentItem["status"]) => {
    switch (status) {
      case "delivered":
        return { variant: "default" as const, label: "Delivered" };
      case "in_transit":
        return { variant: "secondary" as const, label: "In Transit" };
      case "delayed":
        return { variant: "destructive" as const, label: "Delayed" };
      case "cancelled":
        return { variant: "outline" as const, label: "Cancelled" };
      default:
        return { variant: "outline" as const, label: "Pending" };
    }
  };

  const getPriorityColor = (priority?: ShipmentItem["priority"]) => {
    switch (priority) {
      case "high":
        return "border-l-destructive";
      case "medium":
        return "border-l-warning";
      case "low":
        return "border-l-accent";
      default:
        return "border-l-muted";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const displayedShipments = shipments.slice(0, maxItems);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-poppins text-xl flex items-center gap-2">
            <AJIcon icon={Package} variant="yellow" size="default" hover={false} />
            {title}
          </CardTitle>
          <Badge variant="secondary" className="font-poppins">
            {shipments.length} Active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {displayedShipments.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground font-poppins">
              No active shipments
            </div>
          ) : (
            <div className="space-y-0">
              {displayedShipments.map((shipment, index) => {
                const statusBadge = getStatusBadge(shipment.status);
                
                return (
                  <div
                    key={shipment.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4",
                      getPriorityColor(shipment.priority),
                      index !== displayedShipments.length - 1 && "border-b border-border/50"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-poppins font-medium text-foreground text-sm truncate">
                            {shipment.reference}
                          </h4>
                          <Badge 
                            variant={statusBadge.variant} 
                            className="text-xs font-poppins shrink-0"
                          >
                            {statusBadge.label}
                          </Badge>
                          {shipment.priority === "high" && (
                            <Badge variant="destructive" className="text-xs">
                              High Priority
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground text-sm font-poppins">
                          {shipment.supplier}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-poppins">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {shipment.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(shipment.expectedDate)}
                          </div>
                        </div>
                      </div>

                      {/* Status Icon */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        getStatusColor(shipment.status)
                      )}>
                        {getStatusIcon(shipment.status)}
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground font-poppins mb-1">
                        Items: {shipment.items.slice(0, 2).map(item => 
                          `${item.quantity} ${item.unit} ${item.name}`
                        ).join(", ")}
                        {shipment.items.length > 2 && ` +${shipment.items.length - 2} more`}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    {showProgress && shipment.status !== "cancelled" && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground font-poppins">
                            Progress
                          </span>
                          <span className="text-xs text-muted-foreground font-poppins">
                            {shipment.progress}%
                          </span>
                        </div>
                        <Progress value={shipment.progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}