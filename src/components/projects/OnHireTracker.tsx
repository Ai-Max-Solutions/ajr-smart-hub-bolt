import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Download, Calendar as CalendarIcon, Truck, AlertTriangle, Clock, Bot, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface HireItem {
  id: string;
  itemName: string;
  supplier: string;
  orderRef: string;
  onHireDate: string;
  expectedOffHire: string;
  status: 'live' | 'off-hire-requested' | 'overdue';
  whoAdded: string;
  weeklyCost: number;
  notes?: string;
  requestHistory: HireRequest[];
}

interface HireRequest {
  id: string;
  type: 'off-hire' | 'extension' | 'new-hire';
  requestDate: string;
  requestedBy: string;
  details: string;
  aiGenerated?: boolean;
  status: 'pending' | 'confirmed' | 'rejected';
}

const mockHireItems: HireItem[] = [
  {
    id: '1',
    itemName: 'Mobile Welfare Unit',
    supplier: 'MEP Hire Ltd',
    orderRef: 'HO-14562',
    onHireDate: '2025-01-10',
    expectedOffHire: '2025-01-31',
    status: 'live',
    whoAdded: 'John Smith',
    weeklyCost: 150,
    notes: 'Needs clean before return',
    requestHistory: []
  },
  {
    id: '2',
    itemName: 'Portable Lighting Tower',
    supplier: 'MEP Hire Ltd',
    orderRef: 'HO-14563',
    onHireDate: '2025-01-15',
    expectedOffHire: '2025-01-28',
    status: 'off-hire-requested',
    whoAdded: 'Sarah Johnson',
    weeklyCost: 85,
    requestHistory: [
      {
        id: '1',
        type: 'off-hire',
        requestDate: '2025-01-25',
        requestedBy: 'John Smith',
        details: 'Hi MEP Hire, please arrange collection of Portable Lighting Tower for Woodberry Down Phase 2, ready for pickup Friday 31st Jan.',
        aiGenerated: true,
        status: 'pending'
      }
    ]
  },
  {
    id: '3',
    itemName: 'Mini Digger - JCB 8008',
    supplier: 'Plant Solutions UK',
    orderRef: 'PS-7821',
    onHireDate: '2025-01-05',
    expectedOffHire: '2025-01-20',
    status: 'overdue',
    whoAdded: 'Mike Brown',
    weeklyCost: 320,
    notes: 'Hydraulic leak reported - needs attention',
    requestHistory: []
  }
];

interface OnHireTrackerProps {
  projectId: string;
}

const OnHireTracker: React.FC<OnHireTrackerProps> = ({ projectId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<HireItem | null>(null);
  const [requestType, setRequestType] = useState<'off-hire' | 'extension'>('off-hire');
  const [useAI, setUseAI] = useState(true);
  const [newHireDate, setNewHireDate] = useState<Date>();
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [aiDraft, setAiDraft] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-success text-success-foreground">🟢 Live</Badge>;
      case 'off-hire-requested':
        return <Badge className="bg-warning text-warning-foreground">🟡 Off-Hire Requested</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive text-destructive-foreground">🔴 Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredItems = mockHireItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generateAIDraft = (item: HireItem, type: 'off-hire' | 'extension') => {
    if (type === 'off-hire') {
      return `Hi ${item.supplier},

Please arrange collection of ${item.itemName} (Order Ref: ${item.orderRef}) for Woodberry Down Phase 2.

The item is ready for collection and can be picked up during normal working hours (7:30am - 4:30pm, Monday to Friday).

Please confirm collection date and time.

Best regards,
AJ Ryan Site Team`;
    } else {
      return `Hi ${item.supplier},

We need to extend the hire period for ${item.itemName} (Order Ref: ${item.orderRef}) on Woodberry Down Phase 2.

Current end date: ${format(new Date(item.expectedOffHire), 'dd/MM/yyyy')}
Requested new end date: ${newHireDate ? format(newHireDate, 'dd/MM/yyyy') : '[Please select date]'}

Please confirm the extension and updated costs.

Best regards,
AJ Ryan Site Team`;
    }
  };

  const handleRequestSubmit = () => {
    if (!selectedItem) return;
    
    const draft = useAI ? generateAIDraft(selectedItem, requestType) : pickupInstructions;
    setAiDraft(draft);
    
    // In real app, would save request and send to supplier
    console.log('Request submitted:', {
      item: selectedItem.itemName,
      type: requestType,
      draft,
      useAI
    });
  };

  const totalWeeklyCost = mockHireItems.reduce((sum, item) => sum + item.weeklyCost, 0);
  const overdueCount = mockHireItems.filter(item => item.status === 'overdue').length;
  const pendingOffHire = mockHireItems.filter(item => item.status === 'off-hire-requested').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Truck className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">{mockHireItems.length}</p>
            <p className="text-xs text-muted-foreground">Items On Hire</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
            <p className="text-xs text-muted-foreground">Overdue Items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-warning">{pendingOffHire}</p>
            <p className="text-xs text-muted-foreground">Pending Off-Hire</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <span className="text-2xl font-bold text-accent">£{totalWeeklyCost}</span>
            <p className="text-xs text-muted-foreground">Weekly Total Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              On-Hire Register
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add New Hire
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Hire Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="item-name">Item Name</Label>
                      <Input id="item-name" placeholder="e.g. Mobile Welfare Unit" />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input id="supplier" placeholder="e.g. MEP Hire Ltd" />
                    </div>
                    <div>
                      <Label htmlFor="order-ref">Order Reference</Label>
                      <Input id="order-ref" placeholder="e.g. HO-14562" />
                    </div>
                    <div>
                      <Label htmlFor="weekly-cost">Weekly Cost (£)</Label>
                      <Input id="weekly-cost" type="number" placeholder="150" />
                    </div>
                    <Button className="w-full">Add to Register</Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Register
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search items or suppliers..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="off-hire-requested">Off-Hire Requested</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hire Items Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Ref</TableHead>
                  <TableHead>On-Hire Date</TableHead>
                  <TableHead>Expected Off-Hire</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Weekly Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell className="font-mono text-sm">{item.orderRef}</TableCell>
                    <TableCell>{format(new Date(item.onHireDate), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{format(new Date(item.expectedOffHire), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>£{item.weeklyCost}/week</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            Request
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Smart Request - {item.itemName}</DialogTitle>
                          </DialogHeader>
                          
                          <Tabs value={useAI ? 'ai' : 'form'} onValueChange={(v) => setUseAI(v === 'ai')}>
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="ai" className="flex items-center gap-2">
                                <Bot className="w-4 h-4" />
                                🧠 AI Draft
                              </TabsTrigger>
                              <TabsTrigger value="form" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                📄 Manual Form
                              </TabsTrigger>
                            </TabsList>
                            
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label>Request Type</Label>
                                <Select value={requestType} onValueChange={(v: any) => setRequestType(v)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="off-hire">Off-Hire Request</SelectItem>
                                    <SelectItem value="extension">Extension Request</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {requestType === 'extension' && (
                                <div>
                                  <Label>New End Date</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !newHireDate && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {newHireDate ? format(newHireDate, "PPP") : <span>Pick a date</span>}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={newHireDate}
                                        onSelect={setNewHireDate}
                                        initialFocus
                                        className="pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              )}

                              <TabsContent value="ai" className="space-y-4">
                                <div>
                                  <Label>AI Generated Message</Label>
                                  <Textarea 
                                    value={generateAIDraft(item, requestType)}
                                    readOnly
                                    className="min-h-32 bg-muted"
                                  />
                                </div>
                              </TabsContent>

                              <TabsContent value="form" className="space-y-4">
                                <div>
                                  <Label>Pickup Instructions / Message</Label>
                                  <Textarea 
                                    value={pickupInstructions}
                                    onChange={(e) => setPickupInstructions(e.target.value)}
                                    placeholder="Enter specific instructions or custom message..."
                                    className="min-h-32"
                                  />
                                </div>
                              </TabsContent>

                              <Button onClick={handleRequestSubmit} className="w-full">
                                Send Request
                              </Button>
                            </div>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnHireTracker;