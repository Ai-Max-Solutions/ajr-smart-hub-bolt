import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, Clock, Upload, Download, Plus, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TrainingItem {
  id: string;
  type: string;
  title: string;
  requiredFor: string[];
  deliveryMethod: 'Face-to-Face' | 'Online Module' | 'Toolbox Talk';
  dateCompleted?: Date;
  nextDue?: Date;
  status: 'approved' | 'pending' | 'expired' | 'due-soon';
  evidence?: string;
  approvedBy?: string;
  version: string;
}

const MyTraining = () => {
  const [trainingItems, setTrainingItems] = useState<TrainingItem[]>([
    {
      id: '1',
      type: 'Induction',
      title: 'AJ Ryan General Site Induction',
      requiredFor: ['All Work Types'],
      deliveryMethod: 'Face-to-Face',
      dateCompleted: new Date('2024-01-15'),
      nextDue: new Date('2025-01-15'),
      status: 'approved',
      evidence: 'digital-signature-20240115.pdf',
      approvedBy: 'Mark Thompson',
      version: 'v2.1'
    },
    {
      id: '2',
      type: 'Toolbox Talk',
      title: 'Manual Handling Safety',
      requiredFor: ['General Construction', 'Site Labourer'],
      deliveryMethod: 'Toolbox Talk',
      dateCompleted: new Date('2024-06-10'),
      nextDue: new Date('2025-06-10'),
      status: 'approved',
      evidence: 'attendance-sheet-20240610.pdf',
      approvedBy: 'Sarah Wilson',
      version: 'v1.3'
    },
    {
      id: '3',
      type: 'Refresher',
      title: 'Asbestos Awareness Refresher',
      requiredFor: ['Demolition', 'Refurbishment'],
      deliveryMethod: 'Online Module',
      dateCompleted: new Date('2024-03-20'),
      nextDue: new Date('2025-03-20'),
      status: 'due-soon',
      evidence: 'certificate-20240320.pdf',
      approvedBy: 'James Roberts',
      version: 'v1.0'
    },
    {
      id: '4',
      type: 'Site Specific',
      title: 'Confined Space Entry Briefing',
      requiredFor: ['Confined Space Work'],
      deliveryMethod: 'Face-to-Face',
      status: 'pending',
      version: 'v1.1'
    }
  ]);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<TrainingItem | null>(null);
  const [uploadData, setUploadData] = useState({
    completionDate: '',
    evidence: null as File | null,
    notes: ''
  });

  const getStatusBadge = (status: TrainingItem['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      case 'due-soon':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><AlertTriangle className="w-3 h-3 mr-1" />Due Soon</Badge>;
      default:
        return null;
    }
  };

  const getDaysUntilExpiry = (nextDue?: Date) => {
    if (!nextDue) return null;
    const today = new Date();
    const timeDiff = nextDue.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const getCompletionPercentage = () => {
    const completed = trainingItems.filter(item => item.status === 'approved').length;
    return Math.round((completed / trainingItems.length) * 100);
  };

  const getExpiringCount = () => {
    return trainingItems.filter(item => {
      const days = getDaysUntilExpiry(item.nextDue);
      return days !== null && days <= 30 && days > 0;
    }).length;
  };

  const handleUploadEvidence = () => {
    if (!selectedTraining) return;

    // Simulate upload
    const updatedItems = trainingItems.map(item => 
      item.id === selectedTraining.id 
        ? { 
            ...item, 
            status: 'pending' as const,
            dateCompleted: new Date(uploadData.completionDate),
            evidence: uploadData.evidence?.name || 'uploaded-evidence.pdf'
          }
        : item
    );
    
    setTrainingItems(updatedItems);
    setUploadDialogOpen(false);
    setSelectedTraining(null);
    setUploadData({ completionDate: '', evidence: null, notes: '' });
    
    toast({
      title: "Evidence Uploaded",
      description: "Your training evidence has been submitted for approval."
    });
  };

  const handleDownloadEvidence = (evidence: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${evidence}`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Training</h1>
          <p className="text-muted-foreground">Track your training progress and compliance status</p>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Training Completion</span>
                <span className="text-sm text-muted-foreground">{getCompletionPercentage()}%</span>
              </div>
              <Progress value={getCompletionPercentage()} className="h-2" />
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">{trainingItems.filter(i => i.status === 'approved').length}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">{getExpiringCount()}</div>
                  <div className="text-sm text-muted-foreground">Expiring Soon</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiry Warning */}
        {getExpiringCount() > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  You have {getExpiringCount()} training item{getExpiringCount() !== 1 ? 's' : ''} expiring within 30 days
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Training Items */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Training Items</h2>
        
        {trainingItems.map((item) => {
          const daysUntilExpiry = getDaysUntilExpiry(item.nextDue);
          
          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.type} • {item.deliveryMethod} • Version {item.version}
                    </p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Required For:</p>
                    <p className="text-sm text-muted-foreground">{item.requiredFor.join(', ')}</p>
                  </div>
                  
                  {item.dateCompleted && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-foreground">Completed:</p>
                        <p className="text-muted-foreground">{item.dateCompleted.toLocaleDateString()}</p>
                      </div>
                      {item.nextDue && (
                        <div>
                          <p className="font-medium text-foreground">Next Due:</p>
                          <p className={`${daysUntilExpiry && daysUntilExpiry <= 30 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {item.nextDue.toLocaleDateString()}
                            {daysUntilExpiry !== null && (
                              <span className="ml-1">
                                ({daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {item.approvedBy && (
                    <div>
                      <p className="text-sm"><span className="font-medium">Approved by:</span> {item.approvedBy}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {item.evidence && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadEvidence(item.evidence!)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download Evidence
                      </Button>
                    )}
                    
                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTraining(item)}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload New Evidence
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload Training Evidence</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="completion-date">Completion Date</Label>
                            <Input
                              id="completion-date"
                              type="date"
                              value={uploadData.completionDate}
                              onChange={(e) => setUploadData(prev => ({ ...prev, completionDate: e.target.value }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="evidence-file">Evidence File</Label>
                            <Input
                              id="evidence-file"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => setUploadData(prev => ({ ...prev, evidence: e.target.files?.[0] || null }))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Any additional notes about this training..."
                              value={uploadData.notes}
                              onChange={(e) => setUploadData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button onClick={handleUploadEvidence} className="flex-1">
                              Upload Evidence
                            </Button>
                            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyTraining;