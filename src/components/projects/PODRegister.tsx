import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Package,
  Truck,
  ArrowUpDown,
  FileText,
  Users
} from 'lucide-react';
import CreatePODDialog from './CreatePODDialog';
import PODApprovalDialog from './PODApprovalDialog';
import { format } from 'date-fns';

interface PODRecord {
  id: string;
  pod_type: string;
  pod_category: 'DELIVERY' | 'HIRE_RETURN';
  supplier_name: string;
  description: string;
  status: string;
  created_at: string;
  pod_photo_url?: string;
  signed_by_name?: string;
  damage_notes?: string;
  approved_at?: string;
  plot_location?: string;
  order_reference?: string;
  hire_item_id?: string;
  quantity_expected?: number;
  quantity_received?: number;
  condition_on_arrival?: 'good' | 'damaged' | 'incomplete';
  discrepancy_value?: number;
  supplier_contact?: string;
  delivery_method?: string;
}

interface PODSummary {
  total_pods: number;
  pending: number;
  approved: number;
  flagged: number;
  delivery_pods: number;
  hire_pods: number;
  discrepancy_value: number;
  recent_pods: PODRecord[];
}

const PODRegister = () => {
  const { projectId } = useParams();
  const { toast } = useToast();
  const [pods, setPods] = useState<PODRecord[]>([]);
  const [summary, setSummary] = useState<PODSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPod, setSelectedPod] = useState<PODRecord | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (projectId) {
      fetchPODs();
      fetchSummary();
    }
  }, [projectId]);

  const fetchPODs = async () => {
    if (!projectId) return;

    try {
      // Mock POD data since pod_register table doesn't exist
      const mockPods: PODRecord[] = [
        {
          id: '1',
          pod_type: 'Material Delivery',
          pod_category: 'DELIVERY',
          supplier_name: 'Sample Supplier',
          description: 'Sample POD',
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ];
      setPods(mockPods);
    } catch (error) {
      console.error('Error fetching PODs:', error);
      toast({
        title: "Error",
        description: "Failed to load POD records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!projectId) return;

    try {
      // Mock summary data since get_pod_summary function doesn't exist
      const mockSummary: PODSummary = {
        total_pods: 1,
        pending: 1,
        approved: 0,
        flagged: 0,
        delivery_pods: 1,
        hire_pods: 0,
        discrepancy_value: 0,
        recent_pods: []
      };
      setSummary(mockSummary);
    } catch (error) {
      console.error('Error fetching POD summary:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'flagged': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'default',
      flagged: 'destructive',
      pending: 'secondary',
      rejected: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPodTypeIcon = (type: string, category?: string) => {
    if (category === 'DELIVERY') {
      return <Package className="h-4 w-4" />;
    } else if (category === 'HIRE_RETURN') {
      return <Truck className="h-4 w-4" />;
    }
    
    // Fallback for legacy records
    switch (type) {
      case 'material_delivery':
      case 'site_delivery': 
      case 'welfare_delivery':
      case 'tool_delivery': return <Package className="h-4 w-4" />;
      case 'collection': 
      case 'off_hire': 
      case 'equipment_return': return <Truck className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const filteredPods = pods.filter(pod => {
    if (filter === 'all') return true;
    return pod.status === filter;
  });

  const handlePodCreated = () => {
    fetchPODs();
    fetchSummary();
    setShowCreateDialog(false);
  };

  const handleApprovalUpdate = () => {
    fetchPODs();
    fetchSummary();
    setShowApprovalDialog(false);
    setSelectedPod(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading POD register...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">POD Register</h2>
          <p className="text-muted-foreground">
            Proof of Delivery tracking for all site deliveries and collections
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#1d1e3d] hover:bg-[#1d1e3d]/90 text-white"
        >
          <Camera className="h-4 w-4 mr-2" />
          Add POD
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total PODs</p>
                  <p className="text-2xl font-bold">{summary.total_pods}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Deliveries</p>
                  <p className="text-2xl font-bold">{summary.delivery_pods}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Collections</p>
                  <p className="text-2xl font-bold">{summary.hire_pods}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold">{summary.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Approved</p>
                  <p className="text-2xl font-bold">{summary.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Issues (£{summary.discrepancy_value.toFixed(0)})</p>
                  <p className="text-2xl font-bold">{summary.flagged}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All PODs</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {filteredPods.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No PODs found</h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'all' 
                    ? "Start by adding your first proof of delivery record"
                    : `No ${filter} PODs to display`
                  }
                </p>
                {filter === 'all' && (
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First POD
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPods.map((pod) => (
                <Card key={pod.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="p-2 bg-muted rounded-lg">
                            {getPodTypeIcon(pod.pod_type, pod.pod_category)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-foreground">
                                {pod.pod_type.replace('_', ' ').toUpperCase()}
                              </h4>
                              {getStatusBadge(pod.status)}
                              {pod.pod_category && (
                                <Badge variant="outline" className="text-xs">
                                  {pod.pod_category === 'DELIVERY' ? 'Delivery' : 'Collection'}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-1">
                              {pod.supplier_name && `${pod.supplier_name} • `}
                              {pod.plot_location && `${pod.plot_location} • `}
                              {format(new Date(pod.created_at), 'MMM dd, yyyy HH:mm')}
                            </p>
                            
                            <p className="text-sm text-foreground mb-2">
                              {pod.description}
                            </p>

                            {/* Quantity Info for Deliveries */}
                            {pod.pod_category === 'DELIVERY' && pod.quantity_expected && pod.quantity_received && (
                              <div className="flex items-center text-xs text-muted-foreground mb-1">
                                <Package className="h-3 w-3 mr-1" />
                                Expected: {pod.quantity_expected} | Received: {pod.quantity_received}
                                {pod.quantity_expected !== pod.quantity_received && (
                                  <span className="ml-1 text-orange-600 font-medium">
                                    ({pod.quantity_received > pod.quantity_expected ? '+' : ''}
                                    {(pod.quantity_received - pod.quantity_expected).toFixed(1)})
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Condition Badge */}
                            {pod.condition_on_arrival && pod.condition_on_arrival !== 'good' && (
                              <div className="flex items-center text-xs mb-1">
                                <AlertTriangle className="h-3 w-3 mr-1 text-orange-600" />
                                <span className="text-orange-600 font-medium">
                                  {pod.condition_on_arrival === 'damaged' ? 'Damaged' : 'Incomplete'}
                                </span>
                                {pod.discrepancy_value && pod.discrepancy_value > 0 && (
                                  <span className="ml-1 text-red-600 font-medium">
                                    (£{pod.discrepancy_value.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {pod.signed_by_name && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Users className="h-3 w-3 mr-1" />
                                Signed by: {pod.signed_by_name}
                              </div>
                            )}
                          </div>
                        </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {pod.pod_photo_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(pod.pod_photo_url, '_blank')}
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Photo
                          </Button>
                        )}
                        
                        {pod.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPod(pod);
                              setShowApprovalDialog(true);
                            }}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreatePODDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        projectId={projectId!}
        onPodCreated={handlePodCreated}
      />

      {selectedPod && (
        <PODApprovalDialog
          open={showApprovalDialog}
          onOpenChange={setShowApprovalDialog}
          pod={selectedPod}
          onApprovalUpdate={handleApprovalUpdate}
        />
      )}
    </div>
  );
};

export default PODRegister;