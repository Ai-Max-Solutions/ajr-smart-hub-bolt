import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  Upload, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  X,
  Plus,
  Calendar,
  FileText,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

// Types for qualifications
interface Qualification {
  id: string;
  type: string;
  cardNumber: string;
  expiryDate: string;
  uploadedEvidence?: string;
  approvedBy?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  rejectionReason?: string;
  lastVerified?: string;
  nextReminder?: string;
  uploadedDate: string;
  requiredFor: string[];
}

const QUALIFICATION_TYPES = [
  { value: 'cscs', label: 'CSCS Card', required: true },
  { value: 'sssts', label: 'SSSTS Supervision', required: false },
  { value: 'smsts', label: 'SMSTS Management', required: false },
  { value: 'gas-safe', label: 'Gas Safe', required: false },
  { value: 'asbestos', label: 'Asbestos Awareness', required: false },
  { value: 'confined-space', label: 'Confined Space', required: false },
  { value: 'induction', label: 'Site Induction', required: false },
  { value: 'first-aid', label: 'First Aid', required: false },
];

const MyQualifications = () => {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    type: '',
    cardNumber: '',
    expiryDate: '',
    file: null as File | null
  });

  // Mock data - in real app this would come from API
  const mockQualifications: Qualification[] = [
    {
      id: '1',
      type: 'CSCS Card',
      cardNumber: 'CS123456789',
      expiryDate: '2025-12-31',
      approvalStatus: 'approved',
      approvedBy: 'Jane Doe',
      lastVerified: '2024-01-15',
      uploadedDate: '2024-01-10',
      requiredFor: ['General Construction', '1st Fix Carpentry']
    },
    {
      id: '2',
      type: 'Gas Safe',
      cardNumber: 'GS987654321',
      expiryDate: '2025-03-15',
      approvalStatus: 'approved',
      approvedBy: 'Mark Williams',
      lastVerified: '2024-01-15',
      uploadedDate: '2024-01-12',
      requiredFor: ['Gas Installation', 'Boiler Servicing']
    },
    {
      id: '3',
      type: 'Asbestos Awareness',
      cardNumber: 'AA456789123',
      expiryDate: '2024-08-30',
      approvalStatus: 'expired',
      approvedBy: 'Jane Doe',
      lastVerified: '2023-08-25',
      uploadedDate: '2023-08-20',
      requiredFor: ['Demolition Work', 'Refurbishment']
    },
    {
      id: '4',
      type: 'SSSTS Supervision',
      cardNumber: 'SS789123456',
      expiryDate: '2025-06-20',
      approvalStatus: 'pending',
      uploadedDate: '2024-01-20',
      requiredFor: ['Supervision', 'Team Leading']
    }
  ];

  const getStatusIcon = (status: Qualification['approvalStatus'], expiryDate: string) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (status === 'expired' || daysUntilExpiry < 0) {
      return <X className="w-4 h-4 text-destructive" />;
    } else if (status === 'pending') {
      return <Clock className="w-4 h-4 text-warning" />;
    } else if (daysUntilExpiry <= 14) {
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    } else if (status === 'approved') {
      return <CheckCircle className="w-4 h-4 text-success" />;
    }
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (status: Qualification['approvalStatus'], expiryDate: string) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (status === 'expired' || daysUntilExpiry < 0) {
      return <Badge variant="destructive">❌ Expired</Badge>;
    } else if (status === 'pending') {
      return <Badge variant="outline" className="text-warning border-warning">🕒 Pending</Badge>;
    } else if (daysUntilExpiry <= 14) {
      return <Badge variant="outline" className="text-warning border-warning">⚠️ Expiring Soon</Badge>;
    } else if (status === 'approved') {
      return <Badge className="bg-success text-success-foreground">✅ Valid</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.type || !uploadForm.cardNumber || !uploadForm.expiryDate || !uploadForm.file) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload a file",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Qualification Uploaded",
      description: `${uploadForm.type} uploaded successfully - pending approval`,
    });

    setIsUploadDialogOpen(false);
    setUploadForm({ type: '', cardNumber: '', expiryDate: '', file: null });
  };

  const handleDownload = (qualification: Qualification) => {
    toast({
      title: "Download Started",
      description: `Downloading ${qualification.type} certificate`,
    });
  };

  const expiringQualifications = mockQualifications.filter(q => {
    const daysUntilExpiry = getDaysUntilExpiry(q.expiryDate);
    return daysUntilExpiry <= 42 && daysUntilExpiry > 0; // Expiring within 6 weeks
  });

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">My Qualifications</CardTitle>
                <p className="text-primary-foreground/80">
                  Manage your certifications and training records
                </p>
              </div>
              <Shield className="w-8 h-8 text-accent" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Expiry Warnings */}
      {expiringQualifications.length > 0 && (
        <div className="max-w-4xl mx-auto mb-6">
          <Card className="border-warning bg-warning/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                Expiry Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringQualifications.map((qual) => {
                const daysLeft = getDaysUntilExpiry(qual.expiryDate);
                return (
                  <div key={qual.id} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg mb-2">
                    <div>
                      <div className="font-medium">{qual.type}</div>
                      <div className="text-sm text-muted-foreground">
                        Expires in {daysLeft} days ({new Date(qual.expiryDate).toLocaleDateString()})
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Renew
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload New Qualification */}
      <div className="max-w-4xl mx-auto mb-6">
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-accent w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Upload New Qualification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New Qualification</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Qualification Type *</Label>
                <Select value={uploadForm.type} onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select qualification type" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALIFICATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.label}>
                        {type.label} {type.required && '(Required)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cardNumber">Card/Certificate Number *</Label>
                <Input
                  id="cardNumber"
                  value={uploadForm.cardNumber}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                  placeholder="Enter card number"
                />
              </div>

              <div>
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={uploadForm.expiryDate}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="file">Upload Evidence *</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a clear photo or PDF of your certificate
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="btn-primary flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Qualifications List */}
      <div className="max-w-4xl mx-auto space-y-4">
        {mockQualifications.map((qualification) => {
          const daysUntilExpiry = getDaysUntilExpiry(qualification.expiryDate);
          
          return (
            <Card key={qualification.id} className="card-hover">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{qualification.type}</CardTitle>
                      <p className="text-muted-foreground">
                        Card: {qualification.cardNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusIcon(qualification.approvalStatus, qualification.expiryDate)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Expiry Date</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(qualification.expiryDate).toLocaleDateString()}
                      {daysUntilExpiry > 0 && (
                        <span className="ml-2">({daysUntilExpiry} days remaining)</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Required For</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {qualification.requiredFor.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(qualification.approvalStatus, qualification.expiryDate)}
                    
                    {qualification.approvalStatus === 'approved' && qualification.approvedBy && (
                      <span className="text-xs text-muted-foreground">
                        Approved by {qualification.approvedBy}
                      </span>
                    )}
                    
                    {qualification.approvalStatus === 'rejected' && qualification.rejectionReason && (
                      <span className="text-xs text-destructive">
                        Rejected: {qualification.rejectionReason}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownload(qualification)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    
                    {(qualification.approvalStatus === 'expired' || daysUntilExpiry <= 0) && (
                      <Button size="sm" className="btn-accent">
                        <Upload className="w-4 h-4 mr-1" />
                        Renew
                      </Button>
                    )}
                  </div>
                </div>

                {qualification.approvalStatus === 'rejected' && qualification.rejectionReason && (
                  <>
                    <Separator className="my-3" />
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                        <X className="w-4 h-4" />
                        Rejection Reason
                      </div>
                      <div className="text-destructive text-sm mt-1">
                        {qualification.rejectionReason}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto mt-8">
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              <Shield className="w-4 h-4 inline mr-2" />
              Keep your qualifications up to date to ensure uninterrupted work assignments.
              Contact your supervisor if you need help with renewals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyQualifications;