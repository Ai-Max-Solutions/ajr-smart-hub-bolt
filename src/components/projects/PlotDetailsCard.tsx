import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  FileText, 
  Calendar,
  X,
  Edit3,
  Plus,
  Trash2,
  Shield,
  DollarSign,
  Timer,
  Activity,
  Upload,
  Download
} from 'lucide-react';

interface Operative {
  id: string;
  name: string;
  role: string;
  cscsVerified: boolean;
  ramsSignedCount: number;
  ramsTotalCount: number;
  payType: 'day-rate' | 'price-work';
  dayRate?: number;
  hourlyRate: number;
}

interface WorkEntry {
  id: string;
  operativeId: string;
  date: string;
  isFullDay: boolean;
  hours?: number;
  notes?: string;
  approvedBy?: string;
}

interface RAMSDocument {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'archived';
  signedCount: number;
  totalRequired: number;
  uploadDate: string;
}

interface PlotDetailsCardProps {
  plot: {
    id: string;
    name: string;
    level: string;
    status: 'pending' | 'in-progress' | 'completed' | 'on-hold';
    workCategories?: string[];
    estimatedCompletion?: string;
    notes?: string;
    operatives?: Operative[];
    workEntries?: WorkEntry[];
    ramsDocuments?: RAMSDocument[];
  };
  userRole: 'pm' | 'supervisor' | 'operative';
  onClose: () => void;
  onUpdate?: (plotData: any) => void;
}

const PlotDetailsCard = ({ plot, userRole, onClose, onUpdate }: PlotDetailsCardProps) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [newWorkEntry, setNewWorkEntry] = useState({
    operativeId: '',
    date: new Date().toISOString().split('T')[0],
    isFullDay: true,
    hours: 7.5,
    notes: ''
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'on-hold':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default:
        return <div className="w-5 h-5 border-2 border-muted-foreground rounded-full" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-warning text-warning-foreground">In Progress</Badge>;
      case 'on-hold':
        return <Badge variant="secondary">On Hold</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const canEdit = userRole === 'pm' || userRole === 'supervisor';

  // Mock data for demonstration
  const mockOperatives: Operative[] = [
    {
      id: '1',
      name: 'John Smith',
      role: 'Operative',
      cscsVerified: true,
      ramsSignedCount: 3,
      ramsTotalCount: 4,
      payType: 'day-rate',
      dayRate: 180,
      hourlyRate: 22
    },
    {
      id: '2',
      name: 'Mike Johnson',
      role: 'Operative',
      cscsVerified: true,
      ramsSignedCount: 4,
      ramsTotalCount: 4,
      payType: 'price-work',
      hourlyRate: 24
    }
  ];

  const mockWorkEntries: WorkEntry[] = [
    {
      id: '1',
      operativeId: '1',
      date: '2024-01-15',
      isFullDay: true,
      notes: 'Standard 1st fix work completed'
    },
    {
      id: '2',
      operativeId: '1',
      date: '2024-01-16',
      isFullDay: false,
      hours: 4,
      notes: 'Left early for materials delivery'
    }
  ];

  const mockRAMS: RAMSDocument[] = [
    {
      id: '1',
      name: 'First Fix Electrical RAMS',
      version: 'v2.1',
      status: 'active',
      signedCount: 2,
      totalRequired: 2,
      uploadDate: '2024-01-10'
    },
    {
      id: '2',
      name: 'Height Safety RAMS',
      version: 'v1.3',
      status: 'active',
      signedCount: 1,
      totalRequired: 2,
      uploadDate: '2024-01-12'
    }
  ];

  const addWorkEntry = () => {
    // Implementation for adding work entry
    console.log('Adding work entry:', newWorkEntry);
  };

  return (
    <Card className="w-full max-w-4xl h-[90vh] overflow-hidden">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(plot.status)}
            <div>
              <CardTitle className="text-xl">Plot {plot.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plot.level}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(plot.status)}
            {canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 rounded-none border-b">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="worklog">Work Log</TabsTrigger>
            <TabsTrigger value="rams">RAMS</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="details" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workCategories">Work Categories</Label>
                    <Select disabled={!isEditing}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st-fix">1st Fix</SelectItem>
                        <SelectItem value="2nd-fix">2nd Fix</SelectItem>
                        <SelectItem value="snagging">Snagging</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="completion">Estimated Completion</Label>
                    <Input 
                      type="date" 
                      disabled={!isEditing}
                      defaultValue={plot.estimatedCompletion}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Site Notes</Label>
                  <Textarea 
                    placeholder="Add plot-specific instructions..."
                    disabled={!isEditing}
                    defaultValue={plot.notes}
                    className="h-24"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Assigned Operatives</h3>
                  {canEdit && (
                    <Button size="sm" className="btn-accent">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Operative
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {mockOperatives.map((operative) => (
                    <Card key={operative.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {operative.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{operative.name}</p>
                            <p className="text-sm text-muted-foreground">{operative.role}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="flex items-center space-x-1">
                              <Shield className={`w-4 h-4 ${operative.cscsVerified ? 'text-success' : 'text-destructive'}`} />
                              <span className="text-xs">CSCS</span>
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-xs">
                              RAMS: {operative.ramsSignedCount}/{operative.ramsTotalCount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {operative.ramsSignedCount === operative.ramsTotalCount ? '✅' : '⏳'}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-xs">
                                {operative.payType === 'day-rate' 
                                  ? `£${operative.dayRate}/day` 
                                  : 'Price Work'
                                }
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              £{operative.hourlyRate}/hr
                            </div>
                          </div>

                          {canEdit && (
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="worklog" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Work Log</h3>
                  {canEdit && (
                    <div className="text-sm text-muted-foreground">
                      Total this week: 3.5 days logged
                    </div>
                  )}
                </div>

                {/* Add Work Entry Form */}
                <Card className="p-4 bg-muted/30">
                  <h4 className="font-medium mb-4">Log Work Entry</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>Operative</Label>
                      <Select value={newWorkEntry.operativeId} onValueChange={(value) => 
                        setNewWorkEntry(prev => ({ ...prev, operativeId: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operative" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockOperatives.map(op => (
                            <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date</Label>
                      <Input 
                        type="date" 
                        value={newWorkEntry.date}
                        onChange={(e) => setNewWorkEntry(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label className="flex items-center space-x-2">
                        <span>Work Type</span>
                      </Label>
                      <div className="flex items-center space-x-3 mt-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={newWorkEntry.isFullDay}
                            onCheckedChange={(checked) => setNewWorkEntry(prev => ({ 
                              ...prev, 
                              isFullDay: checked,
                              hours: checked ? 7.5 : prev.hours
                            }))}
                          />
                          <Label className="text-sm">
                            {newWorkEntry.isFullDay ? 'Full Day (7.5h)' : 'Partial Hours'}
                          </Label>
                        </div>
                      </div>
                      {!newWorkEntry.isFullDay && (
                        <Input 
                          type="number" 
                          step="0.5"
                          placeholder="Hours worked"
                          value={newWorkEntry.hours}
                          onChange={(e) => setNewWorkEntry(prev => ({ 
                            ...prev, 
                            hours: parseFloat(e.target.value) 
                          }))}
                          className="mt-2"
                        />
                      )}
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Input 
                        placeholder="Optional notes"
                        value={newWorkEntry.notes}
                        onChange={(e) => setNewWorkEntry(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={addWorkEntry} 
                    className="mt-4 btn-accent"
                    disabled={!newWorkEntry.operativeId}
                  >
                    <Timer className="w-4 h-4 mr-2" />
                    Add Work Entry
                  </Button>
                </Card>

                {/* Work Entries List */}
                <div className="space-y-3">
                  {mockWorkEntries.map((entry) => {
                    const operative = mockOperatives.find(op => op.id === entry.operativeId);
                    return (
                      <Card key={entry.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {operative?.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{operative?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(entry.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="flex items-center space-x-1">
                                {entry.isFullDay ? (
                                  <Clock className="w-4 h-4 text-success" />
                                ) : (
                                  <Timer className="w-4 h-4 text-warning" />
                                )}
                                <span className="text-sm font-medium">
                                  {entry.isFullDay ? 'Full Day' : `${entry.hours}h`}
                                </span>
                              </div>
                            </div>

                            {entry.notes && (
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {entry.notes}
                              </div>
                            )}

                            {canEdit && (
                              <Button variant="ghost" size="sm">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rams" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">RAMS & Task Plans</h3>
                  {canEdit && (
                    <Button size="sm" className="btn-accent">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload RAMS
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {mockRAMS.map((rams) => (
                    <Card key={rams.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">{rams.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {rams.version} • Uploaded {new Date(rams.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <Badge variant={rams.status === 'active' ? 'default' : 'secondary'}>
                              {rams.status}
                            </Badge>
                          </div>

                          <div className="text-center">
                            <div className="text-sm">
                              Signed: {rams.signedCount}/{rams.totalRequired}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {rams.signedCount === rams.totalRequired ? '✅ Complete' : '⏳ Pending'}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            {canEdit && (
                              <Button variant="ghost" size="sm">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Activity Log</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border-l-2 border-primary">
                    <Activity className="w-4 h-4 mt-1 text-primary" />
                    <div>
                      <p className="text-sm">John Smith logged full day work</p>
                      <p className="text-xs text-muted-foreground">Today at 09:15</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border-l-2 border-success">
                    <CheckCircle2 className="w-4 h-4 mt-1 text-success" />
                    <div>
                      <p className="text-sm">RAMS signed by Mike Johnson</p>
                      <p className="text-xs text-muted-foreground">Yesterday at 16:30</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border-l-2 border-warning">
                    <Upload className="w-4 h-4 mt-1 text-warning" />
                    <div>
                      <p className="text-sm">New RAMS document uploaded</p>
                      <p className="text-xs text-muted-foreground">2 days ago at 14:20</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PlotDetailsCard;