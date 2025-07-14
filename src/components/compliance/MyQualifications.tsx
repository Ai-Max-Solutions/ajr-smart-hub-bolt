import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  Award,
  Edit,
  Trash2,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';

// Types for qualifications
interface Qualification {
  id: string;
  qualification_type: string;
  certificate_number: string | null;
  expiry_date: string | null;
  issue_date: string | null;
  issuing_body: string | null;
  document_url: string | null;
  photo_url: string | null;
  status: string | null;
  verification_status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface QualificationCategory {
  name: string;
  icon: string;
  color: string;
  qualifications: Qualification[];
}

interface QualificationsData {
  user_id: string;
  summary: {
    total: number;
    valid: number;
    warning: number;
    critical: number;
    expired: number;
  };
  categories: QualificationCategory[];
}

const QUALIFICATION_TYPES = [
  { value: 'CSCS Card', label: 'CSCS Card', required: true },
  { value: 'SSSTS Supervision', label: 'SSSTS Supervision', required: false },
  { value: 'SMSTS Management', label: 'SMSTS Management', required: false },
  { value: 'Gas Safe', label: 'Gas Safe', required: false },
  { value: 'Asbestos Awareness', label: 'Asbestos Awareness', required: false },
  { value: 'Confined Space', label: 'Confined Space', required: false },
  { value: 'Site Induction', label: 'Site Induction', required: false },
  { value: 'First Aid', label: 'First Aid', required: false },
  { value: 'Working at Height', label: 'Working at Height', required: false },
  { value: 'Manual Handling', label: 'Manual Handling', required: false },
];

const MyQualifications = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [qualificationsData, setQualificationsData] = useState<QualificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);
  const [qualificationToDelete, setQualificationToDelete] = useState<Qualification | null>(null);
  const [uploadForm, setUploadForm] = useState({
    qualification_type: '',
    certificate_number: '',
    expiry_date: '',
    issue_date: '',
    issuing_body: '',
    notes: '',
    file: null as File | null
  });

  useEffect(() => {
    if (user) {
      fetchQualifications();
    }
  }, [user]);

  const fetchQualifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_qualifications');
      
      if (error) {
        console.error('Error fetching qualifications:', error);
        toast({
          title: "Error",
          description: "Failed to load qualifications",
          variant: "destructive",
        });
        return;
      }

      // Safe type check and assignment
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setQualificationsData(data as unknown as QualificationsData);
      } else {
        // Handle case where no data or unexpected format
        setQualificationsData(null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load qualifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (qualification: Qualification) => {
    if (!qualification.expiry_date) {
      return <CheckCircle className="w-4 h-4 text-success" />;
    }

    const daysUntilExpiry = Math.ceil((new Date(qualification.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (qualification.status === 'expired' || daysUntilExpiry < 0) {
      return <X className="w-4 h-4 text-destructive" />;
    } else if (qualification.verification_status === 'pending') {
      return <Clock className="w-4 h-4 text-warning" />;
    } else if (daysUntilExpiry <= 14) {
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    } else if (qualification.verification_status === 'verified') {
      return <CheckCircle className="w-4 h-4 text-success" />;
    }
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (qualification: Qualification) => {
    if (!qualification.expiry_date) {
      return <Badge className="bg-success text-success-foreground">✅ Valid</Badge>;
    }

    const daysUntilExpiry = Math.ceil((new Date(qualification.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (qualification.status === 'expired' || daysUntilExpiry < 0) {
      return <Badge variant="destructive">❌ Expired</Badge>;
    } else if (qualification.verification_status === 'pending') {
      return <Badge variant="outline" className="text-warning border-warning">🕒 Pending</Badge>;
    } else if (daysUntilExpiry <= 14) {
      return <Badge variant="outline" className="text-warning border-warning">⚠️ Expiring Soon</Badge>;
    } else if (qualification.verification_status === 'verified') {
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.qualification_type || !uploadForm.certificate_number) {
      toast({
        title: "Missing Information",
        description: "Please fill in the qualification type and certificate number",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('upsert_qualification', {
        p_qualification_type: uploadForm.qualification_type,
        p_certificate_number: uploadForm.certificate_number,
        p_expiry_date: uploadForm.expiry_date || null,
        p_issue_date: uploadForm.issue_date || null,
        p_issuing_body: uploadForm.issuing_body || null,
        p_notes: uploadForm.notes || null,
      });

      if (error) {
        console.error('Error uploading qualification:', error);
        toast({
          title: "Error",
          description: "Failed to upload qualification",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Qualification uploaded successfully",
      });

      setIsUploadDialogOpen(false);
      setUploadForm({ 
        qualification_type: '', 
        certificate_number: '', 
        expiry_date: '', 
        issue_date: '', 
        issuing_body: '', 
        notes: '', 
        file: null 
      });
      fetchQualifications();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to upload qualification",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingQualification || !uploadForm.qualification_type || !uploadForm.certificate_number) {
      toast({
        title: "Missing Information",
        description: "Please fill in the qualification type and certificate number",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('upsert_qualification', {
        p_qualification_type_id: editingQualification.id,
        p_certificate_number: uploadForm.certificate_number,
        p_expiry_date: uploadForm.expiry_date || null,
        p_issue_date: uploadForm.issue_date || null,
        p_issuing_body: uploadForm.issuing_body || null,
        p_notes: uploadForm.notes || null,
        p_qualification_id: editingQualification.id,
      });

      if (error) {
        console.error('Error updating qualification:', error);
        toast({
          title: "Error",
          description: "Failed to update qualification",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Qualification updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingQualification(null);
      setUploadForm({ 
        qualification_type: '', 
        certificate_number: '', 
        expiry_date: '', 
        issue_date: '', 
        issuing_body: '', 
        notes: '', 
        file: null 
      });
      fetchQualifications();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update qualification",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!qualificationToDelete) return;

    try {
      const { error } = await supabase
        .from('qualifications')
        .delete()
        .eq('id', qualificationToDelete.id);

      if (error) {
        console.error('Error deleting qualification:', error);
        toast({
          title: "Error",
          description: "Failed to delete qualification",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Qualification deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setQualificationToDelete(null);
      fetchQualifications();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete qualification",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (qualification: Qualification) => {
    setEditingQualification(qualification);
    setUploadForm({
      qualification_type: qualification.qualification_type,
      certificate_number: qualification.certificate_number || '',
      expiry_date: qualification.expiry_date || '',
      issue_date: qualification.issue_date || '',
      issuing_body: qualification.issuing_body || '',
      notes: qualification.notes || '',
      file: null
    });
    setIsEditDialogOpen(true);
  };

  const handleDownload = (qualification: Qualification) => {
    if (qualification.document_url) {
      window.open(qualification.document_url, '_blank');
    } else {
      toast({
        title: "No Document",
        description: "No document available for download",
        variant: "destructive",
      });
    }
  };

  const expiringQualifications = qualificationsData?.categories.flatMap(cat => 
    cat.qualifications.filter(q => {
      if (!q.expiry_date) return false;
      const daysUntilExpiry = getDaysUntilExpiry(q.expiry_date);
      return daysUntilExpiry <= 42 && daysUntilExpiry > 0;
    })
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-aj-navy-deep to-aj-navy-light flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse" />
          <p className="text-white">Loading qualifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-aj-navy-deep to-aj-navy-light p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Qualifications</h1>
            <p className="text-white/80">
              Manage your certifications and training records
            </p>
          </div>
          <Shield className="w-8 h-8 text-accent" />
        </div>

        {/* Summary Cards */}
        {qualificationsData?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{qualificationsData.summary.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">{qualificationsData.summary.valid}</div>
                <div className="text-sm text-muted-foreground">Valid</div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning">{qualificationsData.summary.warning}</div>
                <div className="text-sm text-muted-foreground">Warning</div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning">{qualificationsData.summary.critical}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{qualificationsData.summary.expired}</div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Expiry Warnings */}
        {expiringQualifications.length > 0 && (
          <div className="mb-6">
            <Card className="border-warning bg-warning/10 card-hover">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-5 h-5" />
                  Expiry Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringQualifications.map((qual) => {
                  const daysLeft = getDaysUntilExpiry(qual.expiry_date!);
                  return (
                    <div key={qual.id} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg mb-2">
                      <div>
                        <div className="font-medium">{qual.qualification_type}</div>
                        <div className="text-sm text-muted-foreground">
                          Expires in {daysLeft} days ({new Date(qual.expiry_date!).toLocaleDateString()})
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(qual)}>
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
        <div className="mb-6">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 w-full md:w-auto">
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
                  <Select value={uploadForm.qualification_type} onValueChange={(value) => setUploadForm(prev => ({ ...prev, qualification_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select qualification type" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALIFICATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
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
                    value={uploadForm.certificate_number}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, certificate_number: e.target.value }))}
                    placeholder="Enter card number"
                  />
                </div>

                <div>
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={uploadForm.issue_date}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, issue_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={uploadForm.expiry_date}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="issuingBody">Issuing Body</Label>
                  <Input
                    id="issuingBody"
                    value={uploadForm.issuing_body}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, issuing_body: e.target.value }))}
                    placeholder="e.g., CITB, NEBOSH"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="file">Upload Evidence</Label>
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
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1">
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

        {/* Edit Qualification Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Qualification</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="editType">Qualification Type *</Label>
                <Input
                  id="editType"
                  value={uploadForm.qualification_type}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, qualification_type: e.target.value }))}
                  placeholder="Qualification type"
                />
              </div>

              <div>
                <Label htmlFor="editCardNumber">Card/Certificate Number *</Label>
                <Input
                  id="editCardNumber"
                  value={uploadForm.certificate_number}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, certificate_number: e.target.value }))}
                  placeholder="Enter card number"
                />
              </div>

              <div>
                <Label htmlFor="editIssueDate">Issue Date</Label>
                <Input
                  id="editIssueDate"
                  type="date"
                  value={uploadForm.issue_date}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, issue_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="editExpiryDate">Expiry Date</Label>
                <Input
                  id="editExpiryDate"
                  type="date"
                  value={uploadForm.expiry_date}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="editIssuingBody">Issuing Body</Label>
                <Input
                  id="editIssuingBody"
                  value={uploadForm.issuing_body}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, issuing_body: e.target.value }))}
                  placeholder="e.g., CITB, NEBOSH"
                />
              </div>

              <div>
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Update
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Qualification</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this qualification? This action cannot be undone.
                <br />
                <br />
                <strong>{qualificationToDelete?.qualification_type}</strong>
                <br />
                Certificate: {qualificationToDelete?.certificate_number}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Qualifications by Category */}
        {qualificationsData?.categories && qualificationsData.categories.length > 0 ? (
          <div className="space-y-6">
            {qualificationsData.categories.map((category) => (
              <Card key={category.name} className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.qualifications.map((qualification) => {
                      const daysUntilExpiry = qualification.expiry_date ? getDaysUntilExpiry(qualification.expiry_date) : null;
                      
                      return (
                        <Card key={qualification.id} className="border hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Award className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{qualification.qualification_type}</CardTitle>
                                  <p className="text-muted-foreground">
                                    {qualification.certificate_number ? `Certificate: ${qualification.certificate_number}` : 'No certificate number'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {getStatusIcon(qualification)}
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {qualification.issue_date && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Issue Date</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(qualification.issue_date).toLocaleDateString()}
                                  </div>
                                </div>
                              )}

                              {qualification.expiry_date && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Expiry Date</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(qualification.expiry_date).toLocaleDateString()}
                                    {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                                      <span className="ml-2">({daysUntilExpiry} days remaining)</span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {qualification.issuing_body && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Building className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Issuing Body</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {qualification.issuing_body}
                                  </div>
                                </div>
                              )}

                              {qualification.verified_by && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Verified By</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {qualification.verified_by}
                                    {qualification.verified_at && (
                                      <span className="block">on {new Date(qualification.verified_at).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {qualification.notes && (
                              <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Notes</span>
                                </div>
                                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                                  {qualification.notes}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {getStatusBadge(qualification)}
                              </div>

                              <div className="flex gap-2">
                                {qualification.document_url && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDownload(qualification)}
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </Button>
                                )}
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEdit(qualification)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>

                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setQualificationToDelete(qualification);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-hover">
            <CardContent className="pt-6 text-center">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Qualifications Found</h3>
              <p className="text-muted-foreground mb-4">
                Start by uploading your first qualification certificate
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Upload Qualification
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <div className="mt-8">
          <Card className="bg-muted/50 card-hover">
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
    </div>
  );
};

export default MyQualifications;