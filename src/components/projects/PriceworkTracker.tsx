import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, DollarSign, Package, CheckCircle2, Clock } from 'lucide-react';

export interface WorkItem {
  id: string;
  name: string;
  category: string;
  agreedRate: number;
}

export interface PriceworkEntry {
  id: string;
  workItemId: string;
  unitsCompleted: number;
  agreedRate: number;
  subtotal: number;
  date: string;
  approvalStatus: 'pending' | 'approved' | 'adjusted';
  supervisorNotes?: string;
}

interface PriceworkTrackerProps {
  operativeId: string;
  date: string;
  existingEntries: PriceworkEntry[];
  availableWorkItems: WorkItem[];
  userRole: 'pm' | 'supervisor' | 'operative';
  onSave: (entries: PriceworkEntry[]) => void;
}

const PriceworkTracker = ({ 
  operativeId, 
  date, 
  existingEntries, 
  availableWorkItems, 
  userRole,
  onSave 
}: PriceworkTrackerProps) => {
  const [entries, setEntries] = useState<PriceworkEntry[]>(existingEntries);
  const [newEntry, setNewEntry] = useState({
    workItemId: '',
    unitsCompleted: 0
  });

  const canEdit = userRole === 'pm' || userRole === 'supervisor';
  const canApprove = userRole === 'supervisor' || userRole === 'pm';

  const addPriceworkEntry = () => {
    if (!newEntry.workItemId || newEntry.unitsCompleted <= 0) return;

    const workItem = availableWorkItems.find(item => item.id === newEntry.workItemId);
    if (!workItem) return;

    const entry: PriceworkEntry = {
      id: Date.now().toString(),
      workItemId: newEntry.workItemId,
      unitsCompleted: newEntry.unitsCompleted,
      agreedRate: workItem.agreedRate,
      subtotal: newEntry.unitsCompleted * workItem.agreedRate,
      date,
      approvalStatus: 'pending'
    };

    const updatedEntries = [...entries, entry];
    setEntries(updatedEntries);
    setNewEntry({ workItemId: '', unitsCompleted: 0 });
    onSave(updatedEntries);
  };

  const removeEntry = (entryId: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    setEntries(updatedEntries);
    onSave(updatedEntries);
  };

  const updateUnits = (entryId: string, units: number) => {
    if (units < 0) return;
    
    const updatedEntries = entries.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          unitsCompleted: units,
          subtotal: units * entry.agreedRate,
          approvalStatus: userRole === 'operative' ? 'pending' : entry.approvalStatus
        };
      }
      return entry;
    });
    setEntries(updatedEntries);
    onSave(updatedEntries);
  };

  const approveEntry = (entryId: string, notes?: string) => {
    if (!canApprove) return;
    
    const updatedEntries = entries.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          approvalStatus: 'approved' as const,
          supervisorNotes: notes
        };
      }
      return entry;
    });
    setEntries(updatedEntries);
    onSave(updatedEntries);
  };

  const totalPricework = entries.reduce((sum, entry) => sum + entry.subtotal, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New Piecework Entry */}
      <Card className="border-accent/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Add Piecework Entry</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Work Item</Label>
              <Select 
                value={newEntry.workItemId} 
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, workItemId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work item" />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{item.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          £{item.agreedRate}/unit
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Units Completed</Label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewEntry(prev => ({ 
                    ...prev, 
                    unitsCompleted: Math.max(0, prev.unitsCompleted - 1) 
                  }))}
                  disabled={newEntry.unitsCompleted <= 0}
                >
                  -
                </Button>
                <Input 
                  type="number"
                  min="0"
                  value={newEntry.unitsCompleted}
                  onChange={(e) => setNewEntry(prev => ({ 
                    ...prev, 
                    unitsCompleted: Math.max(0, parseInt(e.target.value) || 0) 
                  }))}
                  className="text-center"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewEntry(prev => ({ 
                    ...prev, 
                    unitsCompleted: prev.unitsCompleted + 1 
                  }))}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={addPriceworkEntry}
                disabled={!newEntry.workItemId || newEntry.unitsCompleted <= 0}
                className="w-full btn-accent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>

          {newEntry.workItemId && newEntry.unitsCompleted > 0 && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preview:</span>
                <span className="font-medium">
                  {newEntry.unitsCompleted} units × £{availableWorkItems.find(item => item.id === newEntry.workItemId)?.agreedRate || 0} = 
                  <span className="text-accent ml-1">
                    £{newEntry.unitsCompleted * (availableWorkItems.find(item => item.id === newEntry.workItemId)?.agreedRate || 0)}
                  </span>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Piecework Entries */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Today's Piecework Entries</h4>
          {entries.map((entry) => {
            const workItem = availableWorkItems.find(item => item.id === entry.workItemId);
            return (
              <Card key={entry.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(entry.approvalStatus)}
                    <div>
                      <p className="font-medium">{workItem?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {workItem?.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="flex items-center space-x-2">
                        {canEdit && entry.approvalStatus !== 'approved' ? (
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateUnits(entry.id, entry.unitsCompleted - 1)}
                              disabled={entry.unitsCompleted <= 0}
                            >
                              -
                            </Button>
                            <Input 
                              type="number"
                              min="0"
                              value={entry.unitsCompleted}
                              onChange={(e) => updateUnits(entry.id, parseInt(e.target.value) || 0)}
                              className="w-16 text-center"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateUnits(entry.id, entry.unitsCompleted + 1)}
                            >
                              +
                            </Button>
                          </div>
                        ) : (
                          <span className="font-medium">{entry.unitsCompleted} units</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @ £{entry.agreedRate}/unit
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium text-accent">
                          £{entry.subtotal}
                        </span>
                      </div>
                      {getStatusBadge(entry.approvalStatus)}
                    </div>

                    <div className="flex items-center space-x-2">
                      {canApprove && entry.approvalStatus === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => approveEntry(entry.id)}
                        >
                          Approve
                        </Button>
                      )}
                      {canEdit && entry.approvalStatus !== 'approved' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeEntry(entry.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {entry.supervisorNotes && (
                  <div className="mt-3 p-2 bg-muted/30 rounded text-sm">
                    <span className="font-medium">Supervisor Note:</span> {entry.supervisorNotes}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Daily Total */}
          <Card className="p-4 bg-accent/5 border-accent/20">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Piecework (Today)</span>
              <span className="text-xl font-bold text-accent">£{totalPricework}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {entries.filter(e => e.approvalStatus === 'approved').length} of {entries.length} entries approved
            </div>
          </Card>
        </div>
      )}

      {/* Compliance Banner */}
      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
        <p className="text-sm text-warning-foreground">
          <strong>Note:</strong> All units must match site inspection before approval. 
          Supervisor approval required before payment processing.
        </p>
      </div>
    </div>
  );
};

export default PriceworkTracker;
