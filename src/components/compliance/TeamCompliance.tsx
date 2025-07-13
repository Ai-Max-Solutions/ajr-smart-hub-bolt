import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  CheckCircle, 
  X, 
  Clock, 
  AlertTriangle, 
  Filter,
  Eye,
  Shield,
  Calendar,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types
interface TeamMember {
  id: string;
  name: string;
  role: string;
  cscsStatus: 'valid' | 'expiring' | 'expired' | 'missing';
  sstsStatus: 'valid' | 'expiring' | 'expired' | 'missing';
  gasSafeStatus: 'valid' | 'expiring' | 'expired' | 'missing';
  asbestosStatus: 'valid' | 'expiring' | 'expired' | 'missing';
  overallCompliance: number;
  pendingApprovals: number;
  lastUpdated: string;
}

interface PendingApproval {
  id: string;
  operativeName: string;
  qualificationType: string;
  cardNumber: string;
  expiryDate: string;
  uploadedDate: string;
  evidenceUrl: string;
}

const TeamCompliance = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Mock data
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'John Smith',
      role: 'Carpenter',
      cscsStatus: 'valid',
      sstsStatus: 'missing',
      gasSafeStatus: 'missing',
      asbestosStatus: 'expiring',
      overallCompliance: 75,
      pendingApprovals: 1,
      lastUpdated: '2024-01-20'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      role: 'Plumber',
      cscsStatus: 'valid',
      sstsStatus: 'valid',
      gasSafeStatus: 'valid',
      asbestosStatus: 'valid',
      overallCompliance: 100,
      pendingApprovals: 0,
      lastUpdated: '2024-01-19'
    },
    {
      id: '3',
      name: 'Mike Davis',
      role: 'Electrician',
      cscsStatus: 'expired',
      sstsStatus: 'missing',
      gasSafeStatus: 'missing',
      asbestosStatus: 'missing',
      overallCompliance: 25,
      pendingApprovals: 2,
      lastUpdated: '2024-01-18'
    }
  ];

  const pendingApprovals: PendingApproval[] = [
    {
      id: '1',
      operativeName: 'John Smith',
      qualificationType: 'SSSTS Supervision',
      cardNumber: 'SS789123456',
      expiryDate: '2025-06-20',
      uploadedDate: '2024-01-20',
      evidenceUrl: '/documents/johns-sssts.pdf'
    },
    {
      id: '2',
      operativeName: 'Mike Davis',
      qualificationType: 'CSCS Card',
      cardNumber: 'CS111222333',
      expiryDate: '2025-12-31',
      uploadedDate: '2024-01-19',
      evidenceUrl: '/documents/mikes-cscs.jpg'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'expiring':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'expired':
        return <X className="w-4 h-4 text-destructive" />;
      case 'missing':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-success text-success-foreground text-xs">Valid</Badge>;
      case 'expiring':
        return <Badge variant="outline" className="text-warning border-warning text-xs">Expiring</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="text-xs">Expired</Badge>;
      case 'missing':
        return <Badge variant="outline" className="text-xs">Missing</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 80) return 'text-success';
    if (compliance >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const handleApprove = (approval: PendingApproval) => {
    toast({
      title: "Qualification Approved",
      description: `${approval.operativeName}'s ${approval.qualificationType} has been approved`,
    });
    setSelectedApproval(null);
  };

  const handleReject = (approval: PendingApproval) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Qualification Rejected",
      description: `${approval.operativeName}'s ${approval.qualificationType} has been rejected`,
    });
    setSelectedApproval(null);
    setRejectionReason('');
  };

  const filteredTeamMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filter) {
      case 'compliant':
        return matchesSearch && member.overallCompliance === 100;
      case 'non-compliant':
        return matchesSearch && member.overallCompliance < 100;
      case 'pending':
        return matchesSearch && member.pendingApprovals > 0;
      default:
        return matchesSearch;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Team Compliance</CardTitle>
              <p className="text-primary-foreground/80">
                Monitor and approve team qualifications
              </p>
            </div>
            <Users className="w-8 h-8 text-accent" />
          </div>
        </CardHeader>
      </Card>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-warning">
              <Clock className="w-5 h-5" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div>
                    <div className="font-medium">{approval.operativeName}</div>
                    <div className="text-sm text-muted-foreground">
                      {approval.qualificationType} • Card: {approval.cardNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Uploaded: {new Date(approval.uploadedDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedApproval(approval)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Review Qualification</DialogTitle>
                        </DialogHeader>
                        {selectedApproval && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Operative:</span>
                                <div className="text-muted-foreground">{selectedApproval.operativeName}</div>
                              </div>
                              <div>
                                <span className="font-medium">Type:</span>
                                <div className="text-muted-foreground">{selectedApproval.qualificationType}</div>
                              </div>
                              <div>
                                <span className="font-medium">Card Number:</span>
                                <div className="text-muted-foreground">{selectedApproval.cardNumber}</div>
                              </div>
                              <div>
                                <span className="font-medium">Expiry:</span>
                                <div className="text-muted-foreground">{new Date(selectedApproval.expiryDate).toLocaleDateString()}</div>
                              </div>
                            </div>
                            
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <div className="text-sm font-medium mb-2">Evidence Document</div>
                              <div className="text-xs text-muted-foreground">
                                Click to view uploaded evidence: {selectedApproval.evidenceUrl.split('/').pop()}
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                              <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                className="mt-1"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleApprove(selectedApproval)}
                                className="btn-primary flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleReject(selectedApproval)}
                                className="flex-1"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="compliant">100% Compliant</SelectItem>
                <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                <SelectItem value="pending">Pending Approvals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Compliance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Team Compliance Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>CSCS</TableHead>
                  <TableHead>SSTS</TableHead>
                  <TableHead>Gas Safe</TableHead>
                  <TableHead>Asbestos</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.role}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(member.cscsStatus)}
                        {getStatusBadge(member.cscsStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(member.sstsStatus)}
                        {getStatusBadge(member.sstsStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(member.gasSafeStatus)}
                        {getStatusBadge(member.gasSafeStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(member.asbestosStatus)}
                        {getStatusBadge(member.asbestosStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getComplianceColor(member.overallCompliance)}`}>
                        {member.overallCompliance}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {member.pendingApprovals > 0 ? (
                        <Badge variant="outline" className="text-warning border-warning">
                          {member.pendingApprovals}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
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

export default TeamCompliance;